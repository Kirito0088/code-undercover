# Issue Tracker: GitHub Issues

This project uses **GitHub Issues** as its issue tracker.

## How skills use this

Engineering skills (`to-tickets`, `triage`, `to-spec`) read from and write to GitHub Issues using the `gh` CLI:

- **`to-tickets`** — creates issues from spec documents
- **`triage`** — reads issues, applies labels, and updates status
- **`to-spec`** — converts issues into spec documents

## Setup

Ensure the `gh` CLI is installed and authenticated:

```bash
gh auth status
```

If not authenticated, run:

```bash
gh auth login
```

## GitHub Issues workflow

- **Create an issue** — `gh issue create --title "..." --body "..."`
- **List issues** — `gh issue list --label needs-triage`
- **Add label** — `gh issue edit <number> --add-label needs-info`
- **Close issue** — `gh issue close <number>`

See [GitHub CLI docs](https://cli.github.com/manual/gh_issue) for full reference.

## PRs as a request surface

**Disabled by default.** If you want to include pull requests in the triage queue (treating them as feature requests or changes to review), update this setting in `docs/agents/triage-labels.md` under "PRs as a request surface".

## Linking issues in commits

When working on an issue, reference it in your commit message:

```
git commit -m "Fix login validation

Closes #42"
```

This auto-links the commit to the issue and closes it when merged to main.
