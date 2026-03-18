# Design Spec: `init-claude-swe` CLI

**Date:** 2026-03-18
**Status:** Approved
**Author:** kulovema2012

---

## Overview

A zero-dependency Node.js CLI published to npm as `init-claude-swe`. When run via `npx init-claude-swe`, it fetches the latest `CLAUDE.md` from a GitHub repo and writes it to the root of the user's current working directory.

---

## Goals

- Single-command setup: `npx init-claude-swe`
- Always delivers the latest `CLAUDE.md` from the source repo
- Safe: prompts before overwriting an existing file
- Zero runtime dependencies

---

## Non-Goals

- No interactive stack selection
- No scaffolding beyond `CLAUDE.md`
- No support for custom target directories (always uses `cwd`)
- No support for private repos

---

## Architecture

### Package Structure

```
init-claude-swe/
├── bin/
│   └── index.js        ← CLI entry point (executable)
├── package.json
└── .gitignore
```

### `package.json` Key Fields

```json
{
  "name": "init-claude-swe",
  "version": "1.0.0",
  "bin": { "init-claude-swe": "./bin/index.js" },
  "files": ["bin/"]
}
```

### Runtime Dependencies

None. Uses only Node.js built-ins:
- `https` — fetch CLAUDE.md from GitHub
- `fs` — check existence, write file
- `readline` — prompt user for overwrite confirmation
- `path` — resolve destination path

---

## Data Flow

```
npx init-claude-swe
        │
        ▼
Fetch CLAUDE.md from raw GitHub URL
https://raw.githubusercontent.com/kulovema2012/init-claude-swe/master/CLAUDE.md
        │
        ▼
Does ./CLAUDE.md exist in cwd?
   ├── NO  → Write file → Print success
   └── YES → Prompt "CLAUDE.md already exists. Overwrite? (y/N)"
                 ├── y → Write file → Print success
                 └── N → Print "Aborted." → Exit 0
```

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Network failure | Print `"Failed to fetch CLAUDE.md. Check your internet connection."` → Exit 1 |
| Non-200 HTTP response | Print `"Failed to fetch CLAUDE.md. HTTP <status>"` → Exit 1 |
| File write failure | Surface OS error message → Exit 1 |
| User answers N to overwrite | Print `"Aborted."` → Exit 0 |

---

## Success Output

```
✓ CLAUDE.md added to your project.
```

---

## Source Repository

- **GitHub:** https://github.com/kulovema2012/init-claude-swe
- **Raw CLAUDE.md URL:** https://raw.githubusercontent.com/kulovema2012/init-claude-swe/master/CLAUDE.md
- **npm package name:** `init-claude-swe`

---

## Out of Scope (Future)

- Interactive stack-specific CLAUDE.md variants
- Additional boilerplate files (`.gitignore`, `README.md`)
- Private repo support via GitHub token
