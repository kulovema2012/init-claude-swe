# Environment & Isolation — Python Django

## Gitignore
```
.venv/
__pycache__/
staticfiles/
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
SECRET_KEY=          # Django secret key (random 50-char string)
DATABASE_URL=        # PostgreSQL connection string
CELERY_BROKER_URL=   # Redis URL, e.g. redis://localhost:6379/0
DEBUG=               # true | false (never true in production)
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
