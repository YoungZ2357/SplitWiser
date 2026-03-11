---
trigger: always_on
---

# CLAUDE.md — SplitWiser (Backend)

This file is for Claude Code CLI. It defines how Claude should behave when working on the backend of SplitWiser.

## 1. Role Scope

You are working on the **backend only**. Reghu owns:
- API routes (`src/app/api/`)
- Database schema and migrations (`supabase/migrations/`)
- Supabase Auth + RLS policies
- Shared types (`src/types/index.ts`)
- Shared logic (`src/lib/split-engine.ts`, `src/lib/validators.ts`)
- Gemini integration (`src/lib/gemini.ts`)
- Supabase client config (`src/lib/supabase/`)
- Auth middleware (`src/middleware.ts`)
- CI/CD pipeline (`.github/workflows/ci.yml`)
- Tests (`tests/unit/`, `tests/integration/`, `tests/e2e/`)
- API documentation (`docs/api.md`)

**Do NOT create or modify** anything in `src/components/`, `src/hooks/`, or page-level UI files. Those belong to Qingyang (frontend).

## 2. Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **Database:** Supabase (PostgreSQL + Auth + Storage)
- **AI:** Google Gemini API (`gemini-2.0-flash`) via `@google/generative-ai`
- **Validation:** Zod
- **Testing:** Vitest (unit + integration), Playwright (E2E in Sprint 3)
- **CI:** GitHub Actions

## 3. PRD Is the Source of Truth

The file `prd_v2.md` in the project root contains all product requirements.

- Follow the PRD exactly. Do not add endpoints, fields, or behaviors not described in the PRD.
- **⚠️ If you need to deviate from the PRD for any reason (technical limitation, ambiguity, better approach), STOP and tell me before proceeding. Do not silently deviate.**
- **⚠️ If any requirement in the PRD is unclear or missing detail, ASK a clarifying question before implementing. Do not guess.**

## 4. Code Quality

- All code must be TypeScript. No `.js` files.
- No `any` types unless absolutely necessary and documented with a comment explaining why.
- Use the shared types from `src/types/index.ts` for all API request/response shapes and DB models.
- Keep API route handlers thin. Business logic goes in separate utility functions or the split engine.
- Validate all incoming request bodies with Zod schemas from `src/lib/validators.ts`.
- Run `npm run lint` and `npx tsc --noEmit` before considering any task done.

## 5. Database Rules

- All tables defined in `supabase/migrations/`. One migration file per schema change.
- Use UUIDs for all primary keys (`gen_random_uuid()`).
- RLS policies must be applied to every table. The PRD specifies exact policies. Follow them.
- When creating bills, insert into `bills`, `bill_items`, `participants`, and `item_assignments` in a single transaction.
- The `assignments` field in API requests uses index-based references (`item_index`, `participant_index`). Map these to actual UUIDs after inserting items and participants.

## 6. API Rules

- All routes under `src/app/api/`.
- All request/response bodies are JSON (except receipt upload which is `multipart/form-data`).
- Authenticated routes must check `auth.uid()` via Supabase server client. Return `401` if no session.
- Ownership checks: return `403` if the authenticated user doesn't own the bill.
- Return proper HTTP status codes as defined in the PRD (201 for creation, 204 for deletion, etc.).
- Never return raw error messages or stack traces to the client. Return structured error responses:
  ```json
  { "error": "human_readable_message" }
  ```

## 7. Gemini Integration

- Model: `gemini-2.0-flash`
- API key from `GEMINI_API_KEY` env variable.
- Use the exact prompt structure from the PRD (Section 6).
- If Gemini returns invalid JSON, retry once with a stricter prompt.
- If Gemini returns `{"error": "not_a_receipt"}`, return `422` to the client.
- If Gemini rate limits, return `429` to the client.
- Wrap all Gemini calls in try/catch. Never let a Gemini failure crash the server.

## 8. Testing

- Unit tests for the split engine must cover all cases listed in PRD Section 4.
- Integration tests for every API route: happy path + each error case.
- Mock Supabase and Gemini in tests. Do not call real services in CI.
- Target 80%+ coverage on `src/lib/` and `src/app/api/`.
- Test file naming: `*.test.ts` in the corresponding `tests/` subdirectory.

## 9. Build Order

Follow the sprint plan from the PRD. You are on Sprint 1 unless told otherwise.

**⚠️ After completing each task, STOP and tell me what was done. Wait for my go-ahead before starting the next task.**

### Sprint 1 (Your Tasks)
1. Supabase project setup — #7
2. DB schema + migrations — #8
3. Shared types (`src/types/index.ts`) — no issue, do alongside #8
4. Split calculation engine + unit tests — #10
5. Auth middleware (Supabase SSR setup) — #11
6. `POST /api/bills` — #12
7. `GET /api/bills` — #13
8. `GET /api/bills/:id` — #14
9. `PUT /api/bills/:id` — #15
10. `DELETE /api/bills/:id` — #16
11. CI/CD pipeline — #17

### Sprint 2 (Your Tasks)
12. Gemini integration — #23
13. `POST /api/receipts/parse` — #24
14. Supabase Storage setup — #25
15. Receipt parsing unit tests — #26
16. Integration tests for all API routes — #27
17. Coverage reporting in CI — #28

### Sprint 3 (Your Tasks)
18. `GET /api/bills/:id/share` — #35
19. API documentation (`docs/api.md`) — #36
20. API docs page at `/api-docs` — #37
21. Security scanning in CI — #38
22. E2E test setup + tests — #39

## 10. Branch Naming

```
reghu/feature/{issue_number}-{feature_name}
reghu/fix/{issue_number}-{fix_name}
```

**⚠️ CRITICAL RULE:** You MUST create a new branch for each new task BEFORE you start working on it. Do not reuse the branch from a previous task.

## 11. Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Do not hardcode any of these values. Always read from `process.env`.

**⚠️ CRITICAL RULE:** You MUST NEVER add, commit, or push any `.env` files or secrets (like API keys, passwords, or tokens) to Git under any circumstances. Always ensure `.env.local` is listed in `.gitignore` and never use `git add -f` on it.

## 12. Do NOT Build

- Any frontend UI components or pages
- Authentication UI (Supabase Auth handles this, Qingyang builds the UI)
- Features not in the PRD (dark mode, settings, sharing via email, etc.)
- Custom user management beyond what Supabase Auth provides

## 13. Task Execution Rules

**⚠️ CRITICAL RULE:** DO NOT move forward to the next task without explicit instructions from the user. Even if a task is small or it logically follows the previous one, you MUST stop, report completion, and wait for the user to explicitly say "move to the next task" or provide a go-ahead. Never automatically combine tasks or jump ahead.