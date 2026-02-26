# SplitWiser - Frontend Specification

## Project Overview
<!-- Please complete the backend tech stack. -->
- **Description**: A full-stack web application for expense tracking and splitting.
- **Tech Stack**: Next.js 15 / TypeScript / Tailwind CSS / React
- **Runtime**: Node.js 18+ / PostgreSQL 16(Supabase)
- **Package Manager**: npm
- **Programming OS**: Windows 11

## Project Structure
```markdown
src/
├── app/                        # Next.js App Router (Pages + API Routes)
│   ├── layout.tsx              # Global layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles (Tailwind entry point)
│   │
│   ├── auth/                   # Authentication pages
│   │
│   ├── dashboard/              # Main feature pages after login
│   │   └── page.tsx
│   │
│   └── api/                    # API routes (Backend)
│       ├── auth/               # Authentication API routes(example structure)
│       │   ├── login/
│       │   │   └── route.ts
│       │   ├── register/
│       │   │   └── route.ts
│       │   └── logout/
│       │       └── route.ts
│       └── [resource]/         # Core business resources (e.g., posts, tasks)
│           └── route.ts
│
├── components/                 # Reusable UI components
│   ├── ui/                     # Common base components (Button, Input, Modal, etc.)
│   └── layout/                 # Layout components (Navbar, Footer, Sidebar, etc.)
│
├── lib/                        # Core utilities and services
│   ├── db.ts                   # Database connection 
│   ├── auth.ts                 # Auth logic (JWT issuance/verification or OAuth config)
│   └── validators.ts           # Input validation (zod, etc.)
│
├── models/                     # Data models / Schema definitions
│   └── User.ts
│
├── types/                      # TypeScript types
│   └── index.ts
│
└── middleware.ts                # Next.js middleware (Route guards, auth checks)
```

## Code Style

### General
- TypeScript: Strict mode

### Import Order

1. Standard Library
2. Third-party libraries
3. Local files

### Naming Conventions
| Category                          | Convention       | Example                |
| --------------------------------- | ---------------- | ---------------------- |
| Constant                          | UPPER_SNAKE_CASE | `MAX_CHUNK_SIZE`       |
| TypeScript files                  | kebab-case       | `document-list.tsx`    |
| TypeScript variables and functions| camelCase        | `fetchDocuments`       |
| TypeScript components / types     | PascalCase       | `DocumentList`         |

## Testing Strategy

- **Framework**: Vitest
- **Coverage Target**: 80% minimum (lines, branches, functions, statements)
- **Test File Location**: Co-located with source files using `*.test.ts` / `*.test.tsx` naming
- **Run Tests**: `npx vitest` (watch mode) / `npx vitest run` (single run)
- **Coverage Report**: `npx vitest run --coverage`
- **Testing Patterns**:
  - Unit tests for utility functions in `lib/`
  - Unit tests for validators in `lib/validators.ts`
  - Component tests for React components using `@testing-library/react`
  - API route tests for handlers in `app/api/`
- **Naming Convention**: Describe blocks should mirror the module name; test names should describe expected behavior (e.g., `it('should return 401 when token is missing')`)

---

## PRD & Design References

<!-- TODO: We need PRD for the following content -->
<!-- - Link to PRD document -->
<!-- - Description of mockup/prototype designs -->
<!-- - Key UI components and their expected behavior -->
<!-- - User flow descriptions for AI to follow when implementing features -->
### Webpage Styling
For colors:
```
@docs/webpage-styling.md
```
For webpage mock-ups(Select all that suit the prompt):
```
@docs/imgs/main.png
```
---

## Scrum & Workflow Instructions

### Branch Naming
- Format: `<type>/<issue-number>-<short-description>`
- Examples: `feature/12-add-login-page`, `fix/25-correct-split-calculation`, `chore/30-update-deps`
- Types: `feature`, `fix`, `chore`, `docs`, `test`

### Commit Message Format
- Use Conventional Commits: `<type>: <short description>`
- Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`
- Reference issues in commit body: `Closes #12` or `Refs #12`
- Examples:
  - `feat: add expense input form`
  - `fix: correct rounding error in split calculation`
  - `test: add unit tests for auth middleware`

### Pull Request Workflow
- Every PR must link to a GitHub Issue (use `Closes #<issue-number>` in PR description)
- PRs require at least one reviewer approval before merging
- PR title follows the same Conventional Commits format
- Squash merge into `main` branch

### Referencing Issues
- In code comments: `// See #12 for context`
- In commits: `Closes #12` (auto-closes the issue on merge)
- In PR descriptions: `Resolves #12`

---

## Do's and Don'ts

### Do
- Use Zod for all input validation (API routes and forms)
- Use Supabase client library for database operations
- Handle errors with try/catch and return appropriate HTTP status codes
- Use TypeScript strict mode — no `any` types
- Write tests before or alongside feature code
- Keep components small and focused on a single responsibility
- Use server components by default; add `"use client"` only when necessary

### Don't
- Don't use `any` type — use `unknown` and narrow types instead
- Don't store secrets or API keys in client-side code
- Don't make direct database calls from client components — use API routes
- Don't skip error handling on async operations
- Don't install new dependencies without team discussion
- Don't push directly to `main` — always use feature branches and PRs

### Preferred Libraries
- Validation: Zod
- Database: Supabase JS client
- Testing: Vitest + @testing-library/react
- Styling: Tailwind CSS (no additional CSS-in-JS libraries)

### Security & Accessibility
- Sanitize all user inputs before database operations
- Use HTTP-only cookies for authentication tokens
- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Form inputs must have associated `<label>` elements

---

## AI Interaction Preferences
- **Reply Language**: English
- **Code Comment Language**: English
- When additional information is needed, ask for it. Never guess.
- Implement only the code that I explicitly mention. Do not implement any additional features or expand the scope.