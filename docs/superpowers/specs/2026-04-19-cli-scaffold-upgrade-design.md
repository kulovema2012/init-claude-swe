# CLI Scaffold Upgrade — Design Spec
**Date:** 2026-04-19
**Status:** Approved

---

## Overview

Upgrade `init-claude-swe` from a single-file CLAUDE.md installer to a full `.claude/` directory scaffold. When a user runs `npx init-claude-swe`, they are guided through a multi-level interactive onboarding that produces a lean `CLAUDE.md` + a complete `.claude/rules/` + `.claude/settings.json` — all fetched from GitHub at install time, tailored to their project type.

---

## Goals

- Generate a complete `.claude/` scaffold (not just a flat CLAUDE.md)
- Multi-level interactive onboarding: Category → Sub-type → Stack
- All files fetched from GitHub (always up-to-date)
- Base rules shared across all stacks; only CLAUDE.md and `environment-isolation.md` vary per stack
- Elegant CLI experience via `@clack/prompts`
- Non-interactive / CI mode via flags

---

## Section 1: Repository & Template Structure

### Folder Hierarchy

```
templates/
├── _base/
│   ├── MANIFEST.json
│   └── .claude/
│       ├── settings.json
│       └── rules/
│           ├── environment-isolation.md
│           ├── testing-aaa.md
│           ├── observability.md
│           ├── git-workflow.md
│           ├── project-organization.md
│           ├── tool-selection.md
│           ├── skills-catalog.md
│           └── agents-catalog.md
│
├── web/
│   ├── frontend/
│   │   ├── react-nextjs/
│   │   │   ├── MANIFEST.json
│   │   │   ├── CLAUDE.md
│   │   │   └── .claude/rules/environment-isolation.md
│   │   ├── vue-nuxt/
│   │   └── svelte-sveltekit/
│   ├── fullstack/
│   │   ├── nextjs-app-router/
│   │   ├── remix/
│   │   └── t3-stack/
│   └── static-jamstack/
│
├── mobile/
│   ├── react-native/
│   ├── flutter/
│   └── native/
│
├── backend/
│   ├── nodejs-bun/
│   ├── python-fastapi/
│   ├── python-django/
│   ├── go/
│   └── graphql/
│
├── data-science/
│   ├── python-notebooks/
│   ├── sql-analytics/
│   └── data-engineering/
│
├── ai-ml/
│   ├── llm-agents/
│   ├── model-training/
│   └── computer-vision/
│
├── devsecops/
│   ├── cicd-pipelines/
│   ├── kubernetes-cloud/
│   └── security-auditing/
│
└── general/
    ├── MANIFEST.json
    └── CLAUDE.md
```

### MANIFEST.json Format

Used by both `_base/` and each leaf node. Leaf manifests list only files that override the base.

```json
{
  "version": "1.0",
  "files": [
    "CLAUDE.md",
    ".claude/rules/environment-isolation.md"
  ]
}
```

### Output Written to Target Project

```
<project-root>/
├── CLAUDE.md                               ← stack-specific role prompt
└── .claude/
    ├── settings.json                       ← base
    └── rules/
        ├── environment-isolation.md        ← stack-specific override
        ├── testing-aaa.md                  ← base
        ├── observability.md                ← base
        ├── git-workflow.md                 ← base
        ├── project-organization.md         ← base
        ├── tool-selection.md               ← base
        ├── skills-catalog.md               ← base
        └── agents-catalog.md              ← base
```

---

## Section 2: CLI Onboarding Flow

### Interactive Mode

```
$ npx init-claude-swe

  ┌─────────────────────────────────────┐
  │  init-claude-swe  v2.0.0            │
  │  Claude Code scaffold installer     │
  └─────────────────────────────────────┘

◆  What are you building?
│  ● Web Development
│  ○ Mobile Development
│  ○ Backend / API
│  ○ Data Science
│  ○ AI / ML Engineering
│  ○ DevSecOps / Infrastructure
│  ○ General Purpose
└

◆  Project type?
│  ● Full-Stack
│  ○ Frontend Only
│  ○ Static / Jamstack
└

◆  Stack?
│  ● Next.js (App Router)
│  ○ Remix
│  ○ T3 Stack
└

◆  Install scope?
│  ● project  — CLAUDE.md  (committed to git)
│  ○ local    — CLAUDE.local.md  (gitignored)
└

◇  CLAUDE.md already exists — overwrite?
│  Yes
└

◇  Installing scaffold for Next.js (App Router)...
│
│  ↓  base rules          ████████████████  10 / 10
│  ↓  stack overrides     ████████████████   2 / 2
│
│  ✓  .claude/rules/               8 files
│  ✓  .claude/settings.json
│  ✓  CLAUDE.md
└

◆  All done!
│
│  Next steps:
│  1. Open Claude Code in this directory
│  2. Review CLAUDE.md for your role setup
│  3. Explore .claude/rules/ to customise your workflow
└
```

### Non-interactive / CI Mode

```bash
npx init-claude-swe --category web --type fullstack --stack nextjs --scope project --yes
```

### Navigation Tree (`src/navigation.js`)

```js
export const TREE = {
  "Web Development": {
    "Frontend Only": ["React / Next.js", "Vue / Nuxt", "Svelte / SvelteKit"],
    "Full-Stack":    ["Next.js (App Router)", "Remix", "T3 Stack"],
    "Static / Jamstack": null,
  },
  "Mobile Development": {
    "React Native": null,
    "Flutter": null,
    "Native (iOS / Android)": null,
  },
  "Backend / API": {
    "Node.js / Bun": null,
    "Python": ["FastAPI", "Django"],
    "Go": null,
    "GraphQL": null,
  },
  "Data Science": {
    "Python (Notebooks / EDA)": null,
    "SQL / Analytics": null,
    "Data Engineering (Pipelines)": null,
  },
  "AI / ML Engineering": {
    "LLM / Agent Development": null,
    "Model Training / MLOps": null,
    "Computer Vision": null,
  },
  "DevSecOps / Infrastructure": {
    "CI/CD Pipelines": null,
    "Kubernetes / Cloud": null,
    "Security Auditing": null,
  },
  "General Purpose": null,
}
```

`null` at any level = leaf node, skip to scope selection.

---

## Section 3: Fetch & Merge Architecture

### Pipeline

```
1. Resolve GitHub path from selections
   web → fullstack → nextjs-app-router
   → templates/web/fullstack/nextjs-app-router/

2. Fetch _base/MANIFEST.json
   → list of 10 base file paths

3. Fetch <leaf>/MANIFEST.json
   → list of 2 override file paths

4. Merge into Map<filePath → githubRawURL>
   (override wins on key conflict)

5. Fetch all files in parallel (Promise.all)
   Show progress bar as each resolves

6. Write to disk
   mkdir -p for each subdirectory
   Respect scope (CLAUDE.md vs CLAUDE.local.md)
   Append CLAUDE.local.md to .gitignore if scope = local
```

### Error Handling

| Scenario | Behaviour |
|----------|-----------|
| MANIFEST fetch fails | Abort immediately, no partial writes, clear error message |
| Individual file fetch fails | Retry once, then skip with warning |
| All fetches succeed | Write all files atomically |
| Existing files, no `--yes` flag | Prompt overwrite confirmation per file group |

---

## Section 4: Source Module Changes

### Module Map

```
src/
├── cli.js                    # MODIFIED — clack intro/outro, flag parsing
├── navigation.js             # NEW — TREE constant
├── commands/
│   └── install.js            # MODIFIED — full pipeline orchestration
└── utils/
    ├── prompt.js             # REPLACED — clack multi-level selector
    ├── fetch.js              # MODIFIED — manifest fetch + parallel fetch
    ├── resolve.js            # NEW — selection → slug → GitHub URL
    ├── scaffold.js           # NEW — merge + atomic disk write
    └── gitignore.js          # UNCHANGED
```

### Module Responsibilities

| Module | Single Responsibility |
|--------|----------------------|
| `cli.js` | Entry point, clack `intro`/`outro`, CLI flag wiring |
| `navigation.js` | TREE — single source of truth for all categories/types/stacks |
| `commands/install.js` | Orchestrates: prompt → resolve → fetch → scaffold |
| `utils/prompt.js` | Multi-level `clack.select()` loop, CI short-circuit |
| `utils/fetch.js` | `fetchManifest(url)`, `fetchFiles(urls[])` with parallel + progress |
| `utils/resolve.js` | `toSlug(label)`, `buildPaths(selections)` → base URL + leaf URL |
| `utils/scaffold.js` | `merge(base, leaf)` → Map, `writeAll(map, scope)` |
| `utils/gitignore.js` | Appends `.gitignore` entries for local scope |

### New Dependency

```
@clack/prompts   — replaces raw readline in prompt.js
```

### Test Structure

```
test/
├── cli.test.js           # MODIFIED
├── navigation.test.js    # NEW — tree shape + slug validation
├── install.test.js       # MODIFIED — mock fetch + scaffold
├── prompt.test.js        # MODIFIED — clack-based
├── fetch.test.js         # MODIFIED — manifest + parallel fetch
├── resolve.test.js       # NEW — slug generation + URL building
├── scaffold.test.js      # NEW — merge logic, write ordering
└── gitignore.test.js     # UNCHANGED
```

---

## Section 5: Template Content Strategy

### Base Layer (adapted from saifah-fund, generalized)

| File | Content |
|------|---------|
| `rules/testing-aaa.md` | A.A.A. standard, unit test structure, TDD discipline |
| `rules/observability.md` | No console.log, structured JSON logging, Loki/Grafana/Tempo/Prometheus |
| `rules/git-workflow.md` | Atomic push cycle, gitmoji commit format |
| `rules/project-organization.md` | CLAUDE.md scaling, pointer architecture, monorepo anatomy |
| `rules/tool-selection.md` | Skill invocation order, agent selection table, team dispatch rules |
| `rules/skills-catalog.md` | Full skills reference (superpowers, agent-teams, vercel, backend, etc.) |
| `rules/agents-catalog.md` | Full agents reference by domain |
| `settings.json` | Default enabled plugins (superpowers, agent-teams, code-review) |

### Stack Overrides

Each stack provides exactly two files:

| Stack | `environment-isolation.md` | `CLAUDE.md` role |
|-------|---------------------------|-----------------|
| Next.js (App Router) | bun, Next.js App Router, Vercel, Drizzle | Full-stack Next.js engineer |
| React / Next.js (Frontend) | bun, React 19, Tailwind, Shadcn | Frontend React engineer |
| Vue / Nuxt | bun, Vue 3, Nuxt 4 | Frontend Vue engineer |
| Svelte / SvelteKit | bun, Svelte 5, SvelteKit | Frontend Svelte engineer |
| Static / Jamstack | bun, Astro / 11ty | Jamstack engineer |
| Remix | bun, Remix v2 | Full-stack Remix engineer |
| T3 Stack | bun, tRPC, Prisma, Next.js | Full-stack T3 engineer |
| React Native | bun, Expo SDK | Mobile React Native engineer |
| Flutter | dart pub, Flutter SDK | Mobile Flutter engineer |
| Native (iOS/Android) | Xcode / Gradle | Native mobile engineer |
| Node.js / Bun | bun, Hono / Express | Backend Node/Bun engineer |
| Python / FastAPI | uv, FastAPI, SQLAlchemy, Alembic | Backend Python API engineer |
| Python / Django | uv, Django 5, DRF | Backend Django engineer |
| Go | go mod | Backend Go engineer |
| GraphQL | bun or uv, Apollo / Strawberry | GraphQL API engineer |
| Python Notebooks | uv, Jupyter, pandas, polars | Data scientist / analyst |
| SQL / Analytics | uv, dbt, DuckDB | Analytics engineer |
| Data Engineering | uv, Airflow, Spark, dbt | Data engineer |
| LLM / Agents | uv, Pydantic AI / LangChain, OpenAI SDK | AI engineer, agent builder |
| Model Training / MLOps | uv, PyTorch, MLflow | ML engineer |
| Computer Vision | uv, OpenCV, YOLO | Computer vision engineer |
| CI/CD Pipelines | GitHub Actions, Docker | DevOps engineer |
| Kubernetes / Cloud | terraform, helm, kubectl | Cloud infrastructure engineer |
| Security Auditing | uv or bun, OWASP tools | Security engineer |
| General Purpose | bun or uv (prompted) | General SWE |

### CLAUDE.md Structure Per Stack (~80–100 lines)

```markdown
# Role: <Stack-Specific Title>
<2-line persona focused on this stack's priorities>

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
<5–8 stack-specific commands: dev, test, lint, build, migrate, etc.>

## Stack Notes
<3–5 bullet points of stack-specific conventions>
```

Adding a new stack in future = one new folder + two files. Zero CLI code changes required.

---

## Out of Scope

- Custom skill files per stack (`.claude/skills/`) — can be added in a future iteration
- A web UI for template browsing
- Template versioning / pinning (all fetches use latest `main`)
- Monorepo-aware installs (installing into a specific app/ subdirectory)
