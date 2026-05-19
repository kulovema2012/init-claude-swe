# Environment & Isolation — React Native (Expo)

## Gitignore
```
node_modules/
.expo/
android/
ios/
.env
.claude/
```

## Package Manager: bun (mandatory)
- Install: `bun add <pkg>`
- Dev: `bun add -d <pkg>`
- Run: `bun run <script>`
- Test: `bun test`
Never use npm, yarn, or pnpm.

## Required Environment Variables
```
EXPO_PUBLIC_API_URL=   # Backend API base URL (exposed to client)
EXPO_PUBLIC_APP_ENV=   # development | staging | production
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
