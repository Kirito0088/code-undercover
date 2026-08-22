import { CompilerDiagnostic } from '@/types'
import { classifyCompilerError, CompilerErrorType, ClassifiedError } from './errorClassifier'

// ─────────────────────────────────────────────────────────────────────────────
// Platypus Explanation Map
// Each CompilerErrorType maps to a beginner-friendly mentor explanation.
// Lines are phrased from Platypus's perspective and guide — not give answers.
//
// Each entry is a function of the classified error so the explanation can name
// the actual identifier and line GCC complained about. A generic explanation
// ("you used a name the program doesn't recognise") forces the agent to map the
// advice back onto their own code themselves; naming the symbol removes that
// step, which is the whole point of the mentor panel.
// ─────────────────────────────────────────────────────────────────────────────

type Explainer = (e: ClassifiedError) => string

/** "line 5" when GCC gave us a real line, "the error line" when it did not. */
function at(e: ClassifiedError): string {
    return e.line > 0 ? `line ${e.line}` : 'the error line'
}

/** Render the offending identifier, or a neutral noun when GCC named none. */
function named(e: ClassifiedError, fallback: string): string {
    return e.symbol ? `'${e.symbol}'` : fallback
}

const PLATYPUS_EXPLANATIONS: Record<CompilerErrorType, Explainer> = {
    // GCC 9+ points its caret AT the insertion point for the missing ';', while
    // the message names the token that follows ("before 'return'"). Send the
    // agent to the caret, not to the token — verified against real judge output.
    missing_semicolon: (e) =>
        `Agent, every statement in C must end with a semicolon (;).\n\nAdd one at ${at(e)}${e.column > 0 ? `, column ${e.column}` : ''} — exactly where the ^ points in the output above.\n\nThe message mentions ${e.symbol ? `'${e.symbol}'` : 'the next keyword'} because C only notices the missing ; once it starts reading the following statement. That token is not the problem.`,

    missing_closing_brace: () =>
        `Your code is missing a closing curly brace (}).\n\nEvery opening brace { must have a matching closing brace }. The compiler read all the way to the end of your file still waiting for one.\n\nCount your braces from the top down — each { should line up with a } at the same indentation.`,

    missing_opening_brace: (e) =>
        `Your code is missing an opening curly brace ({).\n\nCheck the function, loop, or if-statement at ${at(e)} — it needs a { to open its body.`,

    missing_closing_paren: (e) =>
        `You opened a bracket ( at ${at(e)} but never closed it.\n\nEvery ( needs a matching ). Check the condition or function call on that line.`,

    undeclared_identifier: (e) =>
        `The name ${named(e, 'you used')} at ${at(e)} is not recognised.\n\nThis usually means one of:\n• It is misspelled — check the spelling and capitalisation against where you declared it\n• You never declared it, e.g. you need int ${e.symbol ?? 'x'}; before using it\n• You declared it inside a different { } block, so it is out of scope here`,

    undefined_reference: (e) =>
        `Your code compiled, but the linker could not find the body of ${named(e, 'a function you called')}.\n\nThis means you DECLARED or called the function but never DEFINED what it actually does.\n\nCheck that:\n• The function has a real body somewhere: int ${e.symbol ?? 'myFunc'}(...) { ... }\n• The name is spelled exactly the same in the definition and the call\n\nThis is different from a spelling error the compiler catches — here the name is valid, there is just no code behind it.`,

    no_main: () =>
        `Your program has no main() function.\n\nEvery C program starts at main(). Add:\n\n  int main() {\n      // your code\n      return 0;\n  }\n\nCheck the spelling too — Main or MAIN will not work, it must be lowercase main.`,

    implicit_function: (e) =>
        `You called ${named(e, 'a function')} at ${at(e)} before the compiler knew it existed.\n\nThis usually means a required #include is missing at the top of your file, or the function is defined further DOWN the file than where you call it.\n\nIn C, a function must be declared above the point where you first use it.`,

    missing_stdio: (e) =>
        `You used ${named(e, 'printf or scanf')}, but the standard input/output library is not included.\n\nAdd this line at the very top of your code:\n\n  #include <stdio.h>`,

    missing_math: (e) =>
        `You used the maths function ${named(e, 'sqrt or pow')}, but the maths library is not included.\n\nAdd this at the top of your file:\n\n  #include <math.h>`,

    missing_string_h: (e) =>
        `You used the string function ${named(e, 'strlen or strcpy')}, but the string library is not included.\n\nAdd this at the top of your file:\n\n  #include <string.h>`,

    missing_stdlib: (e) =>
        `You used ${named(e, 'a standard library function')}, which lives in the standard library header.\n\nAdd this at the top of your file:\n\n  #include <stdlib.h>\n\nNote that abs(), malloc() and atoi() are in stdlib.h — not math.h.`,

    missing_header_file: (e) =>
        `The compiler could not find the header file ${e.symbol ? `"${e.symbol}"` : 'you asked for'}.\n\nCheck the spelling in your #include line, and make sure you used angle brackets for standard headers:\n\n  #include <stdio.h>   ← correct for standard headers\n  #include "stdio.h"   ← for your own files`,

    empty_printf: () =>
        `You used printf with empty quotes.\n\nprintf displays text on the screen. Put the message you want to show inside the quotes.\n\nExample:\n  printf("Hello Agent");`,

    zero_length_format: () =>
        `Your printf has an empty format string — the quotes contain nothing.\n\nIf you want to print text, write it inside the quotes. If you want a blank line, use:\n  printf("\\n");`,

    format_mismatch: (e) =>
        `The format specifier in your printf or scanf at ${at(e)} does not match the type of the value you passed.\n\nCommon pairings:\n• %d — int\n• %f — float or double\n• %c — single char\n• %s — string (char array)\n\nAlso remember scanf needs the ADDRESS of a variable: scanf("%d", &n);`,

    missing_return: (e) =>
        `Your function at ${at(e)} is declared to return a value (like int), but some path through it returns nothing.\n\nAdd return 0; at the end of main(), or the correct return value at the end of any non-void function.`,

    type_mismatch: (e) =>
        `The types at ${at(e)} do not fit together the way C requires.\n\nCheck that both sides of the assignment or comparison are compatible — for example, you cannot assign a string directly to an int variable.`,

    too_few_args: (e) =>
        `You called ${named(e, 'a function')} with fewer arguments than it expects.\n\nLook at where that function is defined and count its parameters, then supply one value for each.`,

    too_many_args: (e) =>
        `You called ${named(e, 'a function')} with more arguments than it expects.\n\nLook at where that function is defined and remove the extra values from your call.`,

    missing_string_terminator: (e) =>
        `You opened a string with a double-quote (") at ${at(e)} but never closed it.\n\nEach string must start and end with a double-quote on the same line. Check that line for an unclosed " character.`,

    expected_expression: (e) =>
        `The compiler expected a value or expression at ${at(e)} but found something else.\n\nLook for a stray operator, an empty pair of brackets, or a missing value — for example int x = ; instead of int x = 5;`,

    expected_declaration: (e) =>
        `The compiler expected a declaration at ${at(e)}.\n\nThis often means a statement is sitting outside any function, or a { } block was closed one line too early. Check that this code is inside main() or another function.`,

    redefinition: (e) =>
        `${e.symbol ? `'${e.symbol}' is` : 'A name is'} declared more than once in the same scope.\n\nEach name can only be declared once per block. Check whether you wrote the same declaration twice — for example int ${e.symbol ?? 'x'}; appearing on two different lines.`,

    unused_variable: (e) =>
        `You declared ${named(e, 'a variable')} at ${at(e)} but never used it.\n\nEither remove it, or use it in your code. This is a warning, not an error — your program still runs.`,

    uninitialized_variable: (e) =>
        `You are reading ${named(e, 'a variable')} at ${at(e)} before giving it a value.\n\nAn uninitialised variable in C holds whatever junk was in that memory, so your results will be unpredictable. Set a starting value when you declare it:\n\n  int ${e.symbol ?? 'total'} = 0;`,

    division_by_zero: (e) =>
        `Your code divides by zero at ${at(e)}, which is undefined in C.\n\nCheck your divisor — make sure it can never be 0 before performing the division.`,

    incompatible_pointer: (e) =>
        `The pointer types at ${at(e)} do not match.\n\nA very common cause is forgetting & in scanf — scanf("%d", n) should be scanf("%d", &n). Otherwise, check that the pointer type on each side of the assignment is the same.`,

    unknown: (e) =>
        `Something at ${at(e)} isn't quite right, but I couldn't identify the exact pattern.\n\nRead the compiler message above carefully — it names the line to look at and what it expected to find there. Start at that line, then check the line just above it.`,
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry: takes a CompilerDiagnostic, classifies it, returns the targeted
// Platypus explanation.
// ─────────────────────────────────────────────────────────────────────────────

export function explainCompilerError(errorTextOrDiagnostic: string | CompilerDiagnostic): string {
    // Handle legacy string call path (for backwards compat with any call sites
    // that pass raw error text instead of a structured diagnostic)
    const diagnostic: CompilerDiagnostic = typeof errorTextOrDiagnostic === 'string'
        ? { line: 0, column: 0, type: 'error', message: errorTextOrDiagnostic, rawContext: '' }
        : errorTextOrDiagnostic

    const classified = classifyCompilerError(diagnostic)
    return PLATYPUS_EXPLANATIONS[classified.errorType](classified)
}

// ─────────────────────────────────────────────────────────────────────────────
// Runtime failures. A program that compiles can still die at run time, and the
// judge reports those as bare status strings ("Runtime Error (SIGSEGV)") that
// mean nothing to a beginner.
// ─────────────────────────────────────────────────────────────────────────────

const RUNTIME_EXPLANATIONS: { match: RegExp; text: string }[] = [
    {
        match: /SIGSEGV|segmentation fault/i,
        text: `Your program compiled, then crashed while running — a segmentation fault.\n\nThat means it touched memory it does not own. The usual causes are:\n• Reading or writing past the end of an array\n• Using a pointer that was never given a value\n• Forgetting & in scanf: scanf("%d", n) instead of scanf("%d", &n)`,
    },
    {
        match: /SIGFPE|floating point/i,
        text: `Your program crashed doing arithmetic — almost always an integer division or modulo by zero.\n\nCheck every / and % and make sure the right-hand side can never be 0.`,
    },
    {
        match: /SIGABRT/i,
        text: `Your program aborted itself while running.\n\nThis usually follows a failed memory operation — for example freeing the same pointer twice, or writing past the end of a malloc'd block.`,
    },
    {
        match: /SIGXFSZ|output limit/i,
        text: `Your program produced far more output than expected.\n\nThis is normally a loop that never stops printing. Check the loop condition and make sure the counter actually advances toward it.`,
    },
]

/**
 * Explain a non-compile execution failure from the judge's status text and any
 * captured stderr. Returns undefined when nothing recognisable matched, so the
 * caller can keep showing the raw text on its own.
 */
export function explainRuntimeFailure(...signals: (string | undefined)[]): string | undefined {
    const haystack = signals.filter(Boolean).join('\n')
    if (!haystack) return undefined
    return RUNTIME_EXPLANATIONS.find(r => r.match.test(haystack))?.text
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
