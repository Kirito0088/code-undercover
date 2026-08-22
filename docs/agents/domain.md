# Domain Documentation

This file describes how domain documentation is organized and how skills should consume it.

## Layout: Single-context

This repo uses a **single-context** layout:

- **`CONTEXT.md`** — At the repo root; describes the codebase, its purpose, and key concepts
- **`docs/adr/`** — Architecture Decision Records; captures significant technical decisions
- **`docs/agents/`** — Configuration for engineering skills (this directory)

All skills read from a single `CONTEXT.md` at the repo root.

## CONTEXT.md structure

Your `CONTEXT.md` should include:

- **Project overview** — What does this codebase do? Who are the users?
- **Architecture** — How is it organized? What are the major components?
- **Key concepts** — Domain-specific terms and their meanings
- **Development workflow** — How to run tests, start the dev server, deploy
- **Conventions** — Code style, naming, file organization
- **Known issues or quirks** — Gotchas that affect day-to-day work
- **Links** — To docs, dashboards, deployment systems, etc.

**Start with a stub and grow it over time.** It doesn't need to be comprehensive from day one.

## ADRs: docs/adr/

Architecture Decision Records capture *why* major decisions were made. Create a new ADR when:

- Choosing between competing architectural approaches
- Adopting a new tool or framework
- Changing how a major component works
- Establishing a new pattern or convention

**Naming:** `NNNN-brief-title.md` (e.g., `0001-nextjs-app-router.md`)

**Format:**
```markdown
# ADR 1: Next.js App Router

## Status
Accepted

## Context
[Why did we need to decide?]

## Decision
[What did we decide?]

## Consequences
[What are the implications?]
```

## How skills use this

- **`to-spec`** — Reads `CONTEXT.md` to understand scope and constraints
- **`triage`** — Reads `CONTEXT.md` to understand what the project is about
- **`to-tickets`** — Reads `CONTEXT.md` and ADRs when creating issues from specs
- **`systematic-debugging`** — Reads `CONTEXT.md` to understand how the system works

Skills also use domain files you link in issue descriptions (e.g., "See API.md for endpoint definitions").

## Multi-context layout (not used here)

If this were a monorepo with multiple contexts (e.g., frontend and backend), we'd use a `CONTEXT-MAP.md` at the root pointing to per-context `CONTEXT.md` files in subdirectories. Since you have a single codebase, single-context is simpler.
