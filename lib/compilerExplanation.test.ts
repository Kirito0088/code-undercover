import { describe, it, expect } from "vitest"
import { explainByErrorType, explainFirstDiagnostic } from "./compilerExplanation"
import type { CompilerErrorType } from "./errorClassifier"
import type { CompilerDiagnostic } from "@/types"

// Pins the static Platypus explanation map to the same 8th-12th grade
// (age 13-18) pedagogical bar T9 already enforces on the AI path — see
// scripts/ml/evaluate_model.py's FORBIDDEN_JARGON dictionary and
// calculate_flesch_reading_ease(). This map is what most students actually
// see today (explainService.ts's OPEN-1 resolution routes every known
// GCC error type here, only falling through to the AI model for
// genuinely unclassified errors), so it needs the same regression guard
// the AI path gets, or a future edit can silently regress it back to a
// technical/adult register.

const ALL_ERROR_TYPES: CompilerErrorType[] = [
    "missing_semicolon",
    "missing_closing_brace",
    "missing_opening_brace",
    "undeclared_identifier",
    "implicit_function",
    "missing_stdio",
    "missing_math",
    "empty_printf",
    "zero_length_format",
    "missing_return",
    "type_mismatch",
    "too_few_args",
    "too_many_args",
    "missing_string_terminator",
    "expected_expression",
    "expected_declaration",
    "redefinition",
    "unused_variable",
    "division_by_zero",
    "incompatible_pointer",
    "unknown",
]

// Port of scripts/ml/evaluate_model.py's FORBIDDEN_JARGON — kept in sync by
// hand since one lives in Python and the other in TypeScript. If the
// Python dictionary changes, mirror the change here too.
const FORBIDDEN_JARGON = [
    "lvalue",
    "rvalue",
    "dereference",
    "dereferencing",
    "dereferenced",
    "vtable",
    "thunk",
    "variadic",
    "operand",
    "operands",
    "precedence",
    "associativity",
    "lexical",
    "lexing",
    "lexer",
    "parsing",
    "parser",
    "abstract syntax tree",
    "ast",
    "tokenization",
    "tokenizer",
    "segfault",
    "segmentation fault",
    "bus error",
    "core dump",
    "stack trace",
    "frame pointer",
    "register allocation",
    "demangle",
    "demangling",
    "coercion",
    "synthesizer",
    "allocator",
    "heap exhaustion",
    "linkage",
    "translation unit",
    "relocation",
    "object file",
    "abi",
    "calling convention",
    "polymorphism",
    "instantiation",
    "virtual method",
    "name mangling",
    "type punning",
    "null pointer exception",
    "nullpointer",
    "unhandled exception",
    "garbage collection",
    "closure",
    "monad",
    "functor",
    "currying",
    "trampoline",
    "tail call optimization",
]

function findJargon(text: string): string[] {
    const lower = text.toLowerCase()
    return FORBIDDEN_JARGON.filter((term) => new RegExp(`\\b${term}\\b`).test(lower))
}

function countSyllables(word: string): number {
    let w = word.toLowerCase()
    if (w.length <= 3) return 1
    w = w.replace(/(?:[^laeiouy]|ed|es|e)$/, "")
    w = w.replace(/^y/, "")
    const matches = w.match(/[aeiouy]{1,2}/g)
    return Math.max(1, matches ? matches.length : 1)
}

function countSentences(text: string): number {
    const trimmed = text.trim()
    if (trimmed.length === 0) return 0
    const matches = trimmed.match(/[^.!?]+[.!?]+/g)
    if (!matches) return 1
    const consumed = matches.join("").length
    return matches.length + (consumed < trimmed.length ? 1 : 0)
}

// Port of scripts/ml/evaluate_model.py's calculate_flesch_reading_ease().
// 60-100 is the paper's "8th-12th grade / standard" band — T9 requires
// >= 35.0 on the AI path (a looser floor to tolerate SLM phrasing); the
// hand-written static map should comfortably clear the tighter, intended
// 60+ band since there's no model variance to account for.
function fleschReadingEase(text: string): number {
    const words = text.match(/\b[a-zA-Z]+\b/g) ?? []
    if (words.length === 0) return 100.0
    const sentences = Math.max(1, countSentences(text))
    const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0)
    return 206.835 - 1.015 * (words.length / sentences) - 84.6 * (totalSyllables / words.length)
}

describe("PLATYPUS_EXPLANATIONS (static map, 8th-12th grade audience bar)", () => {
    it.each(ALL_ERROR_TYPES)("%s: carries zero forbidden jargon terms", (errorType) => {
        const jargon = findJargon(explainByErrorType(errorType))
        expect(jargon).toEqual([])
    })

    it.each(ALL_ERROR_TYPES)("%s: clears the Flesch reading-ease floor for grades 8-12", (errorType) => {
        const score = fleschReadingEase(explainByErrorType(errorType))
        expect(score).toBeGreaterThanOrEqual(60)
    })

    it.each(ALL_ERROR_TYPES)("%s: is non-empty and addresses the reader in plain second person", (errorType) => {
        const text = explainByErrorType(errorType)
        expect(text.length).toBeGreaterThan(15)
        expect(text).toMatch(/\byou(r|rs|'re|'ve|'ll)?\b/i)
    })

    it.each(ALL_ERROR_TYPES)("%s: never addresses the reader as \"Agent\"", (errorType) => {
        // Regression guard: one entry used to say "Agent," inconsistently
        // with the other 20 — every entry now uses a plain "you" voice.
        expect(explainByErrorType(errorType)).not.toMatch(/\bAgent\b/)
    })

    it("covers every CompilerErrorType with no gaps", () => {
        // If errorClassifier.ts grows a new type, this fails until the
        // static map (and this test's ALL_ERROR_TYPES list) grows one too.
        for (const errorType of ALL_ERROR_TYPES) {
            expect(() => explainByErrorType(errorType)).not.toThrow()
        }
    })
})

describe("explainFirstDiagnostic", () => {
    it("returns undefined for an empty diagnostics list", () => {
        expect(explainFirstDiagnostic([])).toBeUndefined()
    })

    it("explains the first error-type diagnostic, in the plain-English voice", () => {
        const diagnostics: CompilerDiagnostic[] = [
            { line: 3, column: 1, type: "error", message: "expected ';' before '}' token", rawContext: "int x = 1" },
        ]
        expect(explainFirstDiagnostic(diagnostics)).toContain("semicolon")
    })
})
