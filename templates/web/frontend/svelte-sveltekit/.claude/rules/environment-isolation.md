# Environment & Isolation — Svelte / SvelteKit

## Gitignore
```
node_modules/
.svelte-kit/
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
PUBLIC_API_URL=        # Public API base URL
SECRET_KEY=            # Server-only secret (not PUBLIC_ prefix)
```

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
