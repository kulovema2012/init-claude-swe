# Environment & Isolation — Static / Jamstack

## Gitignore
```
node_modules/
dist/
.astro/
_site/
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
PUBLIC_SITE_URL=       # Canonical site URL
CMS_API_KEY=           # Headless CMS read token (if used)
```

## Worktree Isolation
```bash
git worktree add ../feature-name feat/feature-name
```
