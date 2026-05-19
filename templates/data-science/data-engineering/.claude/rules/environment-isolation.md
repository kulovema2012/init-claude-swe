# Environment & Isolation — Data Engineering (Pipelines)

## Gitignore
```
.venv/
__pycache__/
data/
logs/
.env
.claude/
```

## Package Manager: uv (mandatory)
- Install: `uv add <package>`
- Run: `uv run <command>`
- Venv: `uv venv`

Never use pip, poetry, or pipenv.

## Required Environment Variables
```
AIRFLOW_HOME=    # Path to Airflow home directory
DATABASE_URL=    # Pipeline metadata database connection string
S3_BUCKET=       # Object storage bucket for data artifacts
LOG_LEVEL=       # INFO | DEBUG | ERROR
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../<feature-name> feat/<feature-name>
```
