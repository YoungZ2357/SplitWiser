## How to obtain code
```bash
git clone https://github.com/YoungZ2357/SplitWiser.git  # clone the repo
cd SplitWiser # or your project folder with package.json
npm install  # install dependencies
npm run dev  # run the app
```

## Project Structure
```markdown
src/
├── app/                        # Next.js App Router (Pages + API Routes)
│   ├── layout.tsx              # Global layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles (Tailwind entry point)
│   │
│   ├── auth/                   # Authentication pages
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/              # Main feature pages after login
│   │   └── dashboard
│   │       └── page.tsx
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