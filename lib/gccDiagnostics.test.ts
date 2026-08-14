import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseGccJsonDiagnostics, selectRootError } from './gccDiagnostics'

const FIXTURES_DIR = join(process.cwd(), '.scratch', 'fixtures', 'gcc')

function loadFixture(name: string): string {
    return readFileSync(join(FIXTURES_DIR, name), 'utf-8')
}

describe('parseGccJsonDiagnostics', () => {
    it('parses a well-formed JSON array of diagnostics', () => {
        const raw = loadFixture('missing-semicolon-cascade.json')
        const diagnostics = parseGccJsonDiagnostics(raw)
        expect(diagnostics.length).toBeGreaterThanOrEqual(5)
    })

    it('locates the JSON array when Judge0 interleaves it with surrounding noise', () => {
        const jsonArray = loadFixture('independent-errors.json')
        const noisy = `In file included from main.c:1:\ncc1: warning: unrecognized option\n${jsonArray}\ncollect2: error: ld returned 1 exit status\n`
        const diagnostics = parseGccJsonDiagnostics(noisy)
        expect(diagnostics).toHaveLength(2)
        expect(diagnostics[0].line).toBe(5)
        expect(diagnostics[1].line).toBe(12)
    })

    it('extracts endLine/endColumn from locations[0].finish', () => {
        const raw = loadFixture('independent-errors.json')
        const diagnostics = parseGccJsonDiagnostics(raw)
        const first = diagnostics.find(d => d.line === 5)
        expect(first).toBeDefined()
        expect(first?.endLine).toBe(5)
        expect(first?.endColumn).toBe(10)
    })

    it('maps "fatal error" kind to type "error"', () => {
        const raw = JSON.stringify([
            {
                kind: 'fatal error',
                message: 'stdio.h: No such file or directory',
                children: [],
                locations: [{ caret: { file: 'main.c', line: 1, column: 1 }, finish: { file: 'main.c', line: 1, column: 1 } }],
            },
        ])
        const diagnostics = parseGccJsonDiagnostics(raw)
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0].type).toBe('error')
    })

    it('skips diagnostics with an empty locations array without throwing', () => {
        const raw = loadFixture('empty-locations.json')
        const diagnostics = parseGccJsonDiagnostics(raw)
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0].message).toContain('foo')
    })

    it('returns [] for malformed/non-JSON stderr, never throws', () => {
        const raw = loadFixture('malformed.txt')
        expect(() => parseGccJsonDiagnostics(raw)).not.toThrow()
        expect(parseGccJsonDiagnostics(raw)).toEqual([])
    })

    it('returns [] for empty input', () => {
        expect(parseGccJsonDiagnostics('')).toEqual([])
    })

    it('retains children on the parsed diagnostic', () => {
        const raw = loadFixture('nested-children.json')
        const diagnostics = parseGccJsonDiagnostics(raw)
        expect(diagnostics).toHaveLength(1)
        expect(diagnostics[0].children).toHaveLength(1)
        expect(diagnostics[0].children?.[0].message).toContain('initializing argument')
    })
})

describe('selectRootError', () => {
    it('missing-semicolon-cascade → selects the line 4 diagnostic, not a cascade child', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('missing-semicolon-cascade.json'))
        const root = selectRootError(diagnostics)
        expect(root?.line).toBe(4)
    })

    it('independent-errors → selects the earlier line 5 diagnostic over line 12', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('independent-errors.json'))
        const root = selectRootError(diagnostics)
        expect(root?.line).toBe(5)
    })

    it('warnings-only → returns null even though parseGccJsonDiagnostics returns the warnings', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('warnings-only.json'))
        expect(diagnostics).toHaveLength(2)
        expect(selectRootError(diagnostics)).toBeNull()
    })

    it('nested-children → selects the parent, never a child', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('nested-children.json'))
        const root = selectRootError(diagnostics)
        expect(root?.line).toBe(8)
        expect(root?.children).toHaveLength(1)
    })

    it('tie-breaks same-line errors by column: column 5 wins over column 12', () => {
        const diagnostics = parseGccJsonDiagnostics(JSON.stringify([
            {
                kind: 'error', message: 'second', children: [],
                locations: [{ caret: { file: 'main.c', line: 7, column: 12 }, finish: { file: 'main.c', line: 7, column: 12 } }],
            },
            {
                kind: 'error', message: 'first', children: [],
                locations: [{ caret: { file: 'main.c', line: 7, column: 5 }, finish: { file: 'main.c', line: 7, column: 5 } }],
            },
        ]))
        const root = selectRootError(diagnostics)
        expect(root?.column).toBe(5)
        expect(root?.message).toBe('first')
    })

    it('empty-locations → the un-positionable diagnostic is skipped, not thrown', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('empty-locations.json'))
        expect(() => selectRootError(diagnostics)).not.toThrow()
        expect(selectRootError(diagnostics)?.line).toBe(6)
    })

    it('[] input → returns null', () => {
        expect(selectRootError([])).toBeNull()
    })

    it('is deterministic regardless of input array order (reversed)', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('missing-semicolon-cascade.json'))
        const reversed = [...diagnostics].reverse()
        const rootA = selectRootError(diagnostics)
        const rootB = selectRootError(reversed)
        expect(rootA?.line).toBe(rootB?.line)
        expect(rootA?.column).toBe(rootB?.column)
        expect(rootA?.message).toBe(rootB?.message)
    })

    it('is deterministic regardless of input array order (arbitrary permutation)', () => {
        const diagnostics = parseGccJsonDiagnostics(loadFixture('missing-semicolon-cascade.json'))
        // Fixed non-trivial permutation of the fixture's 6 diagnostics, distinct from
        // both original order and a plain reverse.
        const permutationOrder = [3, 0, 5, 1, 4, 2]
        expect(permutationOrder).toHaveLength(diagnostics.length)
        const shuffled = permutationOrder.map(i => diagnostics[i])

        const rootA = selectRootError(diagnostics)
        const rootB = selectRootError(shuffled)
        expect(rootA?.line).toBe(rootB?.line)
        expect(rootA?.column).toBe(rootB?.column)
        expect(rootA?.message).toBe(rootB?.message)
    })
})
