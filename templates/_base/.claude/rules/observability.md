# Observability — No Raw Logs in Production

## Rule: No console.log / print()

Never leave raw `console.log()`, `console.error()`, or `print()` in production code.
Use the project's structured logger instead (see CLAUDE.md Key Commands for import path).

## Structured Logging

All log entries must be JSON with at minimum:
- `level` — info | warn | error | debug
- `message` — human-readable description
- `timestamp` — ISO 8601

Include contextual IDs for traceability:
- `userId`, `requestId`, `traceId` — whatever is relevant to the domain
- On errors: always include the original error message and stack

## Log Levels

| Level | When to use |
|-------|-------------|
| `error` | Unexpected failures that need investigation |
| `warn` | Recoverable issues, degraded behaviour |
| `info` | Key business events (user signed in, order placed) |
| `debug` | Developer diagnostics — stripped in production |

## Where to Log

- ✅ Service/handler boundaries (entry + exit of key operations)
- ✅ External calls (DB, API) on failure
- ✅ Background jobs — start, end, duration
- ❌ Inside tight loops
- ❌ Middleware on every request (only on auth failure)

## Monitoring Stack Reference

Production monitoring: **Loki** (logs) · **Grafana** (dashboards) · **Tempo** (traces) · **Prometheus** (metrics)
