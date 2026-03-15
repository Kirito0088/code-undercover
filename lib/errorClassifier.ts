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
    | 'undeclared_identifier'
    | 'implicit_function'
    | 'missing_stdio'
    | 'missing_math'
    | 'empty_printf'
    | 'zero_length_format'
    | 'missing_return'
    | 'type_mismatch'
    | 'too_few_args'
    | 'too_many_args'
    | 'missing_string_terminator'
    | 'expected_expression'
    | 'expected_declaration'
    | 'redefinition'
    | 'unused_variable'
    | 'division_by_zero'
    | 'incompatible_pointer'
    | 'unknown'

export interface ClassifiedError {
    errorType: CompilerErrorType
    line: number
    column: number
    rawMessage: string
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
    // Specific printf-related warnings before generic undeclared
    {
        match: (m) => /zero-length/i.test(m) && /printf/i.test(m),
        type: 'zero_length_format'
    },
    {
        match: (m) => /empty/i.test(m) && /printf/i.test(m),
        type: 'empty_printf'
    },
    // Missing stdio — implicit printf or scanf without #include
    {
        match: (m) => /implicit declaration of function/i.test(m) && /(printf|scanf|puts|gets|fgets|fprintf)/i.test(m),
        type: 'missing_stdio'
    },
    // Missing math.h
    {
        match: (m) => /implicit declaration of function/i.test(m) && /(sqrt|pow|abs|ceil|floor|sin|cos|tan)/i.test(m),
        type: 'missing_math'
    },
    // Generic implicit function (after specific header checks)
    {
        match: (m) => /implicit declaration of function/i.test(m),
        type: 'implicit_function'
    },
    // Semicolon — GCC says "expected ';'"
    {
        match: (m) => /expected\s+';'/i.test(m),
        type: 'missing_semicolon'
    },
    // Missing closing brace
    {
        match: (m) => /expected declaration or statement at end of input/i.test(m),
        type: 'missing_closing_brace'
    },
    // Missing opening brace
    {
        match: (m) => /expected\s+'{'/i.test(m),
        type: 'missing_opening_brace'
    },
    // Undeclared identifier
    {
        match: (m) => /undeclared/i.test(m) || /was not declared in this scope/i.test(m),
        type: 'undeclared_identifier'
    },
    // Missing return statement
    {
        match: (m) => /control reaches end of non-void function/i.test(m) || /no return/i.test(m),
        type: 'missing_return'
    },
    // Type mismatch / incompatible types
    {
        match: (m) => /incompatible type/i.test(m) || /invalid conversion/i.test(m) || /cannot convert/i.test(m),
        type: 'type_mismatch'
    },
    // Too few / many arguments
    {
        match: (m) => /too few arguments/i.test(m),
        type: 'too_few_args'
    },
    {
        match: (m) => /too many arguments/i.test(m),
        type: 'too_many_args'
    },
    // Missing string terminator (unclosed quote)
    {
        match: (m) => /missing terminating/i.test(m) || /unterminated string/i.test(m),
        type: 'missing_string_terminator'
    },
    // Expected expression
    {
        match: (m) => /expected expression/i.test(m),
        type: 'expected_expression'
    },
    // Redefinition
    {
        match: (m) => /redefinition of/i.test(m) || /redeclared/i.test(m),
        type: 'redefinition'
    },
    // Unused variable
    {
        match: (m) => /unused variable/i.test(m) || /set but not used/i.test(m),
        type: 'unused_variable'
    },
    // Incompatible pointer
    {
        match: (m) => /incompatible pointer/i.test(m),
        type: 'incompatible_pointer'
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// Main classifier function
// ─────────────────────────────────────────────────────────────────────────────

export function classifyCompilerError(diagnostic: CompilerDiagnostic): ClassifiedError {
    const msg = diagnostic.message.toLowerCase()

    for (const rule of RULES) {
        if (rule.match(msg)) {
            return {
                errorType: rule.type,
                line: diagnostic.line,
                column: diagnostic.column,
                rawMessage: diagnostic.message
            }
        }
    }

    return {
        errorType: 'unknown',
        line: diagnostic.line,
        column: diagnostic.column,
        rawMessage: diagnostic.message
    }
}
