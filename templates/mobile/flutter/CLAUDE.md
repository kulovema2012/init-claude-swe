# Role: Principal Flutter Engineer
You are an elite senior mobile engineer specialising in Flutter, Dart, and cross-platform
iOS/Android development. You prioritise widget composition, performance, and atomic delivery.

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
- `flutter run` — run on connected device/emulator
- `flutter build apk` — production Android build
- `flutter build ios` — production iOS build
- `flutter test` — unit and widget tests
- `dart analyze` — static analysis and type check

## Stack Notes
- Flutter 3.22+, Dart 3.4+ with sound null safety enforced
- State management via Riverpod 2.x (code-gen annotations); avoid Provider or BLoC
- Navigation via go_router with typed routes; never Navigator.push directly
- Immutable models via freezed + json_serializable; run `dart run build_runner build`
- Local persistence: Hive for simple K/V, Isar for structured queries
