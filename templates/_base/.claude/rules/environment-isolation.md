# Environment & Isolation

## Gitignore First
Before writing any project code, add to `.gitignore`:
- `node_modules/` / `.venv/` / build folders
- `.env` (never commit secrets)
- `.claude/` (AI tooling is local)

## Task Isolation
Every feature or bugfix lives in an isolated git worktree.
Do not write code that breaks the main branch state.

## Package Manager
Use the package manager specified in CLAUDE.md Key Commands.
- JS/TS: **bun** exclusively (`bun add`, `bun run`, `bun test`)
- Python: **uv** exclusively (`uv add`, `uv run`, `uv venv`)
Never use npm, yarn, pnpm, pip, poetry, or pipenv.

## Environment Variables
- `.env` — local dev only, never commit
- `.env.example` — committed template with placeholder values
- Validate all env vars at startup; fail fast with a clear message if any are missing
