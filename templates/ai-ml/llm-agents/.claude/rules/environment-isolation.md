# Environment & Isolation — LLM / Agent Development

## Gitignore
```
.venv/
__pycache__/
.cache/
vector_store/
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
ANTHROPIC_API_KEY=     # Anthropic model access
OPENAI_API_KEY=        # OpenAI model access (optional)
PINECONE_API_KEY=      # Vector store (if using Pinecone)
DATABASE_URL=          # PostgreSQL connection string (if using pgvector)
LOG_LEVEL=             # e.g. INFO
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
