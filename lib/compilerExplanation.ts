import { CompilerDiagnostic } from '@/types'
import { classifyCompilerError, CompilerErrorType } from './errorClassifier'

// ─────────────────────────────────────────────────────────────────────────────
// Platypus Explanation Map
// Each CompilerErrorType maps to a beginner-friendly mentor explanation.
// Lines are phrased from Platypus's perspective and guide — not give answers.
// ─────────────────────────────────────────────────────────────────────────────

const PLATYPUS_EXPLANATIONS: Record<CompilerErrorType, string> = {
    missing_semicolon:
        `Every statement in C needs to end with a semicolon (;), and yours is missing one.\n\nLook at the line the error points to, and the line just above it — one of them almost always needs a ; added at the end.`,

    missing_closing_brace:
        `You're missing a closing curly brace (}) somewhere in your code.\n\nEvery opening { needs a matching } to close it. Try counting your braces from the top of the file down — the count will show you which one never got closed.`,

    missing_opening_brace:
        `You're missing an opening curly brace ({) somewhere in your code.\n\nLook at the function or block near the error line — it's probably starting without its opening {.`,

    undeclared_identifier:
        `The compiler found a name it doesn't know.\n\nThat usually means one of three things:\n• You spelled the name differently somewhere else in your code\n• You used the name before you set it up\n• You forgot to #include the file that defines it`,

    implicit_function:
        `You called a function the compiler hasn't seen declared yet.\n\nThis almost always means a #include is missing at the top of your file. For example, printf and scanf both need:\n\n  #include <stdio.h>`,

    missing_stdio:
        `You're using printf or scanf, but the standard input/output library isn't included yet.\n\nAdd this line at the very top of your file:\n\n  #include <stdio.h>`,

    missing_math:
        `You're using a math function like sqrt or pow, but the math library isn't included yet.\n\nAdd this at the top of your file:\n\n  #include <math.h>\n\nYou may also need to add the -lm flag when compiling.`,

    empty_printf:
        `You called printf with nothing but empty quotes.\n\nprintf shows text on the screen, so it needs a message inside the quotes to print. For example:\n\n  printf("Hello!");`,

    zero_length_format:
        `Your printf's quotes are empty — there's no format text inside them.\n\nPut the text you want to print inside the quotes. If you just want a blank line, use:\n\n  printf("\\n");`,

    missing_return:
        `Your function promises to return a value (like int), but it never actually does.\n\nAdd return 0; at the end of main(), or the right value at the end of any other non-void function.`,

    type_mismatch:
        `You're mixing two types together in a way C doesn't allow.\n\nDouble-check what's on each side of the assignment — for example, a whole number (int) and a piece of text (a string) can't just be swapped for each other.`,

    too_few_args:
        `You called a function with fewer arguments than it needs.\n\nCheck how that function is defined to see exactly how many arguments it expects, then add whatever you're missing.`,

    too_many_args:
        `You called a function with more arguments than it expects.\n\nCheck the function's definition and remove whichever extra arguments it doesn't need.`,

    missing_string_terminator:
        `You opened a string with a double-quote (") but never closed it.\n\nEvery string needs a matching " at both ends. Look at the error line for the one that's still open.`,

    expected_expression:
        `The compiler expected a value here but found something else instead.\n\nLook near the error line in your code for a typo, a missing value, or a stray symbol like + or - sitting where it shouldn't be.`,

    expected_declaration:
        `The compiler expected a variable or function declaration here.\n\nLook around the error line in your code for a missing type name (like int), a missing keyword, or a bracket in the wrong place.`,

    redefinition:
        `You've declared the same variable or function more than once.\n\nEach name can only be declared once in the same scope — check whether you accidentally wrote the same declaration twice.`,

    unused_variable:
        `You created a variable but never actually used it anywhere.\n\nThis is just a warning, not an error, so your code will still run. It's worth either removing the variable or putting it to use.`,

    division_by_zero:
        `Your code is dividing by zero somewhere, and C doesn't allow that.\n\nCheck whatever you're dividing by, and make sure it can never end up being 0 before the division happens.`,

    incompatible_pointer:
        `You're assigning a pointer to a variable that expects a different kind of pointer.\n\nCheck that the types on both sides of the assignment match, or add an explicit cast if you really mean to convert between them.`,

    unknown:
        `Something in your code isn't quite right, but I couldn't pin down the exact cause.\n\nRead the compiler's message above carefully — it tells you which line to look at and what it expected to find there.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry: takes the first CompilerDiagnostic, classifies it, returns
// the targeted Platypus explanation.
// ─────────────────────────────────────────────────────────────────────────────

function explainCompilerError(errorTextOrDiagnostic: string | CompilerDiagnostic): string {
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

/**
 * Look up the static Platypus explanation for an already-classified
 * CompilerErrorType. Used by lib/explainService.ts as the OPEN-1 primary
 * layer: known error types short-circuit to this map at zero latency/cost,
 * before ever reaching the Oracle Ollama instance.
 */
export function explainByErrorType(errorType: CompilerErrorType): string {
    return PLATYPUS_EXPLANATIONS[errorType]
}
