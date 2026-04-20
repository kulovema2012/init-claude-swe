# Project Organisation

## CLAUDE.md Scaling Rule

Keep CLAUDE.md under 200 lines. When it grows beyond that:
1. Create `.claude/rules/<topic>.md` for each concern
2. Reference rules via `@.claude/rules/<topic>.md` imports in CLAUDE.md
3. Rules are discovered recursively — organise into subdirectories if needed

## Pointer Architecture

Local rule files are **routers only** — they point to co-located documentation,
never contain rules themselves. Place descriptive files next to the source they describe.

## Path-Specific Rules

Scope rules to files using YAML frontmatter:

```yaml
---
paths:
  - "src/api/**/*.ts"
---
```

Rules without `paths` apply globally.

## Single Responsibility

- One module = one responsibility
- Files that change together live together
- Split by domain/responsibility, not by technical layer
- When a file grows unwieldy, a split is the right call

## Feature Addition Order

Schema → Migration → Queries → Service/Action → Route/Handler → UI → Tests
