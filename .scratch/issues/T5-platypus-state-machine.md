# T5 — Platypus Interactive State Machine

**Blocked by:** T3, T4
**Blocks:** T6
**ADRs:** [ADR-003](../docs/adr/0003-pedagogical-ui-friction.md)

## Goal

Wire Phase A (T4's Root Error) to Phase B (T3's explanation API) through the Reveal Friction
State Machine. Ships **without** premium gating — `directFix` is simply never displayed yet.
T6 adds the gate.

## Files touched

| File | Change |
|---|---|
| `components/platypus/RevealPanel.tsx` | **New.** The state machine host |
| `components/platypus/useRevealState.ts` | **New.** State machine hook |
| `components/platypus/useRevealState.test.ts` | **New.** |
| `components/platypus/PlatypusMascot.tsx` | **New.** Framer Motion mascot |
| `app/(mission)/.../CodingPhase.tsx` | Mount `RevealPanel` |

## State machine (binding — ADR-003)

```
                  compile OK / mount
        ┌──────────────── Hidden ◄────────────────┐
        │                   │                     │
        │      fatal Root Error detected          │ new compile starts
        │         (AUTOMATIC, no fetch)           │
        │                   ▼                     │
        │                Peeking ─────────────────┤
        │                   │                     │
        │       student CLICKS speech bubble      │
        │            (fires the fetch)            │
        │                   ▼                     │
        │                Loading ─────────────────┤
        │                   │                     │
        │     API resolves AND ≥500ms elapsed     │
        │                   ▼                     │
        └───────── DefaultExplanation ────────────┘
                            │
                  clicks "Reveal"  → T6
                            ▼
                     PremiumReveal
```

### Transition rules

| From | To | Trigger | Network? |
|---|---|---|---|
| `Hidden` | `Peeking` | Root Error detected in compile result | **No** |
| `Peeking` | `Loading` | Student clicks the speech bubble | **Yes** — fires POST |
| `Loading` | `DefaultExplanation` | Response resolved **AND** ≥500ms elapsed | — |
| any | `Hidden` | A new compile begins | — |

**The 500ms floor is a `Math.max`, not a `setTimeout` chain:**
```ts
const [payload] = await Promise.all([
  fetchExplanation(...),
  new Promise(r => setTimeout(r, 500)),
])
```
A cache hit (~5ms) and a fresh generation (~3s) both feel like Platypus thinking. This is
deliberate — see ADR-003. **Do not "optimize" it away.**

## Critical invariants

1. **Peeking makes zero network calls.** This is the entire pedagogical point — the student
   is invited to read the error themselves first. A prefetch-on-peek "optimization" destroys
   the feature *and* burns Oracle compute for students who never ask.
2. **One in-flight request per error.** Rapid double-clicks must not fire two POSTs.
3. **Stale response guard.** If the student recompiles while a request is in flight, the
   late response must be discarded — never rendered against the new error.

## Verification criteria (TDD)

**`useRevealState.test.ts`:**

1. Initial state is `Hidden`.
2. Root Error arrives → auto-transitions to `Peeking`; **`fetch` not called**.
3. Click in `Peeking` → `Loading`; `fetch` called exactly once.
4. Response at 5ms → still `Loading` at t=400ms; `DefaultExplanation` at t≥500ms
   *(fake timers)*.
5. Response at 3000ms → `DefaultExplanation` at ~3000ms, **not** 3500ms (parallel, not additive).
6. Double-click in `Peeking` → exactly **one** `fetch`.
7. New compile mid-`Loading` → returns to `Hidden`; late response discarded, not rendered.
8. Clean compile (no Root Error) → stays `Hidden`.
9. Fallback payload from T3 → renders as a normal `DefaultExplanation`, no error UI.
10. `Peeking` → `Hidden` on new compile without ever fetching.

**Component:**

11. Mascot animates in on `Peeking` with a pulsing `(...)`.
12. Speech bubble is keyboard-accessible (Enter/Space) and focusable.
13. `prefers-reduced-motion` respected — the 500ms delay still applies, but without motion.

## Definition of done

- [ ] `useRevealState` is testable **without** rendering — a pure hook
- [ ] Test 2 (Peeking issues no fetch) passes — the single most important assertion here
- [ ] Test 5 (parallel not additive) passes
- [ ] Stale-response guard verified by test 7
- [ ] `directFix` is **not rendered** in this ticket, even when present in the payload
- [ ] All 13 criteria pass
