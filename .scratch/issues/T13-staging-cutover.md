# T13 — Staging Cutover: Migration & E2E Student-Journey Suite

GitHub: [#13](../../../issues/13) — `wayfinder:task`

**Blocked by:** T5 (Platypus Interactive State Machine), ~~T6 (Premium Routing & Auth
Gating)~~ — deferred, see note below, T12 (CI/CD & Docker Compose Wiring)
**Blocks:** T14 (Production Telemetry, Load Test & Handoff)

> **T6 deferred (see MAP's "Decisions so far").** Not cancelled — landing it before any
> early-access/beta user still holds, since `directFix` is unredacted for every caller today.
> Effect on this ticket: the E2E suite's Reveal **free vs. premium** branch (below) has nothing
> to exercise yet — there's no premium/free CTA branching without T6, and no gating to verify.
> Cut this ticket's premium-path coverage from scope for now, or re-add T6 as a hard blocker
> once staging is meant to carry real (non-dev) users — whichever comes first.

## Question

Cut the feature over to staging: run the zero-downtime `CompilerErrorCache` migration against
the live database, and run doc 2's TASK-6.1 full student-journey E2E suite against the real
Oracle-backed pipeline.

## Scope

- `npx prisma migrate deploy` against the live PostgreSQL database for `CompilerErrorCache` —
  verify zero table-lock disruption for active users (doc 2, TASK-6.2).
- Automated browser E2E suite (`agent-browser`-style, per doc 2 TASK-6.1) simulating complete
  student journeys across the platform's mission set: compile a broken program, see the
  squiggle + gutter decal, click through Peeking → Loading → DefaultExplanation, exercise the
  Fixes (→`/debug-lab`) path, verify cache hit/miss behavior end-to-end against the real Oracle
  instance. **Reveal free vs. premium path deferred with T6** — nothing to exercise until that
  ticket lands; add it back to this suite when it does, don't let it quietly stay uncovered.
- Target: 100% pass rate across simulated workflows, per doc 2's stated success metric.

## Definition of done

- [ ] Migration applied cleanly to the live DB, zero lock disruption
- [ ] E2E suite covering the full student journey, run against the real (not mocked) Oracle
      pipeline
- [ ] 100% pass rate, or documented failures with a clear owner for each before this closes
