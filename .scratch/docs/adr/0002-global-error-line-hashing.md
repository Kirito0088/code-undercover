# ADR-002: Global Error-Line Hashing with Late-Stage API Auth Redaction

## Status
Accepted

## Context
`CompilerErrorCache` needs a cache key strategy for AI-generated `{explanation, direct_fix}`
payloads. The two extremes are: (a) hash the whole program, which maximizes correctness but
minimizes cache hit rate (comments/whitespace/variable-name differences prevent reuse across
students who make the "same" mistake), or (b) hash per-user, which prevents any cross-student
cache sharing at all.

We also need to decide whether `direct_fix` (a premium-gated field) is computed at
generation time for everyone, or only on-demand for premium users — and if computed for
everyone, how we prevent free users from obtaining it.

## Decision
- **Cache key**: `SHA-256(normalized(rootErrorMessage) + normalized(brokenLineContent))`.
  Not the whole program, not the user ID. This intentionally lets two different students who
  trigger an equivalent root error on an equivalent line share one cache row.
- **Cache payload**: on a cache miss, the Ollama SLM generates and stores **both**
  `explanation` and `direct_fix` in a single pass, in the same row, regardless of who
  triggered the generation (free or premium student).
- **Authorization**: the cache is user-agnostic. Premium gating happens exclusively at the
  Next.js API route (`app/api/compiler/explain/route.ts`), which checks the NextAuth session
  and strips `direct_fix` from the JSON response for non-premium users before it ever reaches
  the client.

## Consequences
- Maximizes cache hit rate across the whole student population — common mistakes (e.g.
  `int x = "hello";`) are only ever sent to Ollama once, system-wide.
- `direct_fix` for a given error is only ever generated once, even though many free students
  will trigger that same error — good for Oracle Free Tier ARM compute budget.
- **Security-critical constraint**: redaction of `direct_fix` MUST happen server-side in the
  route handler, never as a client-side conditional render on a fully-hydrated payload — the
  full object must never be sent over the wire to a non-premium client, or it is trivially
  readable via devtools/network inspection.
- Known limitation: cache normalization (`normalized(...)`) must be defined precisely enough
  that trivially different broken lines don't collide into a misleading shared explanation,
  and not so strict that near-identical mistakes fail to share a cache hit. Left to
  implementation; not a domain concern.
