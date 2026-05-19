# Environment & Isolation — Native iOS / Android

## Gitignore
```
# iOS
DerivedData/
*.xcuserstate
*.xcworkspace/xcuserdata/
.env

# Android
build/
.gradle/
local.properties
.env

.claude/
```

## Package Manager
- iOS: **Swift Package Manager** — add via Xcode or `Package.swift`
- Android: **Gradle** — declare in `build.gradle.kts` dependencies block
Never use bun, npm, or pip for native dependencies.

## Required Environment Variables
```
# iOS: define in xcconfig files (Debug.xcconfig / Release.xcconfig)
API_URL=               # Backend API base URL
APP_ENV=               # debug | release

# Android: define in local.properties (gitignored) or gradle.properties
API_URL=               # Backend API base URL
APP_ENV=               # debug | release
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
