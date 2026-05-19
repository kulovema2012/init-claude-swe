# Environment & Isolation — Flutter

## Gitignore
```
build/
.dart_tool/
.flutter-plugins
.flutter-plugins-dependencies
.env
.claude/
```

## Package Manager: flutter pub (mandatory)
- Install: `flutter pub add <pkg>`
- Dev: `flutter pub add --dev <pkg>`
- Get: `flutter pub get`
- Test: `flutter test`
Never use bun, npm, or pip for Dart/Flutter packages.

## Required Environment Variables
```
# Inject via --dart-define at build time or use flutter_dotenv package:
API_URL=               # Backend API base URL
APP_ENV=               # development | staging | production
```

## Worktree Isolation
Each feature/fix lives in an isolated git worktree:
```bash
git worktree add ../feature-name feat/feature-name
```
