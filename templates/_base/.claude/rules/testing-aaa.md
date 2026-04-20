# Testing Standards — A.A.A. Framework

All unit tests MUST follow the Arrange-Act-Assert pattern.

## Required Structure

Every test must have three explicit sections:
- **Arrange** — set up state, mocks, and input data
- **Act** — execute the single unit under test
- **Assert** — verify the exact expected outcome

## Rules

- Every piece of business logic has a co-located unit test
- Tests run with the project's test command (see CLAUDE.md Key Commands)
- Mock external dependencies (DB, HTTP, file system) — test logic, not infrastructure
- One behaviour per test case with a descriptive name
- Prefer real implementations over mocks where fast and practical

## TDD Workflow

1. Write the failing test first
2. Run it — confirm it fails with the expected error
3. Write minimal implementation to make it pass
4. Refactor without breaking tests
5. Commit

## When to Write Tests

| Layer | Required? |
|-------|-----------|
| Business logic / domain functions | ✅ Always |
| API handlers / server actions | ✅ Always |
| Utility functions with branching | ✅ Always |
| UI components with logic | ⚠️ Should |
| Pure presentational components | ❌ Optional |
| Third-party SDK wrappers | ❌ Skip |
