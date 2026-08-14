import { createHash } from "crypto"

// ─────────────────────────────────────────────────────────────────────────────
// Global error-line hashing (ADR-002).
//
// Produces the cache key for CompilerErrorCache: two beginner mistakes that
// differ only in variable names, literal values, whitespace, or comments
// should collapse to the same key, so the AI-generated explanation is
// generated once and reused across every student who hits the "same" lesson.
// ─────────────────────────────────────────────────────────────────────────────

// C89/C99/C11 keywords, plus the handful of stdlib identifiers common enough
// in beginner code that generalizing them away would blur genuinely distinct
// mistakes (e.g. "missing #include for printf" vs "missing #include for x").
const C_KEYWORDS_AND_STDLIB = new Set([
    // keywords
    "auto", "break", "case", "char", "const", "continue", "default", "do",
    "double", "else", "enum", "extern", "float", "for", "goto", "if",
    "inline", "int", "long", "register", "restrict", "return", "short",
    "signed", "sizeof", "static", "struct", "switch", "typedef", "union",
    "unsigned", "void", "volatile", "while", "_Bool", "_Complex",
    "_Imaginary",
    // common stdlib types / macros / functions a beginner's broken line
    // is likely to contain verbatim
    "NULL", "size_t", "FILE", "printf", "scanf", "puts", "gets", "fgets",
    "fprintf", "sprintf", "malloc", "free", "calloc", "realloc", "sqrt",
    "pow", "abs", "ceil", "floor", "sin", "cos", "tan", "main",
])

/**
 * Normalize a compiler error message so that two occurrences of the "same"
 * mistake (different file path, different offending identifier) hash to
 * the same value.
 */
export function normalizeErrorMessage(raw: string): string {
    let s = raw.toLowerCase()

    // Strip a leading file path prefix, e.g. "/box/script.c:4:9: " or
    // "/tmp/x.c:9:2: ".
    s = s.replace(/^(?:\S*\/)?[^\s:/]+\.[a-z0-9]+(?::\d+)*:\s*/, "")

    // Replace quoted identifiers with a placeholder — the specific name
    // doesn't change the lesson being taught.
    s = s.replace(/'[^']*'/g, "'<id>'")

    // Collapse whitespace runs and trim.
    s = s.replace(/\s+/g, " ").trim()

    return s
}

/**
 * Normalize the broken line of source code so that two lines differing only
 * in identifier names, literal values, whitespace, or comments hash to the
 * same value, while keywords (which change the meaning of the mistake) are
 * preserved.
 */
export function normalizeLineContent(raw: string): string {
    let s = raw

    // Strip block comments, then trailing line comments.
    s = s.replace(/\/\*[\s\S]*?\*\//g, " ")
    s = s.replace(/\/\/.*$/, "")

    // Collapse whitespace runs and trim, then drop whitespace hugging
    // punctuation (e.g. "hi" ; vs "hi"; must normalize identically).
    s = s.replace(/\s+/g, " ").trim()
    s = s.replace(/\s+(?=[;,.:)\]}])/g, "")
    s = s.replace(/(?<=[(\[{])\s+/g, "")

    // Single pass over string literals, numeric literals, and identifiers.
    // Alternation order matters: string literals are matched whole so their
    // contents are never re-processed as identifiers.
    const TOKEN =
        /"(?:[^"\\]|\\.)*"|\b0[xX][0-9a-fA-F]+\b|\b\d+\.\d+\b|\b\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b/g

    s = s.replace(TOKEN, (token) => {
        if (token.startsWith('"')) return '"<str>"'
        if (/^\d/.test(token) || /^0[xX]/.test(token)) return "<num>"
        if (C_KEYWORDS_AND_STDLIB.has(token)) return token
        return "<id>"
    })

    return s
}

/**
 * The cache key for CompilerErrorCache: lowercase hex SHA-256 of the
 * normalized error message and broken line, joined with a NUL separator so
 * a shift across the two fields can never produce a collision.
 */
export function computeErrorHash(
    rootErrorMessage: string,
    brokenLineContent: string
): string {
    const normalizedMessage = normalizeErrorMessage(rootErrorMessage)
    const normalizedLine = normalizeLineContent(brokenLineContent)
    return createHash("sha256")
        .update(`${normalizedMessage}\0${normalizedLine}`)
        .digest("hex")
}
