import { CompilerDiagnostic } from '@/types'
import { classifyCompilerError, CompilerErrorType } from './errorClassifier'

// ─────────────────────────────────────────────────────────────────────────────
// Platypus Explanation Map
// Each CompilerErrorType maps to a beginner-friendly mentor explanation.
// Lines are phrased from Platypus's perspective and guide — not give answers.
// ─────────────────────────────────────────────────────────────────────────────

const PLATYPUS_EXPLANATIONS: Record<CompilerErrorType, string> = {
    missing_semicolon:
        `Agent, every statement in C must end with a semicolon (;).\n\nLook at the line the error points to and the line just before it — one of them is probably missing a semicolon at the end.`,

    missing_closing_brace:
        `Your code is missing a closing curly brace (}).\n\nEvery opening brace { must have a matching closing brace }. Count your braces from top to bottom — one is left unclosed.`,

    missing_opening_brace:
        `Your code is missing an opening curly brace ({).\n\nCheck the function or block around the error line — it might be missing its opening {.`,

    undeclared_identifier:
        `You used a name that the program doesn't recognise.\n\nThis usually means:\n• The variable or function name is misspelled\n• You forgot to declare the variable before using it\n• You forgot to #include the header that defines it`,

    implicit_function:
        `You called a function without declaring it first.\n\nThis usually means a required #include is missing at the top of your file. For example, if you are using printf or scanf, you need:\n\n  #include <stdio.h>`,

    missing_stdio:
        `You are using printf or scanf, but you haven't included the standard input/output library.\n\nAdd this line at the very top of your code:\n\n  #include <stdio.h>`,

    missing_math:
        `You are using a maths function like sqrt or pow, but you haven't included the maths library.\n\nAdd this at the top of your file:\n\n  #include <math.h>\n\nAnd compile with the -lm flag if needed.`,

    empty_printf:
        `You used printf with empty quotes.\n\nprintf is used to display text on the screen. Put the message you want to show inside the quotes.\n\nExample:\n  printf("Hello Agent");`,

    zero_length_format:
        `Your printf has an empty format string — the quotes contain nothing.\n\nIf you want to print text, write it inside the quotes. If you want a blank line, use:\n  printf("\\n");`,

    missing_return:
        `Your function is declared to return a value (like int), but it has no return statement.\n\nAdd return 0; at the end of main(), or the correct return value at the end of any non-void function.`,

    type_mismatch:
        `You are trying to use two different types together in a way C doesn't allow.\n\nCheck that you are assigning compatible types, for example: don't assign a string to an int variable.`,

    too_few_args:
        `You called a function with fewer arguments than it expects.\n\nCheck the function definition to see how many arguments it needs and add the missing ones.`,

    too_many_args:
        `You called a function with more arguments than it expects.\n\nRemove the extra arguments — they are not needed.`,

    missing_string_terminator:
        `You opened a string with a double-quote (") but never closed it.\n\nEach string must start and end with a double-quote. Check the error line for an unclosed string.`,

    expected_expression:
        `The compiler expected a value or expression here but found something else.\n\nCheck for typos, missing values, or misplaced operators near the error line.`,

    expected_declaration:
        `The compiler expected a variable or function declaration here.\n\nCheck the area around the error for a missing keyword, type name, or misplaced bracket.`,

    redefinition:
        `You defined the same variable or function more than once.\n\nEach name can only be declared once in the same scope. Check if you accidentally wrote the same variable declaration twice.`,

    unused_variable:
        `You declared a variable but never used it.\n\nEither remove it if you don't need it, or use it in your code. This is a warning, not an error, but it's worth cleaning up.`,

    division_by_zero:
        `Your code is attempting to divide by zero, which is undefined in C.\n\nCheck your divisor — make sure it can never be 0 before performing division.`,

    incompatible_pointer:
        `You assigned a pointer to an incompatible pointer type.\n\nCheck that the types on both sides of the assignment match, or cast appropriately.`,

    unknown:
        `Something in your code isn't quite right, but I couldn't identify the exact issue.\n\nRead the error message above carefully — it will tell you which line to look at and what the compiler expected to find there.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry: takes the first CompilerDiagnostic, classifies it, returns
// the targeted Platypus explanation.
// ─────────────────────────────────────────────────────────────────────────────

export function explainCompilerError(errorTextOrDiagnostic: string | CompilerDiagnostic): string {
    // Handle legacy string call path (for backwards compat with any call sites
    // that pass raw error text instead of a structured diagnostic)
    if (typeof errorTextOrDiagnostic === 'string') {
        const synthetic: CompilerDiagnostic = {
            line: 0, column: 0, type: 'error',
            message: errorTextOrDiagnostic, rawContext: ''
        }
        const classified = classifyCompilerError(synthetic)
        return PLATYPUS_EXPLANATIONS[classified.errorType]
    }

    const classified = classifyCompilerError(errorTextOrDiagnostic)
    return PLATYPUS_EXPLANATIONS[classified.errorType]
}

/**
 * Convenience: pass the full diagnostics array and explain only the first one.
 * Returns undefined if no diagnostics are passed.
 */
export function explainFirstDiagnostic(diagnostics: CompilerDiagnostic[]): string | undefined {
    if (!diagnostics || diagnostics.length === 0) return undefined
    const first = diagnostics.find(d => d.type === 'error') ?? diagnostics[0]
    return explainCompilerError(first)
}
