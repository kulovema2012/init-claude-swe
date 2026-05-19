# Environment & Isolation — Node.js / Bun API

## Gitignore
```
node_modules/
dist/
.env
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
DATABASE_URL=    # PostgreSQL connection string
PORT=            # e.g. 3000
JWT_SECRET=      # Random 32-char secret
LOG_LEVEL=       # info | debug | warn | error
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
