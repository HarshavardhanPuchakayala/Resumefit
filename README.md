# ResumeFit

**Build your resume once. Tailor it to any job description. Your personal details never reach the AI.**

ResumeFit is a resume builder and job-match tool for developers who are switching jobs. You fill in your resume once, paste a job description, and get a match score, matched and missing keywords, and AI-suggested bullet rewrites that you accept or reject one by one. Then you download an ATS-friendly PDF or DOCX.

> Status: v1 backend and frontend are built and tested locally. Deployment is the next milestone.

<!-- TODO: add a screenshot of the Match page here -->
<!-- TODO: add the demo video link here -->
<!-- TODO: add the live demo link here once deployed -->

---

## The problem

Job seekers with about 2 years of experience who are switching jobs usually send one generic resume to every company. It rarely matches each job description, so ATS (Applicant Tracking System) filters reject it and they get no calls or replies.

Tools like ChatGPT can tailor a resume, but they require pasting personal details (name, phone, email) into a third-party AI. To avoid this, people swap in fake details by hand, then restore the real ones and fix broken formatting (missing spaces, wrong fonts and sizes) afterwards. This is slow and error-prone.

ResumeFit fixes this: the resume is stored as structured data, personal details are kept apart from everything the AI sees, and the PDF/DOCX is generated from one clean template, so formatting never breaks.

Full write-up: [docs/PROBLEM.md](docs/PROBLEM.md)

## Features

- **Sign up and log in** with hashed passwords (argon2) and JWT tokens
- **Structured resume form**: contact, headline, summary, grouped skills, experience, projects, education
- **Keyword match (no AI)**: paste a job description and get a 0-100 score, matched keywords, missing keywords, and tips
- **AI bullet suggestions**: rewrites that use the job description's wording, shown as original vs suggested
- **Accept or reject every suggestion**: nothing changes in your resume without your approval
- **"Show what the AI sees"**: view the exact text that would be sent to the AI before any call
- **PDF and DOCX download**: one-column, plain-text layout with selectable text, which is what ATS software parses best

## Design principles

1. **The AI never adds skills silently.** A rewrite may only use skills your resume already contains. Any skill added to a bullet is flagged "Confirm you really used this". Skills missing from your resume are shown as "learn these", never added.
2. **Personal data stays private.** Name, phone, email and links are never sent to the AI.
3. **Suggest, don't overwrite.** The AI proposes. You decide.
4. **Never trust the AI's output.** Every suggestion is validated by code before you see it.

## How privacy works

Two layers, plus a safety net:

| Layer | What it does |
|---|---|
| **1. Storage split** | Contact details live in a separate database column (`contact`). The AI only ever reads the `content` column. |
| **2. Free-text scrubbing** | Emails, links, phone numbers, and your own name and links are removed from the text inside bullets and summaries (`privacy.py`). |
| **3. Fail closed** | After scrubbing, a checker re-scans the text for any contact value. If one survives, the request is blocked instead of sent. |

All AI input comes from one function, `build_ai_view()`, so there is a single place to audit. The job description is scrubbed too, in case someone pastes personal details into it.

**How AI suggestions are validated** (`suggest.py`): a suggestion is dropped if it has an unknown bullet id, contains a placeholder, email, link or phone number, introduces a skill that is not in your resume, or introduces a number that was not in the original bullet.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React (Vite), React Router, Tailwind CSS |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL (Neon), resume stored as JSONB |
| AI | OpenRouter free models with ordered fallback |
| Documents | python-docx (DOCX), ReportLab (PDF) |
| Auth | argon2 password hashing, JWT |
| Tooling | uv (Python packages), npm |

Everything is designed to run on free tiers.

## Architecture

```
React (Vite)                FastAPI                         External
-------------               -------------------------       ------------------
Login / Signup  --JWT-->    /auth        argon2 + JWT
Resume form     ------->    /resume      contact | content  --> Neon Postgres
Match page      ------->    /match       keyword scoring        (JSONB columns)
                            /ai/suggest  build_ai_view()
                                           |  scrub + verify
                                           v
                                         llm.py  ---------->  OpenRouter
                                           |                   (free models,
                                           v                    ordered fallback)
                                         validate_suggestions()
Download        ------->    /export      PDF / DOCX
```

**Key decision: resume stored as one JSONB document** (not many tables). A resume is always read and saved whole, the privacy split is physical (`contact` vs `content`), and keyword matching just walks the JSON. Several resumes per user later means several rows. The reasoning is in [docs/DECISIONS.md](docs/DECISIONS.md).

## Project structure

```
resumefit/
├── backend/
│   ├── main.py             app, CORS, routers
│   ├── db.py               engine and session
│   ├── models.py           users, resumes tables
│   ├── security.py         password hashing, JWT helpers
│   ├── auth.py             signup, login, current user
│   ├── schemas.py          auth request/response models
│   ├── resume_schemas.py   resume shape and size limits
│   ├── resume_routes.py    GET / PUT /resume
│   ├── privacy.py          scrub personal data, fail-closed check
│   ├── matching.py         keyword extraction and scoring
│   ├── match_routes.py     /match and /match/ai-preview
│   ├── llm.py              OpenRouter calls with model fallback
│   ├── suggest.py          prompt building and output validation
│   ├── ai_routes.py        /ai/suggest and /ai/apply
│   ├── export.py           PDF and DOCX generation
│   ├── export_routes.py    /export/pdf and /export/docx
│   └── test_*.py           tests (no API key needed)
├── frontend/
│   └── src/                pages, auth context, API helper
└── docs/
    ├── PROBLEM.md          problem statement, scope, acceptance criteria
    └── DECISIONS.md        design decisions
```

## Getting started

### Prerequisites

- Python 3.13 and [uv](https://docs.astral.sh/uv/)
- Node.js 20 or newer
- A free [Neon](https://neon.tech) Postgres database
- A free [OpenRouter](https://openrouter.ai) API key

### 1. Backend

```bash
cd backend
uv sync
```

Create `backend/.env` from the example (`copy .env.example .env` on Windows, `cp .env.example .env` on macOS/Linux) and fill in your values:

```
DATABASE_URL=postgresql+psycopg://user:password@host/dbname?sslmode=require
JWT_SECRET=a-long-random-string
OPENROUTER_API_KEY=your-openrouter-key
MODELS=google/gemma-4-31b-it:free,nvidia/nemotron-3-ultra-550b-a55b:free
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Generate a secret with:
```bash
uv run python -c "import secrets; print(secrets.token_hex(32))"
```

Run the server:
```bash
uv run uvicorn main:app --reload
```

The API docs open at `http://127.0.0.1:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | backend | Neon connection string (use the `postgresql+psycopg://` prefix) |
| `JWT_SECRET` | backend | Signs login tokens. Never commit it. |
| `OPENROUTER_API_KEY` | backend | OpenRouter key for AI suggestions |
| `MODELS` | backend | Comma-separated model IDs, tried in order |
| `CORS_ORIGINS` | backend | Allowed frontend addresses |
| `VITE_API_URL` | frontend | Backend address. Public, so never put a secret here. |

`.env` files are git-ignored. Only `.env.example` files are committed.

If a model returns a 404, open the OpenRouter models page, filter by free, and copy the exact model ID into `MODELS`. Free models change over time and have daily limits.

## API overview

All routes except `/auth/signup`, `/auth/login` and `/health*` require a `Bearer` token.

| Method | Route | What it does |
|---|---|---|
| POST | `/auth/signup` | Create an account |
| POST | `/auth/login` | Get an access token |
| GET | `/auth/me` | Current user |
| GET | `/resume` | Load your resume (empty if none) |
| PUT | `/resume` | Save your resume |
| GET | `/match/ai-preview` | The scrubbed text the AI would see |
| POST | `/match` | Keyword match, score and tips (no AI) |
| POST | `/ai/suggest` | AI bullet suggestions. `preview_only: true` returns the exact prompt with no AI call |
| POST | `/ai/apply` | Apply one accepted suggestion |
| GET | `/export/pdf` | Download PDF |
| GET | `/export/docx` | Download DOCX |
| GET | `/health`, `/health/db` | Server and database checks |

## Tests

These run without any API key:

```bash
cd backend
uv run python test_privacy.py     # personal data removed, keywords intact
uv run python test_matching.py    # scoring and whole-word matching
uv run python test_suggest.py     # every unsafe AI suggestion is rejected
uv run python test_llm.py         # messy model replies are parsed safely
```

## v1 acceptance criteria

1. A user can sign up, log in, and see only their own resume.
2. A user can fill the resume form once, save it, and see it again after logging out and back in.
3. A user can paste a job description and get a match score from 0 to 100.
4. A user can see which keywords from the job description are present and which are missing.
5. A user can download their resume as a PDF or DOCX with selectable text.
6. The system never sends name, phone or email to the AI, and the exact text sent can be shown as proof.

## Known limitations

- **Keyword list is fixed.** Matching uses a built-in skills dictionary (`matching.py`). Skills outside it are not detected until added.
- **Privacy filter is not a guarantee.** A nickname, initials or a street address typed into a bullet can slip through. That is why the app shows "what the AI sees" before any call.
- **Names that are common words** (for example "Rose") are also hidden in bullets, so the AI sees slightly less text. Over-hiding is safer than leaking.
- **PDF uses a Latin font.** Characters outside it (for example Hindi) do not render in the PDF.
- **AI rate limit is in memory.** The 10-calls-per-hour cap resets when the server restarts. Redis is the planned replacement.
- **Token in `localStorage`.** Fine for local development; an httpOnly cookie is planned before deployment.
- **Free AI models vary in quality and availability**, and may log prompts. This is the reason personal data is stripped first.
- **One resume per user** in v1.

## Roadmap

- [ ] Deploy backend (Render) and frontend (Vercel)
- [ ] httpOnly cookie authentication
- [ ] Redis-backed rate limiting (Upstash)
- [ ] Alembic database migrations
- [ ] AI guidance while filling the form (spelling and wording help)
- [ ] Multiple resume templates and multiple resumes per user
- [ ] Fresher flow focused on projects

## License

