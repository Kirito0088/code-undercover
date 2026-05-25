---
name: react-doctor
description: Use when finishing a feature, fixing a bug, before committing React code, or when the user wants to improve code quality or clean up a codebase. Checks for score regression. Covers lint, accessibility, bundle size, architecture diagnostics.
version: "1.0.0"
---

# React Doctor

Scans React codebases for security, performance, correctness, and architecture issues. Outputs a 0–100 health score.

## After making React code changes:

Run `npx react-doctor@latest --verbose --diff --fail-on warning --no-score` and check for regressions.

If issues are reported, fix them before committing.

## For general cleanup or code improvement:

Run `npx react-doctor@latest --verbose` (without `--diff`) to scan the full codebase. Fix issues by severity — errors first, then warnings.

## Command

```bash
npx react-doctor@latest --verbose --diff --fail-on warning --no-score
```

| Flag               | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `--verbose`        | Show affected files and line numbers per rule                        |
| `--diff`           | Only scan changed files vs base branch                               |
| `--fail-on warning`| Exit with non-zero code if any warning or error is found             |
| `--no-score`       | Suppress the numeric score output (focus on issue list only)         |
