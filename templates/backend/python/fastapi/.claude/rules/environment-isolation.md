# Environment & Isolation — Python FastAPI

## Gitignore
```
.venv/
__pycache__/
dist/
.env
.claude/
```

## Package Manager: uv (mandatory)
- Install: `uv add <pkg>`
- Dev: `uv add --dev <pkg>`
- Run: `uv run <cmd>`
- Test: `uv run pytest`
Never use pip, poetry, or pipenv.

## Required Environment Variables
```
DATABASE_URL=    # PostgreSQL async connection string (e.g. postgresql+asyncpg://...)
SECRET_KEY=      # Random 32-char secret for JWT signing
DEBUG=           # true | false
LOG_LEVEL=       # info | debug | warn | error
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
