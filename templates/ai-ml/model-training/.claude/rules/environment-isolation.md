# Environment & Isolation — Model Training / MLOps

## Gitignore
```
.venv/
__pycache__/
checkpoints/
outputs/
wandb/
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
WANDB_API_KEY=          # Weights & Biases experiment tracking
HUGGINGFACE_TOKEN=      # HF Hub access for gated models
CUDA_VISIBLE_DEVICES=   # e.g. 0,1 for multi-GPU
EXPERIMENT_NAME=        # Used as the wandb run name
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
