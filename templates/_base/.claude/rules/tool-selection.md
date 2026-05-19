# Tool & Agent Selection

## Skill Invocation Order

Invoke the relevant skill BEFORE any response when there is even a 1% chance it applies.

| Task Type | Skill to Invoke First |
|-----------|----------------------|
| New feature or component | `superpowers:brainstorming` |
| Bug fix / unexpected behaviour | `superpowers:systematic-debugging` |
| Multi-step implementation | `superpowers:writing-plans` |
| Executing an existing plan | `superpowers:executing-plans` |
| Before claiming work is done | `superpowers:verification-before-completion` |
| Any code change | `superpowers:test-driven-development` |
| 2+ independent tasks | `superpowers:dispatching-parallel-agents` |

## Agent Selection

| Agent | When to Use |
|-------|-------------|
| `Explore` | Codebase exploration, finding files, understanding architecture |
| `Plan` | Implementation strategy, architectural decisions |
| `application-performance:frontend-developer` | UI components, React, CSS |
| `api-scaffolding:backend-architect` | API design, service boundaries |
| `database-design:database-architect` | Schema design, migrations |
| `backend-development:security-auditor` | Security review |
| `backend-development:performance-engineer` | Optimisation |
| `agent-teams:team-lead` | 3+ tasks, multi-domain, parallel workstreams |

## Agent Team Trigger

Dispatch a team when the task has **3 or more distinct steps** OR touches **2+ domains**.

Workflow: `brainstorming → dispatching-parallel-agents → team-spawn → team-status → team-shutdown`
