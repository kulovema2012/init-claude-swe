# Environment & Isolation — GraphQL API

## Gitignore
```
node_modules/
dist/
src/__generated__/
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
DATABASE_URL=              # PostgreSQL connection string
PORT=                      # e.g. 4000
GRAPHQL_INTROSPECTION=     # true (dev only) | false (production)
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
