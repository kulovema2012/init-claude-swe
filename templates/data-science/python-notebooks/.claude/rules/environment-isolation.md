# Environment & Isolation — Python Notebooks / EDA

## Gitignore
```
.venv/
__pycache__/
.ipynb_checkpoints/
data/raw/
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
DATA_PATH=       # Path to input data directory
OUTPUT_PATH=     # Path to write processed outputs
LOG_LEVEL=       # INFO | DEBUG | ERROR
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../<feature-name> feat/<feature-name>
```
