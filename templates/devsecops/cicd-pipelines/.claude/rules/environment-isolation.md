# Environment & Isolation — CI/CD Pipelines

## Gitignore
```
.env
*.tfstate
secrets/
.terraform/
.claude/
```

## Toolchain
- GitHub Actions / GitLab CI — pipeline definitions
- Docker — containerised build and runtime
- `act` — local workflow runner (github.com/nektos/act)
- `trivy` — image and filesystem vulnerability scanner
- `docker-compose` — local multi-service orchestration

## Required Environment Variables / Secrets
```
DOCKER_REGISTRY=      # e.g. ghcr.io/org or registry.gitlab.com/org
GITHUB_TOKEN=         # auto-injected in Actions; set manually for act
SONAR_TOKEN=          # SonarCloud / SonarQube quality gate
```

## Worktree Isolation
Each pipeline change lives in an isolated git worktree:
```bash
git worktree add ../feat-pipeline feat/feat-pipeline
```
