# Design Spec: `init-claude-swe` CLI

**Date:** 2026-03-18
**Status:** Approved
**Author:** kulovema2012

---

## Overview

A zero-dependency Node.js CLI published to npm as `init-claude-swe`. When run via `npx init-claude-swe`, it fetches the latest `CLAUDE.md` from a public GitHub repo and writes it to the root of the user's current working directory.

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
- No Windows terminal encoding fallback (Unicode output is acceptable; Windows CP437/CP1252 encoding is out of scope)

---

## Architecture

### Package Structure

```
init-claude-swe/
├── bin/
│   └── index.js        ← CLI entry point; MUST start with #!/usr/bin/env node
├── package.json
└── .gitignore          ← must exclude: node_modules/
```

### `.gitignore` Required Contents

```
node_modules/
```

### `package.json` Key Fields

```json
{
  "name": "init-claude-swe",
  "version": "1.0.0",
  "description": "npx CLI that fetches and installs CLAUDE.md into any project",
  "license": "MIT",
  "type": "commonjs",
  "engines": { "node": ">=18" },
  "bin": { "init-claude-swe": "./bin/index.js" },
  "files": ["bin/"],
  "repository": {
    "type": "git",
    "url": "https://github.com/kulovema2012/init-claude-swe.git"
  },
  "keywords": ["claude", "ai", "boilerplate", "setup", "swe"]
}
```

**Implementation note:** `"type": "commonjs"` means `bin/index.js` MUST use CommonJS syntax (`require`, `module.exports`). ESM syntax (`import`/`export`) will cause a runtime error with this setting.

### Runtime Dependencies

None. Uses only Node.js built-ins: `https`, `fs`, `readline`, `path`.

**Minimum Node version: 18.**

---

## Data Flow

Existence check happens **before** the network request. Non-TTY detection happens **before** the prompt is shown.

```
npx init-claude-swe
        │
        ▼
Does ./CLAUDE.md exist in cwd?
   ├── NO  ──────────────────────────────────────────► proceed to Fetch
   └── YES → Is it a file or a directory?
                 ├── directory → Print "CLAUDE.md is a directory. Aborting." → Exit 1
                 └── file     → Is stdin a TTY? (process.stdin.isTTY)
                                   ├── NO (non-TTY / CI env)
                                   │     → Print "Non-interactive environment. Aborting." → Exit 0
                                   └── YES → Prompt "CLAUDE.md already exists. Overwrite? (y/N)"
                                               ├── y or Y → proceed to Fetch
                                               └── anything else → Print "Aborted." → Exit 0
        │
        ▼
Fetch CLAUDE.md (10s timeout)
https://raw.githubusercontent.com/kulovema2012/init-claude-swe/master/CLAUDE.md
        │
        ▼
Validate response
   ├── Network error / timeout → Print error message → Exit 1
   ├── Non-200 status          → Print "Failed to fetch CLAUDE.md. HTTP <status>" → Exit 1
   ├── Empty body              → Print "Fetched CLAUDE.md is empty. Aborting." → Exit 1
   └── OK                      → proceed to Write
        │
        ▼
Write ./CLAUDE.md
   ├── Success → Print "✓ CLAUDE.md added to your project."
   └── Failure → Print err.message (OS error surfaced as-is) → Exit 1
```

---

## Error Handling

| Scenario | Output | Exit Code |
|---|---|---|
| `CLAUDE.md` is a directory | `"CLAUDE.md is a directory. Aborting."` | 1 |
| Non-TTY environment (stdin not a TTY) | `"Non-interactive environment. Aborting."` | 0 |
| User answers anything other than y/Y | `"Aborted."` | 0 |
| Network failure | `"Failed to fetch CLAUDE.md. Check your internet connection."` | 1 |
| Network timeout (>10s) | `"Request timed out. Check your internet connection."` | 1 |
| Non-200 HTTP response | `"Failed to fetch CLAUDE.md. HTTP <status>"` | 1 |
| Empty response body | `"Fetched CLAUDE.md is empty. Aborting."` | 1 |
| File write failure (any OS error including permissions) | `err.message` surfaced as-is | 1 |

---

## Success Output

```
✓ CLAUDE.md added to your project.
```

Note: The `✓` character (U+2713) requires a UTF-8 terminal. Windows CP437/CP1252 fallback is explicitly out of scope.

---

## Branch & Versioning Notes

- The source repo default branch is `master`. The raw URL is hardcoded to `master`.
- The npm package version and the `CLAUDE.md` content are intentionally decoupled: the file is always fetched live, so pushing to `master` immediately updates what all users receive without a new npm publish.

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
- Custom target directory argument
- Windows terminal encoding fallback
