# Environment & Isolation — Vue / Nuxt

## Gitignore
```
node_modules/
.nuxt/
.output/
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
NUXT_PUBLIC_API_BASE=  # Public API base URL
NUXT_SECRET_KEY=       # Server-only secret
```

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
