# ResumeFit: Decision Log

A record of important design decisions and the reasons behind them.

---

## Decision 1: How to store a resume in the database

**Date:** 2026-10-29
**Status:** Accepted

### Decision

Store the resume content as a single **JSONB** column in PostgreSQL, and keep the user's contact details (name, phone, email) in a **separate column**.

### Table layout

```
users
  id              primary key
  email           unique, used for login
  password_hash   never store plain passwords

resumes
  id              primary key
  user_id         foreign key to users.id
  contact         name, phone, email (kept separate on purpose)
  content         JSONB: experience, projects, skills, education
  updated_at      timestamp
```

### Reasons

1. **Privacy by design.** Only the `content` column is ever sent to the AI. Contact details live in a different column, so they cannot leak by accident.
2. **A resume is always read and saved as a whole.** Splitting it into several tables (experiences, projects, skills, education) would need joins on every page load, with no benefit in v1.
3. **Keyword matching is simple.** The app loops over the sections inside the JSON and checks each one for matched and missing keywords.
4. **v2 still works.** Supporting several resumes per user only means more rows in `resumes`.

### Known gap and mitigation

Users may type their name, phone number or company email inside free text (for example, a bullet point). Separating the contact column does not catch this.

**Mitigation:** before sending any text to the AI, scrub the user's own name, phone and email (taken from the `contact` column) out of `content`. Log the exact text sent to the AI during testing, as proof for acceptance criterion 6.

### Alternatives considered

- **Separate tables per section.** Better when queries span many resumes (for example, "find all users who know Java"). ResumeFit never needs that in v1, so the extra complexity is not justified.

### When to revisit

If we add features that search or analyse across many users' resumes, move the sections into their own tables.