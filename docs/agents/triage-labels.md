# Triage Labels

This project uses five canonical triage labels. Each represents a role in the workflow.

## Label vocabulary

| Label | Meaning | Next step |
|-------|---------|-----------|
| `needs-triage` | Issue awaits initial categorization | Assign one of the other four labels |
| `needs-info` | Blocked on more details from reporter | Reporter responds, then re-label |
| `ready-for-agent` | Ready for Claude to work on | Agent picks it up and starts implementation |
| `ready-for-human` | Ready for human review, merge, or followup | Assign to a human, schedule review |
| `wontfix` | Intentionally closed; not planned | Close the issue |

## When to apply each label

**`needs-triage`** — Use on new issues until categorized. Switch to another label once you understand the scope.

**`needs-info`** — Use when you need clarification. Examples:
- User didn't provide enough context
- Unclear which component is affected
- Reproduction steps are missing

**`ready-for-agent`** — Use when the issue is well-scoped and Claude can start. Examples:
- Bug with clear reproduction steps
- Feature request with acceptance criteria
- Refactoring task with scope defined

**`ready-for-human`** — Use when work is done or nearly done. Examples:
- PR is ready for code review
- Task is done but needs sign-off
- Follow-up action needed from a team member

**`wontfix`** — Use when rejecting an issue. Include a comment explaining why (duplicate, out of scope, not supported, etc.).

## PRs as a request surface

**Disabled by default.** If enabled, pull requests are also triaged with the same labels:
- `needs-triage` — PR awaits review and categorization
- `needs-info` — PR needs changes before merge
- `ready-for-agent` — PR is ready for automated review/fixes
- `ready-for-human` — PR is ready for human review
- `wontfix` — PR is rejected or closed

To enable: set `include_prs: true` in your `triage` skill configuration.
