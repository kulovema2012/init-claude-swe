# Environment & Isolation — Computer Vision

## Gitignore
```
.venv/
__pycache__/
runs/
weights/
data/
.env
.claude/
```

## Package Manager: uv (mandatory)
- Install: `uv add <package>`
- Dev install: `uv add --dev <package>`
- Run: `uv run <command>`
- Venv: `uv venv`

Never use pip, poetry, or pipenv.

## Required Environment Variables
```
MLFLOW_TRACKING_URI=   # e.g. http://localhost:5000
DATA_DIR=              # Absolute path to dataset root
MODEL_DIR=             # Absolute path for saving checkpoints
CUDA_VISIBLE_DEVICES=  # e.g. 0 for single GPU
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
