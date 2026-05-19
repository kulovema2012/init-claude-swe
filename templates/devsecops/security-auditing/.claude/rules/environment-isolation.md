# Environment & Isolation — Security Auditing

## Gitignore
```
.venv/
reports/
*.sarif
.env
.claude/
```

## Toolchain
- `semgrep` — multi-language SAST (semgrep.dev)
- `trivy` — container and filesystem vulnerability scanner
- `gitleaks` — secret detection in git history
- OWASP ZAP — dynamic application security testing (DAST)
- `nuclei` — template-based vulnerability scanner
- `uv` — Python toolchain for bandit / safety

## Required Environment Variables / Secrets
```
SEMGREP_APP_TOKEN=    # Semgrep Cloud Platform token
SNYK_TOKEN=           # Snyk vulnerability database token
GITLEAKS_LICENSE=     # Required for gitleaks v8+ enterprise features
```

## Worktree Isolation
Each security change lives in an isolated git worktree:
```bash
git worktree add ../security-fix fix/security-fix
```
