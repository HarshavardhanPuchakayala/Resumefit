# ResumeFit: Problem Statement, v1 Scope and Acceptance Criteria

## Problem statement

Job seekers with about 2 years of experience who are switching jobs usually send one generic resume to every company. It rarely matches each job description, so ATS (Applicant Tracking System) filters reject it and they get no calls or replies.

Tools like ChatGPT can tailor a resume, but they require pasting personal details (name, phone, email) into a third-party AI. To avoid this, users swap in fake details by hand, then restore the real ones and fix broken formatting (missing spaces, wrong fonts and sizes) afterwards. This is slow and error-prone.

**ResumeFit** lets a user build their resume once, paste any job description, and get a match score, matched and missing keywords, and suggested changes, then download an ATS-friendly PDF or DOCX. Personal details never reach the AI.

## Primary user (v1)

A developer with about 2 years of real work experience who is switching jobs and applying to specific roles.

## Core principles

1. **The AI never adds skills or experience silently.** Missing skills are shown as "Learn these". A skill is added to the resume only after the user confirms "I know this".
2. **Personal data stays private.** Name, phone and email are never sent to the AI.
3. **Suggest, don't overwrite.** The AI suggests changes; the user decides what to apply.

## v1 scope

In scope:
1. Sign up and login
2. Fill the resume once using a structured form (job experience, projects, skills, education)
3. Paste a job description
4. Match score, matched and missing keywords, suggested changes
5. Download as PDF and DOCX
6. Personal details stripped before anything goes to the AI

Out of scope (v2):
- AI rewriting every bullet automatically
- Multiple resume templates
- AI guidance on every form box (spelling and wording help while filling)
- Fresher-specific flow (project-focused resumes)

## Acceptance criteria (v1)

1. A user can sign up, log in, and see only their own resume.
2. A user can fill the resume form once, save it, and see it again after logging out and back in.
3. A user can paste a job description and get a match score from 0 to 100.
4. A user can see which keywords from the job description are present in their resume and which are missing.
5. A user can download their resume as a PDF or DOCX with selectable text.
6. The system never sends name, phone or email to the AI, and the exact text sent can be shown as proof.

## Constraints

- Everything runs on free tiers (free LLM APIs with provider fallbacks, Neon Postgres, Upstash Redis, Render and Vercel).
- Keep AI calls per request low.