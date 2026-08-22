# ADR-001: Deterministic Root Error Selection via Source-Coordinate Order

## Status
Accepted

## Context
Judge0 GCC execution with `-fdiagnostics-format=json` can return many diagnostics for a
single broken program — often a cascade of dozens of downstream errors caused by one
upstream AST break (e.g. an unclosed brace or missing semicolon). We need a deterministic,
cheap way to pick the *one* error to surface to the student as "the" error, without running
real causal/dependency analysis on the AST.

Three candidate strategies were considered:
1. Causal root via dependency analysis (accurate, but requires building a real dependency
   graph over GCC's diagnostics — expensive and fragile).
2. Chronological order as GCC emits it (trivial, but GCC's emission order is not guaranteed
   to match source order or causal order).
3. Lowest source coordinate (line, then column) among fatal `kind == "error"` diagnostics.

## Decision
We select the error with the lowest `locations[0].caret.line` (tie-broken by
`locations[0].caret.column`) among diagnostics where `kind == "error"`, discarding `note`
and `warning` entries. If the selected error has nested `children` diagnostics, we treat the
parent as the root and discard the children.

This is used as a deterministic **proxy** for the true causal root, not a guarantee of it.

## Consequences
- Cheap, deterministic, and requires no AST/dependency graph work.
- Correct in the common case: in student C code, ~90% of downstream errors are parser/AST
  cascades from one upstream break, and that break is almost always the earliest line.
- Matches students' linear top-to-bottom reading model, which is a pedagogical goal, not
  just an implementation shortcut.
- Known limitation: for two truly *independent* errors (e.g. an undefined reference on line
  5 and an unrelated type mismatch on line 12), this always surfaces the earlier line first,
  not necessarily the "more root" cause. This is accepted: fixing line 5 first is still a
  reasonable next step, and line 12 will naturally become the new root error on the next
  compile.
