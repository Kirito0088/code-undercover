export interface ExplanationResult {
    success: boolean
    compilerError: string
    explanation: string
}

const COMMON_C_ERRORS = [
    {
        regex: /expected\s+['"]?['"]?\s+before/,
        explanation: "You likely forgot a semicolon (;) at the end of a previous statement."
    },
    {
        regex: /undeclared\s*\(first use in this function\)/i,
        explanation: "You are using a variable or function that was never declared or misspelled."
    },
    {
        regex: /implicit declaration of function/i,
        explanation: "You are calling a function that hasn't been defined, or you forgot to #include the necessary header file (like <stdio.h> for printf)."
    },
    {
        regex: /control reaches end of non-void function/i,
        explanation: "Your function is supposed to return a value (like int), but you forgot the return statement at the end."
    },
    {
        regex: /expected declaration or statement at end of input/i,
        explanation: "You are missing a closing curly brace '}' somewhere in your code."
    },
    {
        regex: /too (few|many) arguments to function/i,
        explanation: "You are passing the wrong number of arguments to a function."
    },
    {
        regex: /missing terminating/i,
        explanation: "You forgot to close a string query with double quotes (\")."
    },
    {
        regex: /invalid conversion from/i,
        explanation: "You are trying to mix incompatible variable types."
    }
]

export function explainCompilerError(errorText: string): string {
    // Return friendly string if matching regex
    for (const errorRule of COMMON_C_ERRORS) {
        if (errorRule.regex.test(errorText)) {
            return errorRule.explanation
        }
    }

    // Fallback if we cannot cleanly identify the error
    return "There is a syntax or compilation error in your code. Review the raw compiler output above for clues."
}
