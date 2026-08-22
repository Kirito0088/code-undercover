# T2 — Deterministic GCC AST Extraction (Judge0 JSON parser)

**Blocked by:** —
**Blocks:** T3, T4
**ADRs:** [ADR-001](../docs/adr/0001-deterministic-root-error-selection.md)

## Goal

Replace the current regex-over-stderr diagnostic parsing with structured parsing of GCC's
`-fdiagnostics-format=json` output, and implement deterministic Root Error selection.

> **Pre-existing state:** `lib/compiler.ts:113` currently implements
> `parseGccDiagnostics(sanitizedStderr)` using the regex
> `/^\S+:(\d+):(\d+):\s*(error|warning|note|fatal error):\s*(.+)$/`. This ticket supersedes
> that function. Keep it until T2 is green, then delete it in the same PR.

## Files touched

| File | Change |
|---|---|
| `lib/compiler.ts` | Add `-fdiagnostics-format=json` to compiler args; swap `parseGccDiagnostics` → `parseGccJsonDiagnostics`; delete the regex parser |
| `lib/gccDiagnostics.ts` | **New.** JSON parsing + Root Error selection |
| `lib/gccDiagnostics.test.ts` | **New.** Unit tests with real GCC JSON fixtures |
| `types/index.ts` | Extend `CompilerDiagnostic` with `children` and `endLine`/`endColumn` |
| `.scratch/fixtures/gcc/*.json` | **New.** Captured real GCC JSON outputs |

## Type changes

```ts
// types/index.ts — extended, backwards-compatible
export interface CompilerDiagnostic {
    line: number
    column: number
    type: "error" | "warning" | "note"
    message: string
    rawContext: string
    endLine?: number      // NEW — from locations[0].finish, for Monaco range markers
    endColumn?: number    // NEW
    children?: CompilerDiagnostic[]  // NEW — nested GCC diagnostics
}
```

`endLine`/`endColumn` exist because T4 needs a *range* to underline, not just a caret point.

## Public interface

```ts
// lib/gccDiagnostics.ts
export function parseGccJsonDiagnostics(rawStderr: string): CompilerDiagnostic[]
export function selectRootError(diagnostics: CompilerDiagnostic[]): CompilerDiagnostic | null
```

## Selection algorithm (binding — ADR-001)

1. Filter to `kind === "error"` **and** `kind === "fatal error"`. Discard `warning`, `note`.
2. Sort ascending by `locations[0].caret.line`, tie-break `locations[0].caret.column`.
3. Return the first. Its `children` are retained on the object but are **not** candidates
   for selection.
4. Empty input, or input with no errors → `null`.

## Robustness requirements

GCC emits JSON on stderr, but Judge0 may interleave it with other output. The parser must:
- Locate the JSON array within surrounding noise (GCC's JSON is a top-level `[...]`).
- Return `[]` — never throw — on malformed/absent JSON.
- Tolerate diagnostics with an empty `locations` array (skip them; they cannot be
  positioned).

## Verification criteria (TDD)

**Fixtures required** (capture from real GCC, commit to `.scratch/fixtures/gcc/`):

| Fixture | Scenario |
|---|---|
| `missing-semicolon-cascade.json` | One missing `;` on line 4 producing 5+ downstream errors |
| `independent-errors.json` | Undefined ref line 5 + type mismatch line 12, unrelated |
| `warnings-only.json` | Compiles successfully with warnings, zero errors |
| `nested-children.json` | An error with a populated `children` array |
| `empty-locations.json` | A diagnostic with `locations: []` |
| `malformed.txt` | Truncated / non-JSON stderr |

**Test cases:**

1. `missing-semicolon-cascade` → Root Error is the **line 4** diagnostic, not any cascade child.
2. `independent-errors` → Root Error is the **line 5** diagnostic (lower line wins, per ADR-001).
3. `warnings-only` → `selectRootError` returns `null`; `parseGccJsonDiagnostics` returns
   the warnings.
4. `nested-children` → the parent is selected; `children` populated on the returned object;
   no child is ever returned as the root.
5. Tie-break — two errors on the **same line**, columns 5 and 12 → column 5 wins.
6. `empty-locations` → the un-positionable diagnostic is skipped without throwing.
7. `malformed.txt` → returns `[]`, does not throw.
8. `[]` input → `selectRootError` returns `null`.
9. **Determinism** — shuffling the input array's order does not change the selected root.

**Integration check:** an end-to-end Judge0 run of known-broken C returns a `diagnostics`
array whose root matches the hand-computed expectation.

## Definition of done

- [ ] `parseGccJsonDiagnostics` and `selectRootError` are **pure** — no I/O
- [ ] Old regex `parseGccDiagnostics` deleted; no remaining callers
- [ ] All 9 test cases pass against committed fixtures
- [ ] Existing `lib/compiler.ts` callers still compile and pass
- [ ] `npm run lint` and `npm test` green
