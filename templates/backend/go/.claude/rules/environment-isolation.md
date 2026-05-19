# Environment & Isolation — Go API

## Gitignore
```
bin/
tmp/
.env
.claude/
```

## Package Manager: Go modules (mandatory)
- Add dependency: `go get <module>`
- Tidy: `go mod tidy`
- Build: `go build ./...`
- Test: `go test ./...`
Never commit the `vendor/` directory unless CI requires it.

## Required Environment Variables
```
DATABASE_URL=    # PostgreSQL connection string
PORT=            # e.g. 8080
LOG_LEVEL=       # info | debug | warn | error
JWT_SECRET=      # Random 32-char secret
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
