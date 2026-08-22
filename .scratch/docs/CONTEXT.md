# Platypus AI Diagnostic Assistant — Feature Context

> Feature-scoped context. The repo-wide context lives in [`/CONTEXT.md`](../../CONTEXT.md).
> Decisions are recorded in [`adr/`](./adr/). This document is a **glossary and problem
> statement**, not a spec — implementation detail belongs in ADRs and tickets.

## Problem

Students in standards 8th–12th (ages 13–18) learning C on Code Undercover hit raw GCC
compiler output, which is dense, jargon-heavy, and frequently a cascade of dozens of
diagnostics stemming from one upstream mistake. This is a primary drop-off point: the
student cannot tell which error matters, cannot parse the terminology, and abandons the
mission.

The Platypus AI Diagnostic Assistant surfaces **one** error at a time, explained in plain
English, with an optional concrete fix gated behind premium.

## Constraints

- **Audience** — explanations must be jargon-free plain English, maximum 3 sentences.
- **Compute budget** — the SLM (`qwen2.5-coder-platypus:3b`, quantized) runs on a single
  Oracle Cloud Always Free ARM instance. Cold starts, OOM kills, and CPU throttling are
  expected operating conditions, not edge cases.
- **Deployment** — the Next.js app is serverless on Vercel; per-request wall-clock is
  bounded and long synchronous work is not viable.
- **Pedagogy over convenience** — friction in the reveal flow is deliberate. The student
  should attempt to read the error before the AI explains it.

## Domain Glossary

### Root Error
The fatal GCC diagnostic with the lowest source line (tie-broken by column) among
`kind == "error"` entries in Judge0's `-fdiagnostics-format=json` output. `note` and
`warning` entries are excluded; nested `children` diagnostics are discarded in favor of
their parent.

A deterministic **proxy** for the causal root of an error cascade — not the product of real
dependency analysis. See [ADR-001](./adr/0001-deterministic-root-error-selection.md).

### Compiler Error Cache
The global, cross-student store of AI-generated diagnostics, keyed by a normalized hash of
the Root Error message plus the offending line's content. Deliberately not keyed on the
whole program (whitespace/comment churn kills hit rate) nor on the user (prevents sharing).

Two students who make the same mistake share one cache row. See
[ADR-002](./adr/0002-global-error-line-hashing.md).

### Explanation
The plain-English, ≤3-sentence, jargon-free description of *why* the Root Error occurred.
Visible to every user regardless of tier.

### Direct Fix
The concrete code-level correction for the Root Error. Generated in the same pass as the
Explanation and stored in the same cache row, but withheld from non-premium users at the
API boundary. See [ADR-002](./adr/0002-global-error-line-hashing.md).

### Reveal Friction State Machine
The staged UI progression a Root Error passes through:
`Hidden → Peeking → Loading → Default Explanation → (Premium Reveal)`.

- **Hidden** — default on mount and after a clean compile.
- **Peeking** — entered automatically the instant a fatal error is detected. No network
  call has occurred. This is the pedagogical beat: the answer is available, but the student
  is invited to try first.
- **Loading** — entered only on explicit student action. Holds for a minimum duration even
  on an instant cache hit, to preserve the "Platypus is thinking" character.
- **Default Explanation** — the Explanation is shown to all users.
- **Premium Reveal** — reached by premium users; free users reaching for it get the upsell
  instead.

See [ADR-003](./adr/0003-pedagogical-ui-friction.md).

### Fallback Explanation
The kid-friendly stand-in returned when the SLM is unreachable, too slow, or returns
output that fails schema validation. Flows through the state machine identically to a real
Explanation, so there is no separate error UI.
See [ADR-004](./adr/0004-ollama-failure-handling.md).

### Debug Lab
The `/debug-lab` route reached via the "Fixes" CTA. A separate surface from the Reveal
Friction State Machine, not a state within it.

### Premium User
A NextAuth-authenticated user with premium entitlement. Entitlement is evaluated per
request at the API boundary and never persisted into a cache row.

## Decisions

| ADR | Decision |
|---|---|
| [001](./adr/0001-deterministic-root-error-selection.md) | Root Error selected by source-coordinate order, as a proxy for causal root |
| [002](./adr/0002-global-error-line-hashing.md) | Global error+line cache key; premium redaction at the API layer, not the cache layer |
| [003](./adr/0003-pedagogical-ui-friction.md) | Friction and minimum loading delay are deliberate; the Reveal CTA doubles as the upsell funnel |
| [004](./adr/0004-ollama-failure-handling.md) | Fail-fast single attempt with timeout; kid-friendly fallback payload on any failure |

## Open Questions

- **Abuse / compute exhaustion** — nothing currently prevents a student from spam-compiling
  trivial variations of a broken line to force repeated cache misses and burn the Oracle
  free-tier budget. Rate limiting (`lib/rate-limit.ts`, Upstash) is available but not yet
  applied to this path. Unresolved.
- **Normalization precision** — `normalized()` in the cache key must be strict enough that
  unrelated broken lines don't collide into a misleading shared Explanation, and loose
  enough that near-identical mistakes still share a hit. Boundary not yet pinned down.
