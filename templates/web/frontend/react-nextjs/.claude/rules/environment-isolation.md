# Environment & Isolation — React / Vite

## Gitignore
```
node_modules/
dist/
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
VITE_API_URL=          # Backend API base URL (exposed to browser)
VITE_APP_URL=          # App URL for redirects (exposed to browser)
```
Prefix client-side vars with `VITE_`. Server-side secrets go in `.env` without the prefix (not exposed).

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
