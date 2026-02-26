---
trigger: manual
---

# SplitWiser - Frontend Specification

## Project Overview
- **Description**: A web application for expense tracking and splitting.
- **Tech Stack**: Next.js 15 / TypeScript / Tailwind CSS / React
- **Backend**: Supabase (PostgreSQL 16) — interact via API routes only
- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Programming OS**: Windows 11

## Project Structure
```markdown
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Global layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles (Tailwind entry point)
│   ├── auth/                   # Authentication pages
│   ├── dashboard/              # Main feature pages after login
│   │   └── page.tsx
│   └── api/                    # API routes (treat as backend boundary)
│
├── components/                 # Reusable UI components
│   ├── ui/                     # Common base components (Button, Input, Modal, etc.)
│   └── layout/                 # Layout components (Navbar, Footer, Sidebar, etc.)
│
├── lib/                        # Core utilities and services
│   ├── validators.ts           # Input validation (Zod schemas)
│   └── auth.ts                 # Client-side auth helpers
│
├── types/                      # TypeScript types
│   └── index.ts
│
└── middleware.ts                # Next.js middleware (Route guards, auth checks)
```

## Code Style

### General
- TypeScript: Strict mode — no `any` types, use `unknown` and narrow instead

### Import Order
1. Standard Library
2. Third-party libraries
3. Local files

### Naming Conventions
| Category                           | Convention       | Example              |
| ---------------------------------- | ---------------- | -------------------- |
| Constant                           | UPPER_SNAKE_CASE | `MAX_CHUNK_SIZE`     |
| TypeScript files                   | kebab-case       | `document-list.tsx`  |
| TypeScript variables and functions | camelCase        | `fetchDocuments`     |
| TypeScript components / types      | PascalCase       | `DocumentList`       |

## Testing Strategy

- **Framework**: Vitest + @testing-library/react
- **Coverage Target**: 80% minimum (lines, branches, functions, statements)
- **Test File Location**: Co-located with source files using `*.test.ts` / `*.test.tsx`
- **Run Tests**: `npx vitest` (watch) / `npx vitest run` (single run)
- **Coverage Report**: `npx vitest run --coverage`
- **Testing Patterns**:
  - Component tests for React components using `@testing-library/react`
  - Unit tests for utility functions in `lib/`
  - Unit tests for Zod validators in `lib/validators.ts`
- **Naming Convention**: Describe blocks mirror the module name; test names describe expected behavior (e.g., `it('should display error when input is empty')`)

---

## PRD & Design References

<!-- TODO: We need PRD for the following content -->
<!-- - Link to PRD document -->
<!-- - Key UI components and their expected behavior -->
<!-- - User flow descriptions for AI to follow when implementing features -->
### Webpage Styling
For colors:
```
@docs/bright-color.md
```
For webpage mock-ups (select all that suit the prompt):
```
@docs/imgs/dashboard_diagram.png
```

---

## Scrum & Workflow Instructions

### Branch Naming
- Format: `<type>/<issue-number>-<short-description>`
- Examples: `feature/12-add-login-page`, `fix/25-correct-split-calculation`
- Types: `feature`, `fix`, `chore`, `docs`, `test`

### Commit Message Format
- Conventional Commits: `<type>: <short description>`
- Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`
- Reference issues: `Closes #12` or `Refs #12`

### Pull Request Workflow
- Every PR must link to a GitHub Issue (`Closes #<issue-number>`)
- At least one reviewer approval before merging
- Squash merge into `main` branch

---

## Do's and Don'ts

### Do
- Use Zod for all input validation (forms and API request bodies)
- Use server components by default; add `"use client"` only when necessary
- Keep components small and focused on a single responsibility
- Handle errors with try/catch on all async operations
- Write tests before or alongside feature code

### Don't
- Don't use `any` type — use `unknown` and narrow types instead
- Don't store secrets or API keys in client-side code
- Don't make direct database calls from client components — use API routes
- Don't skip error handling on async operations
- Don't install new dependencies without team discussion

### Preferred Libraries
- Validation: Zod
- Testing: Vitest + @testing-library/react
- Styling: Tailwind CSS (no additional CSS-in-JS libraries)

### Accessibility
- All interactive elements must be keyboard accessible
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Form inputs must have associated `<label>` elements

---

## AI Interaction Preferences
- **Reply Language**: English
- **Code Comment Language**: English
- When additional information is needed, ask for it. Never guess.
- Implement only the code that I explicitly mention. Do not implement any additional features or expand the scope.