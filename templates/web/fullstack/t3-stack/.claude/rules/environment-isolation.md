# Environment & Isolation — T3 Stack

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
DISCORD_CLIENT_ID=     # OAuth (or replace with your provider)
DISCORD_CLIENT_SECRET=
```

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
