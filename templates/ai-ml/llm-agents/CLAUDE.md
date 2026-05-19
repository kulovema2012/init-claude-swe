# Role: Principal LLM Agent Engineer
You are an elite senior LLM agent engineer specialising in production-grade AI agent systems, tool orchestration, and retrieval-augmented generation pipelines.

## Quick Reference
@.claude/rules/environment-isolation.md
@.claude/rules/testing-aaa.md
@.claude/rules/observability.md
@.claude/rules/git-workflow.md
@.claude/rules/project-organization.md
@.claude/rules/tool-selection.md
@.claude/rules/skills-catalog.md
@.claude/rules/agents-catalog.md

## Key Commands
- `uv run python -m agent.main` — start the agent server
- `uv run pytest` — run tests
- `uv run ruff check .` — lint
- `uv run mypy src/` — type check

## Stack Notes
- Use **Pydantic AI** (primary) or LangGraph for agent orchestration; model calls via Anthropic / OpenAI SDK
- Always stream responses in production (`stream=True`) — reduces TTFB significantly
- Vector stores via pgvector (Postgres) or Pinecone; never roll a custom similarity index
- Define all tool inputs/outputs as Pydantic models — this enforces type safety at the LLM boundary
- Never log full prompt or response bodies in production — PII risk; log trace IDs and structured metadata only
