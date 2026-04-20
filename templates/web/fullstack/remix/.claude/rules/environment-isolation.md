# Environment & Isolation — Remix

## Gitignore
```
node_modules/
build/
.env
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
DATABASE_URL=          # Database connection string
SESSION_SECRET=        # Random 32-char secret for cookie signing
```

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
