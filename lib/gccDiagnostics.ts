import { CompilerDiagnostic } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// GCC `-fdiagnostics-format=json` parsing + deterministic Root Error selection.
// See ADR-001 (.scratch/docs/adr/0001-deterministic-root-error-selection.md)
// for the rationale behind the selection algorithm.
// ─────────────────────────────────────────────────────────────────────────────

interface GccLocationPoint {
    file?: string
    line?: number
    column?: number
}

interface GccLocation {
    caret?: GccLocationPoint
    finish?: GccLocationPoint
}

interface GccDiagnosticJson {
    kind?: string
    message?: string
    children?: GccDiagnosticJson[]
    locations?: GccLocation[]
}

/**
 * Locate the top-level JSON array within stderr that GCC's JSON diagnostics
 * are embedded in. Judge0 may interleave other output around it (e.g. "In
 * file included from ..." lines), so we can't assume the whole string is
 * clean JSON — we find the first '[' and the last ']' and try to parse that
 * slice.
 */
function extractJsonArray(rawStderr: string): unknown[] | null {
    if (!rawStderr) return null

    const start = rawStderr.indexOf('[')
    const end = rawStderr.lastIndexOf(']')
    if (start === -1 || end === -1 || end < start) return null

    const slice = rawStderr.slice(start, end + 1)

    try {
        const parsed = JSON.parse(slice)
        return Array.isArray(parsed) ? parsed : null
    } catch {
        return null
    }
}

function normalizeKind(kind: string | undefined): 'error' | 'warning' | 'note' {
    if (kind === 'error' || kind === 'fatal error') return 'error'
    if (kind === 'warning') return 'warning'
    return 'note'
}

/**
 * Convert one raw GCC JSON diagnostic node into a CompilerDiagnostic.
 * Returns null when the diagnostic has no usable location (locations: []) —
 * such diagnostics cannot be positioned in the editor and are skipped.
 */
function toCompilerDiagnostic(node: GccDiagnosticJson): CompilerDiagnostic | null {
    const location = node.locations?.[0]
    const caret = location?.caret
    if (!location || caret?.line === undefined || caret?.column === undefined) {
        return null
    }

    const finish = location.finish
    const children = (node.children ?? [])
        .map(toCompilerDiagnostic)
        .filter((child): child is CompilerDiagnostic => child !== null)

    const diagnostic: CompilerDiagnostic = {
        line: caret.line,
        column: caret.column,
        type: normalizeKind(node.kind),
        message: (node.message ?? '').trim(),
        rawContext: '',
    }

    if (finish?.line !== undefined) diagnostic.endLine = finish.line
    if (finish?.column !== undefined) diagnostic.endColumn = finish.column
    if (children.length > 0) diagnostic.children = children

    return diagnostic
}

/**
 * Parse GCC's `-fdiagnostics-format=json` stderr output into structured
 * CompilerDiagnostic objects. Pure, no I/O. Never throws — malformed or
 * absent JSON returns an empty array.
 */
export function parseGccJsonDiagnostics(rawStderr: string): CompilerDiagnostic[] {
    const rawArray = extractJsonArray(rawStderr)
    if (!rawArray) return []

    const diagnostics: CompilerDiagnostic[] = []
    for (const entry of rawArray) {
        if (!entry || typeof entry !== 'object') continue
        const diagnostic = toCompilerDiagnostic(entry as GccDiagnosticJson)
        if (diagnostic) diagnostics.push(diagnostic)
    }
    return diagnostics
}

/**
 * Select the deterministic Root Error per ADR-001:
 * 1. Filter to type === "error" (covers GCC's "error" and "fatal error" kinds
 *    — both are normalized to "error" by parseGccJsonDiagnostics).
 * 2. Sort ascending by line, tie-broken by column.
 * 3. Return the first. Its children are retained but not candidates.
 * 4. No errors → null.
 *
 * Pure, no I/O, and deterministic regardless of input array order.
 */
export function selectRootError(diagnostics: CompilerDiagnostic[]): CompilerDiagnostic | null {
    const errors = diagnostics.filter(d => d.type === 'error')
    if (errors.length === 0) return null

    const sorted = [...errors].sort((a, b) => {
        if (a.line !== b.line) return a.line - b.line
        return a.column - b.column
    })

    return sorted[0]
}
