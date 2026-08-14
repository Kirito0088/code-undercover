import { describe, it, expect } from 'vitest'
import { toMonacoMarkers, toGutterDecorations, isRootErrorTarget } from './monacoMarkers'
import { selectRootError } from './gccDiagnostics'
import { CompilerDiagnostic } from '@/types'

const MarkerSeverity = { Warning: 4, Error: 8 }

function diag(overrides: Partial<CompilerDiagnostic> = {}): CompilerDiagnostic {
    return {
        line: 4,
        column: 9,
        type: 'error',
        message: 'expected ‘;’ before ‘}’ token',
        rawContext: '',
        ...overrides,
    }
}

describe('toMonacoMarkers', () => {
    it('maps GCC line/column 1:1 onto Monaco — no off-by-one', () => {
        const [marker] = toMonacoMarkers([diag({ line: 4, column: 9 })], null)
        expect(marker.startLineNumber).toBe(4)
        expect(marker.startColumn).toBe(9)
    })

    it('spans to endLine/endColumn when the diagnostic provides them', () => {
        const [marker] = toMonacoMarkers(
            [diag({ line: 4, column: 9, endLine: 4, endColumn: 15 })],
            null
        )
        expect(marker.endLineNumber).toBe(4)
        expect(marker.endColumn).toBe(15)
    })

    it('falls back to column + 1 for endColumn when endLine/endColumn are absent', () => {
        const [marker] = toMonacoMarkers([diag({ line: 4, column: 9 })], null)
        expect(marker.endLineNumber).toBe(4)
        expect(marker.endColumn).toBe(10)
    })

    it('assigns MarkerSeverity.Error to root and non-root errors alike, but only the root gets a gutter decal', () => {
        const root = diag({ line: 2, column: 1 })
        const nonRoot = diag({ line: 8, column: 3 })
        const markers = toMonacoMarkers([root, nonRoot], root)
        expect(markers[0].severity).toBe(MarkerSeverity.Error)
        expect(markers[1].severity).toBe(MarkerSeverity.Error)

        const decorations = toGutterDecorations(root)
        expect(decorations.some(d => d.range.startLineNumber === root.line)).toBe(true)
        expect(decorations.some(d => d.range.startLineNumber === nonRoot.line)).toBe(false)
    })

    it('assigns MarkerSeverity.Warning to warnings', () => {
        const [marker] = toMonacoMarkers([diag({ type: 'warning' })], null)
        expect(marker.severity).toBe(MarkerSeverity.Warning)
    })

    it('returns [] for empty diagnostics', () => {
        expect(toMonacoMarkers([], null)).toEqual([])
    })
})

describe('toGutterDecorations', () => {
    it('renders a decoration for the root error', () => {
        const root = diag({ line: 4, column: 9 })
        const decorations = toGutterDecorations(root)
        expect(decorations).toHaveLength(1)
        expect(decorations[0].range.startLineNumber).toBe(4)
    })

    it('returns [] when rootError is null', () => {
        expect(toGutterDecorations(null)).toEqual([])
    })

    it('never returns more than one decoration, regardless of caller input', () => {
        const root = diag({ line: 4, column: 9 })
        const decorations = toGutterDecorations(root)
        expect(decorations.length).toBe(1)
    })

    it('places the decal on the root error line only, not on non-root errors', () => {
        const root = diag({ line: 2, column: 1 })
        const decorations = toGutterDecorations(root)
        expect(decorations.every(d => d.range.startLineNumber === 2)).toBe(true)
        expect(decorations.some(d => d.range.startLineNumber === 8)).toBe(false)
    })

    it('given a multi-error compile result, produces exactly one decoration on the lowest-line error', () => {
        // The real pipeline: parse → selectRootError → toGutterDecorations.
        const diagnostics = [
            diag({ line: 8, column: 3, message: 'later error' }),
            diag({ line: 2, column: 1, message: 'earliest error' }),
            diag({ line: 5, column: 1, type: 'warning' }),
        ]
        const rootError = selectRootError(diagnostics)
        const decorations = toGutterDecorations(rootError)

        expect(decorations).toHaveLength(1)
        expect(decorations[0].range.startLineNumber).toBe(2)
    })
})

describe('isRootErrorTarget', () => {
    const MouseTargetType = { GUTTER_GLYPH_MARGIN: 2, CONTENT_TEXT: 6, OTHER: 0 }
    const root = diag({ line: 4, column: 9 })

    it('matches a gutter-glyph-margin click on the root error line', () => {
        expect(isRootErrorTarget(MouseTargetType.GUTTER_GLYPH_MARGIN, 4, root, MouseTargetType)).toBe(true)
    })

    it('matches a content-text (squiggle) click on the root error line', () => {
        expect(isRootErrorTarget(MouseTargetType.CONTENT_TEXT, 4, root, MouseTargetType)).toBe(true)
    })

    it('does not match a click on a different line', () => {
        expect(isRootErrorTarget(MouseTargetType.GUTTER_GLYPH_MARGIN, 8, root, MouseTargetType)).toBe(false)
    })

    it('does not match an unrelated target type', () => {
        expect(isRootErrorTarget(MouseTargetType.OTHER, 4, root, MouseTargetType)).toBe(false)
    })

    it('never matches when there is no root error', () => {
        expect(isRootErrorTarget(MouseTargetType.GUTTER_GLYPH_MARGIN, 4, null, MouseTargetType)).toBe(false)
    })
})
