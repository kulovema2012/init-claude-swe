# Environment & Isolation — Next.js App Router

## Gitignore
```
node_modules/
.next/
.env
.env.local
.claude/
```

## Package Manager: bun (mandatory)
- Install: `bun add <pkg>`
- Dev: `bun add -d <pkg>`
- Run: `bun run <script>`
- Test: `bun test`
Never use npm, yarn, or pnpm.

## Required Environment Variables
```
DATABASE_URL=          # PostgreSQL connection string
NEXTAUTH_SECRET=       # Random 32-char secret
NEXTAUTH_URL=          # e.g. http://localhost:3000
GOOGLE_CLIENT_ID=      # OAuth app
GOOGLE_CLIENT_SECRET=
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
