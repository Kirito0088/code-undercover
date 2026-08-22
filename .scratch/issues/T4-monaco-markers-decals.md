# T4 — Monaco Editor Markers & Gutter Decals

**Blocked by:** T2
**Blocks:** T5
**ADRs:** [ADR-001](../docs/adr/0001-deterministic-root-error-selection.md)

## Goal

Complete the Phase A loop visually: the student compiles, and the Root Error is underlined
in the editor with a Platypus decal in the gutter. **Zero AI, zero network calls beyond the
existing compile request.** This ticket must be fully useful on its own even if T3/T5 never
ship.

## Files touched

| File | Change |
|---|---|
| `components/editor/` | Monaco wrapper — apply markers + decorations |
| `lib/monacoMarkers.ts` | **New.** Pure `CompilerDiagnostic[]` → `IMarkerData[]` mapping |
| `lib/monacoMarkers.test.ts` | **New.** |
| `app/globals.css` or design-system | Gutter decal styling |

> Locate the existing Monaco integration before starting — the editor component path above
> is a placeholder. Do not create a second editor wrapper.

## Public interface

```ts
// lib/monacoMarkers.ts
export function toMonacoMarkers(
  diagnostics: CompilerDiagnostic[],
  rootError: CompilerDiagnostic | null
): IMarkerData[]

export function toGutterDecorations(
  rootError: CompilerDiagnostic | null
): IModelDeltaDecoration[]
```

## Coordinate mapping (the classic off-by-one trap)

**GCC is 1-based for both line and column. Monaco is 1-based for both.**
No conversion is needed — but this must be asserted in tests, because the instinct to
subtract 1 (from 0-based editor APIs elsewhere) is the single most likely bug in this ticket.

Range construction:
- `startLineNumber` = `diagnostic.line`
- `startColumn` = `diagnostic.column`
- `endLineNumber` = `diagnostic.endLine ?? diagnostic.line`
- `endColumn` = `diagnostic.endColumn ?? diagnostic.column + 1`

The `+ 1` fallback exists because Monaco renders a zero-width range as nothing at all — a
caret-only diagnostic with no `finish` would be invisible.

## Visual behavior

- **Root Error** — `MarkerSeverity.Error`, full squiggle, **plus** a Platypus gutter decal
  on that line.
- **Non-root errors** — `MarkerSeverity.Error`, squiggle, **no** decal. Exactly one decal
  ever renders.
- **Warnings** — `MarkerSeverity.Warning`, no decal.
- Markers are **cleared** at the start of every compile, before new results arrive. A stale
  marker from a previous run pointing at a line the student has since edited is actively
  misleading.

## Verification criteria (TDD)

**`lib/monacoMarkers.test.ts`:**

1. GCC line 4 col 9 → marker `startLineNumber: 4`, `startColumn: 9` — **no off-by-one**.
2. Diagnostic with `endLine`/`endColumn` → range spans to those values.
3. Diagnostic without `endLine`/`endColumn` → `endColumn === column + 1` (non-zero width).
4. Root error → severity `Error` **and** appears in `toGutterDecorations`.
5. Non-root errors → severity `Error`, **absent** from `toGutterDecorations`.
6. Warning → severity `Warning`.
7. `rootError: null` → `toGutterDecorations` returns `[]`.
8. Multiple errors → **exactly one** decoration returned.
9. Empty diagnostics → both functions return `[]`.

**Component / manual verification:**

10. Compile broken C → squiggle appears on the correct line; decal in the gutter on that
    same line.
11. Fix the error, recompile → all markers and the decal clear.
12. Compile a **second** broken program → no stale markers from the first run survive.
13. Multi-error program → exactly one gutter decal, on the lowest-line error.

## Definition of done

- [ ] `toMonacoMarkers` / `toGutterDecorations` are **pure** — no Monaco instance required
      to unit test them
- [ ] Off-by-one explicitly asserted (test 1)
- [ ] Markers cleared on every compile start, verified by test 12
- [ ] Decal styling honors the existing design system, not ad-hoc CSS
- [ ] All 13 criteria pass
