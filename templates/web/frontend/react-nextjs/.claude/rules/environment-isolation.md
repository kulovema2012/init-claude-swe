# Environment & Isolation — React / Next.js Frontend

## Gitignore
```
node_modules/
dist/
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

## Environment Variables
```
NEXT_PUBLIC_API_URL=   # Backend API base URL
NEXT_PUBLIC_APP_URL=   # App URL for redirects
```

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
