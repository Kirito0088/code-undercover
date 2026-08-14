import type { editor } from 'monaco-editor'
import { CompilerDiagnostic } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Pure GCC diagnostic → Monaco marker/decoration mapping.
// See ADR-001 (.scratch/docs/adr/0001-deterministic-root-error-selection.md)
// for why exactly one Root Error gets a gutter decal.
//
// Coordinate note: GCC is 1-based for both line and column, and so is Monaco.
// No conversion is applied here — do NOT subtract 1. See T4 spec for the
// off-by-one trap this guards against.
// ─────────────────────────────────────────────────────────────────────────────

const PLATYPUS_GUTTER_CLASS = 'platypus-gutter-decal'

function severityFor(type: CompilerDiagnostic['type']): editor.IMarkerData['severity'] {
    // Dynamic import avoided — MarkerSeverity is a numeric enum, so we inline
    // its values (1 = Hint, 2 = Info, 4 = Warning, 8 = Error) to keep this
    // module free of a hard `monaco-editor` runtime dependency.
    return type === 'warning' ? 4 : 8
}

/**
 * Map compiler diagnostics to Monaco marker data (squiggles). Pure — no
 * Monaco instance required. Notes (type "note") are not rendered as markers.
 */
export function toMonacoMarkers(
    diagnostics: CompilerDiagnostic[],
    _rootError: CompilerDiagnostic | null
): editor.IMarkerData[] {
    const markers: editor.IMarkerData[] = []
    for (const d of diagnostics) {
        if (d.type !== 'error' && d.type !== 'warning') continue
        markers.push({
            severity: severityFor(d.type),
            message: d.message,
            startLineNumber: d.line,
            startColumn: d.column,
            endLineNumber: d.endLine ?? d.line,
            endColumn: d.endColumn ?? d.column + 1,
        })
    }
    return markers
}

/**
 * Build the gutter decoration for the Root Error only. Exactly one decal
 * ever renders — everything else in `diagnostics` is squiggled but bare.
 * Returns [] when there is no root error.
 */
export function toGutterDecorations(
    rootError: CompilerDiagnostic | null
): editor.IModelDeltaDecoration[] {
    if (!rootError) return []

    return [
        {
            range: {
                startLineNumber: rootError.line,
                startColumn: 1,
                endLineNumber: rootError.line,
                endColumn: 1,
            },
            options: {
                isWholeLine: false,
                glyphMarginClassName: PLATYPUS_GUTTER_CLASS,
                glyphMarginHoverMessage: { value: 'Root cause' },
            },
        },
    ]
}

/**
 * True when a Monaco mouse-down target lands on the Root Error's gutter
 * decal or its squiggle. Pure — keeps the Monaco-shape knowledge needed to
 * classify a click in the same module as the marker/decoration mapping,
 * rather than duplicated inline at the call site.
 */
export function isRootErrorTarget(
    targetType: number,
    targetLine: number | undefined,
    rootError: CompilerDiagnostic | null,
    mouseTargetType: { GUTTER_GLYPH_MARGIN: number; CONTENT_TEXT: number }
): boolean {
    if (!rootError || targetLine !== rootError.line) return false
    return (
        targetType === mouseTargetType.GUTTER_GLYPH_MARGIN ||
        targetType === mouseTargetType.CONTENT_TEXT
    )
}
