# T7 — Synthetic Dataset Generation (5,000 JSONL pairs)

GitHub: [#7](../../../issues/7) — `wayfinder:task`

**Blocked by:** — (no dependency; runs on this machine, no Oracle Cloud needed)
**Blocks:** T8

## Question

Generate the 5,000-pair synthetic JSONL dataset of GCC compiler errors → Platypus explanations
that TASK-3.1 (Master Roadmap) calls for, covering C-fundamentals error types a student in this
platform's mission set will actually hit.

## Scope

- Enumerate the error taxonomy to cover — start from `lib/errorClassifier.ts`'s 21
  `CompilerErrorType` variants (already the platform's own catalogue of known error shapes) and
  the GCC diagnostic fixtures under `.scratch/fixtures/gcc/`.
- Each JSONL row: `{ instruction, gcc_error, broken_line, explanation, direct_fix }` — matching
  the live `{ explanation, direct_fix }` API contract from T3, not doc 1's hint-ladder shape.
- Explanation constraint carried over from ADR-004 / T3's prompt contract: ≤3 sentences, no
  jargon, audience ages 13–18.
- Target: 5,000 pairs, weighted toward the error types students actually hit most (missing
  semicolon, undeclared identifier, type mismatch, unbalanced braces, etc. — pull real frequency
  data from `CompilerErrorCache.errorType` once T1's table has production rows; until then, weight
  by the 21-type catalogue evenly plus a hand-picked long tail).
- Train/val split (e.g. 90/10) called out explicitly in the dataset manifest so T8 doesn't have to
  re-derive it.

## Definition of done

- [ ] JSONL file(s) committed (or stored + linked, if too large for git) with a manifest
      describing taxonomy coverage and train/val split
- [ ] Schema matches T3's live API contract, not doc 1's superseded hint-ladder
- [ ] Spot-checked sample reviewed for tone/accuracy before T8 trains on it
