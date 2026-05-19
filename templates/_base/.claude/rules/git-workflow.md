# Git Workflow — Strict Atomic Pushing

## The Rule

Every logical change must be committed and pushed immediately.

```
Change → Test → Lint → Stage → Commit → Push → Next Change
```

Never batch unrelated changes. Never leave uncommitted work at session end.

## Commit Message Format (Gitmoji Standard)

```
<emoji> <type>(<scope>): <description>
```

| Emoji | Type | Usage |
|-------|------|-------|
| ✨ | feat | New feature |
| 🐛 | fix | Bug fix |
| ♻️ | refactor | Improve without behaviour change |
| 📝 | docs | Documentation |
| ✅ | test | Add or update tests |
| 🔧 | chore | Maintenance |
| ⚡ | perf | Performance improvement |
| 🎨 | style | Formatting only |
| 🧪 | experiment | Non-production exploration |

**Example:** `git commit -m "✨ feat(auth): add JWT refresh token rotation"`

## Staging

Always stage specific files — never `git add .` or `git add -A`.
This prevents accidentally committing `.env`, secrets, or build artefacts.

## Branch Naming

- Features: `feat/<short-description>`
- Fixes: `fix/<short-description>`
