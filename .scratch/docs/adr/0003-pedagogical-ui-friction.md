# ADR-003: Pedagogical UI Friction with Artificial Animation Delays and Client-Side Upsell Routing

## Status
Accepted

## Context
The Reveal Friction state machine (`Hidden → Peeking → Loading → Default Explanation →
Premium Reveal`) was originally designed assuming Ollama generation latency would naturally
gate the `Loading` state. Once `CompilerErrorCache` is warm, most requests resolve in ~5ms,
which would make `Loading` flash invisibly — undermining the "Platypus is thinking" gamified
feel and removing the intended beat where a student pauses to think before seeing the answer.

We also needed to decide the exact triggers for each state transition, and what a Free user
sees when they click "Reveal" (since `direct_fix` is stripped server-side per ADR-002).

## Decision
- **Hidden → Peeking** is fully automatic, firing the instant Judge0 returns a fatal AST
  error — no network call happens at this point. This preserves "Peeking" as pedagogical
  friction (encouraging the student to read the error themselves) rather than a loading mask.
- **Peeking → Loading** fires only on explicit student action (clicking the speech bubble),
  which is what triggers the `app/api/compiler/explain/route.ts` request.
- **Loading** enforces a minimum 500ms artificial delay via Framer Motion regardless of
  actual cache/generation latency, so the "thinking" beat is preserved even on a 5ms cache
  hit.
- **Default Explanation → Premium Reveal**: the "Reveal" CTA renders identically for Free and
  Premium users. For Premium users it reveals `direct_fix`. For Free users, clicking it opens
  a Premium Upsell Modal instead of expanding a code block — the CTA is never hidden or
  disabled, it is always an entry point to either the fix or the upsell.

## Consequences
- Preserves the intended pedagogical pacing (read → think → ask → learn → optionally pay)
  even as the cache matures and Ollama latency disappears from the critical path.
- The "Reveal" CTA doubles as a monetization funnel for every Free user who reaches Default
  Explanation, without a separate upsell placement.
- Known tradeoff: the artificial 500ms delay is a deliberate UX decision, not a technical
  necessity — must not be "optimized away" by a future contributor who notices the cache is
  fast.
