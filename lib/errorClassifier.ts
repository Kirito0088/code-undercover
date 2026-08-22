import { CompilerDiagnostic } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// GCC Error Type Registry
// Each errorType is a stable internal identifier used by Platypus to generate
// a targeted, beginner-friendly explanation.
// ─────────────────────────────────────────────────────────────────────────────

export type CompilerErrorType =
    | 'missing_semicolon'
    | 'missing_closing_brace'
    | 'missing_opening_brace'
    | 'missing_closing_paren'
    | 'undeclared_identifier'
    | 'undefined_reference'
    | 'implicit_function'
    | 'missing_stdio'
    | 'missing_math'
    | 'missing_string_h'
    | 'missing_stdlib'
    | 'missing_header_file'
    | 'empty_printf'
    | 'zero_length_format'
    | 'format_mismatch'
    | 'missing_return'
    | 'type_mismatch'
    | 'too_few_args'
    | 'too_many_args'
    | 'missing_string_terminator'
    | 'expected_expression'
    | 'expected_declaration'
    | 'redefinition'
    | 'unused_variable'
    | 'uninitialized_variable'
    | 'division_by_zero'
    | 'incompatible_pointer'
    | 'no_main'
    | 'unknown'

export interface ClassifiedError {
    errorType: CompilerErrorType
    line: number
    column: number
    rawMessage: string
    /** The identifier GCC named in the message ('foo'), when it named one. */
    symbol?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Header groups — used to tell the agent WHICH #include is missing rather than
// just "some header". Matched on word boundaries so that `using` no longer
// counts as `sin`, and `fgets` no longer counts as `gets`.
// ─────────────────────────────────────────────────────────────────────────────

const STDIO_FUNCTIONS = [
    'printf', 'scanf', 'puts', 'gets', 'fgets', 'fputs', 'fprintf', 'sprintf',
    'snprintf', 'sscanf', 'getchar', 'putchar', 'fopen', 'fclose', 'fgetc',
    'fputc', 'perror',
]

const MATH_FUNCTIONS = [
    'sqrt', 'pow', 'ceil', 'floor', 'sin', 'cos', 'tan', 'log', 'log10',
    'exp', 'fabs', 'round', 'fmod',
]

const STRING_FUNCTIONS = [
    'strlen', 'strcpy', 'strncpy', 'strcmp', 'strncmp', 'strcat', 'strncat',
    'strchr', 'strstr', 'strtok', 'memset', 'memcpy', 'memmove',
]

// abs/labs live in stdlib.h, not math.h — a common source of wrong advice.
const STDLIB_FUNCTIONS = [
    'malloc', 'calloc', 'realloc', 'free', 'atoi', 'atof', 'atol', 'exit',
    'rand', 'srand', 'abs', 'labs', 'qsort', 'bsearch',
]

function mentions(msg: string, names: string[]): boolean {
    return new RegExp(`\\b(${names.join('|')})\\b`, 'i').test(msg)
}

/**
 * GCC quotes identifiers with DIRECTED quotes (expected ‘;’ before ‘return’)
 * whenever it runs under a UTF-8 locale — which the Judge0 box does. Every rule
 * below is written with ASCII quotes, so without this normalisation real
 * compiler output silently fell through to 'unknown' while synthetic ASCII
 * fixtures classified fine. Normalise once, match everywhere.
 */
export function normalizeQuotes(message: string): string {
    return message
        .replace(/[‘’‚‛`´]/g, "'")
        .replace(/[“”„‟]/g, '"')
}

/**
 * Pull the identifier GCC named out of a diagnostic. GCC quotes names as 'foo'
 * or ‘foo’ and the linker as `foo', so normalise before matching.
 */
export function extractSymbol(message: string): string | undefined {
    const match = normalizeQuotes(message).match(/'([A-Za-z_][A-Za-z0-9_]*)'/)
    return match ? match[1] : undefined
}

/** Pull the header filename out of a "no such file or directory" diagnostic. */
function extractHeader(message: string): string | undefined {
    const match = message.match(/([A-Za-z0-9_./-]+\.h)/)
    return match ? match[1] : undefined
}

// ─────────────────────────────────────────────────────────────────────────────
// Classification rules — ordered from most-specific to most-generic.
// The first match wins.
// ─────────────────────────────────────────────────────────────────────────────

interface ClassificationRule {
    match: (msg: string) => boolean
    type: CompilerErrorType
}

const RULES: ClassificationRule[] = [
    // ── Linker stage ─────────────────────────────────────────────────────
    // Must precede the implicit-declaration rules: calling a function that was
    // declared but never defined reaches the linker, not the compiler.
    {
        match: (m) => /undefined reference to\s+['`]main'/i.test(m) || /in function ['`]_start'/i.test(m),
        type: 'no_main'
    },
    {
        match: (m) => /undefined reference to/i.test(m) || /symbol\(s\) not found/i.test(m),
        type: 'undefined_reference'
    },
    // ── Preprocessor ─────────────────────────────────────────────────────
    {
        match: (m) => /no such file or directory/i.test(m) && /\.h\b/i.test(m),
        type: 'missing_header_file'
    },
    // ── printf-specific warnings, before the generic format rules ────────
    {
        match: (m) => /zero-length/i.test(m) && /printf/i.test(m),
        type: 'zero_length_format'
    },
    {
        match: (m) => /empty/i.test(m) && /printf/i.test(m),
        type: 'empty_printf'
    },
    {
        match: (m) => /format\s+'%/i.test(m) || /format specifies type/i.test(m) ||
            /too (few|many) arguments for format/i.test(m),
        type: 'format_mismatch'
    },
    // ── Missing headers, most specific first ─────────────────────────────
    {
        match: (m) => /implicit declaration of function/i.test(m) && mentions(m, STDIO_FUNCTIONS),
        type: 'missing_stdio'
    },
    {
        match: (m) => /implicit declaration of function/i.test(m) && mentions(m, MATH_FUNCTIONS),
        type: 'missing_math'
    },
    {
        match: (m) => /implicit declaration of function/i.test(m) && mentions(m, STRING_FUNCTIONS),
        type: 'missing_string_h'
    },
    {
        match: (m) => /implicit declaration of function/i.test(m) && mentions(m, STDLIB_FUNCTIONS),
        type: 'missing_stdlib'
    },
    {
        match: (m) => /implicit declaration of function/i.test(m),
        type: 'implicit_function'
    },
    // ── Punctuation / structure ──────────────────────────────────────────
    {
        match: (m) => /expected\s+';'/i.test(m),
        type: 'missing_semicolon'
    },
    {
        match: (m) => /expected declaration or statement at end of input/i.test(m) ||
            /expected\s+'}'/i.test(m),
        type: 'missing_closing_brace'
    },
    {
        match: (m) => /expected\s+'\{'/i.test(m),
        type: 'missing_opening_brace'
    },
    {
        match: (m) => /expected\s+'\)'/i.test(m),
        type: 'missing_closing_paren'
    },
    {
        match: (m) => /missing terminating/i.test(m) || /unterminated string/i.test(m),
        type: 'missing_string_terminator'
    },
    // ── Names ────────────────────────────────────────────────────────────
    {
        match: (m) => /undeclared/i.test(m) || /was not declared in this scope/i.test(m) ||
            /use of undeclared identifier/i.test(m),
        type: 'undeclared_identifier'
    },
    {
        match: (m) => /redefinition of/i.test(m) || /redeclared/i.test(m) ||
            /conflicting types for/i.test(m),
        type: 'redefinition'
    },
    // ── Types & arguments ────────────────────────────────────────────────
    {
        match: (m) => /control reaches end of non-void function/i.test(m) ||
            /no return statement in function returning non-void/i.test(m),
        type: 'missing_return'
    },
    {
        match: (m) => /incompatible pointer/i.test(m) ||
            /makes pointer from integer/i.test(m) ||
            /makes integer from pointer/i.test(m),
        type: 'incompatible_pointer'
    },
    {
        match: (m) => /incompatible type/i.test(m) || /invalid conversion/i.test(m) ||
            /cannot convert/i.test(m) || /invalid operands to binary/i.test(m),
        type: 'type_mismatch'
    },
    {
        match: (m) => /too few arguments/i.test(m),
        type: 'too_few_args'
    },
    {
        match: (m) => /too many arguments/i.test(m),
        type: 'too_many_args'
    },
    // ── Expressions ──────────────────────────────────────────────────────
    {
        match: (m) => /expected expression/i.test(m),
        type: 'expected_expression'
    },
    {
        match: (m) => /expected declaration/i.test(m) ||
            /expected identifier/i.test(m) ||
            /data definition has no type or storage class/i.test(m),
        type: 'expected_declaration'
    },
    {
        match: (m) => /division by zero/i.test(m),
        type: 'division_by_zero'
    },
    // ── Warnings ─────────────────────────────────────────────────────────
    {
        match: (m) => /is used uninitialized/i.test(m) || /may be used uninitialized/i.test(m),
        type: 'uninitialized_variable'
    },
    {
        match: (m) => /unused variable/i.test(m) || /set but not used/i.test(m),
        type: 'unused_variable'
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main classifier function
// ─────────────────────────────────────────────────────────────────────────────

export function classifyCompilerError(diagnostic: CompilerDiagnostic): ClassifiedError {
    // Match against ASCII-normalised text; keep the original for display.
    const msg = normalizeQuotes(diagnostic.message).toLowerCase()

    const base = {
        line: diagnostic.line,
        column: diagnostic.column,
        rawMessage: diagnostic.message,
    }

    for (const rule of RULES) {
        if (rule.match(msg)) {
            return {
                ...base,
                errorType: rule.type,
                symbol: rule.type === 'missing_header_file'
                    ? extractHeader(diagnostic.message)
                    : extractSymbol(diagnostic.message),
            }
        }
    }

    return {
        ...base,
        errorType: 'unknown',
        symbol: extractSymbol(diagnostic.message),
    }
}
