# Environment & Isolation — SQL / Analytics (dbt)

## Gitignore
```
.venv/
target/
dbt_packages/
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
DBT_PROFILES_DIR=      # Path to profiles.yml directory
DBT_TARGET=            # dev | prod
SNOWFLAKE_ACCOUNT=     # Snowflake account identifier (if using Snowflake)
BIGQUERY_PROJECT=      # GCP project ID (if using BigQuery)
POSTGRES_URL=          # PostgreSQL connection string (if using Postgres)
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../<feature-name> feat/<feature-name>
```
