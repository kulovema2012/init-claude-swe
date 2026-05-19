# Environment & Isolation — General Purpose

## Gitignore
Always add to `.gitignore` before writing project code:
```
# Language build artefacts
node_modules/
dist/
.next/
__pycache__/
.venv/
bin/
target/

# Secrets — never commit
.env
*.key
*.pem

# AI tooling — local only
.claude/
```

## Package Manager (by language)
- **JS/TS:** bun exclusively — `bun add`, `bun run`, `bun test`
- **Python:** uv exclusively — `uv add`, `uv run`, `uv venv`
- **Go:** Go modules — `go get`, `go mod tidy`
- **Rust:** Cargo — `cargo add`, `cargo build`, `cargo test`

Never use npm, yarn, pnpm, pip, poetry, or pipenv.

## Required Environment Variables
```
# Define project-specific env vars in .env.example (committed)
# Never commit .env (secrets)
APP_ENV=development
LOG_LEVEL=info
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../<feature-name> feat/<feature-name>
```
