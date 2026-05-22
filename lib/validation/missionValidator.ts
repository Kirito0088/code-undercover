import { secureMissionValidations } from "@/src/data/missionsData"

export interface ValidationResult {
    missionCleared: boolean;
    innovationUnlocked: boolean;
    innovationReason?: string;
}

export interface OutputValidationResult {
    isCorrect: boolean;
    feedbackMessage?: string;
}

/**
 * Strict, case-sensitive output validation comparing compiler-produced stdout
 * against expected outputs pulled directly from our secure backend data source.
 */
export function validateMissionOutput(
    missionOrder: number,
    userInput: string,
    compilerOutput: string
): OutputValidationResult {
    const secureConfig = secureMissionValidations[missionOrder]
    if (!secureConfig) {
        // Fallback for safety: if no validation config exists, let it pass compile checks
        return { isCorrect: true }
    }

    let expectedOutput = ""
    const cleanUserOutput = compilerOutput.trim()

    if (secureConfig.requiredOutput) {
        expectedOutput = secureConfig.requiredOutput
    } else if (secureConfig.testCases && secureConfig.testCases.length > 0) {
        const cleanInput = userInput.trim()
        // Find test case matching the execution input
        const matchedTestCase = secureConfig.testCases.find(
            (tc) => tc.input.trim() === cleanInput
        )

        if (matchedTestCase) {
            expectedOutput = matchedTestCase.expectedOutput
        } else {
            // Default to first test case if input doesn't match exactly
            expectedOutput = secureConfig.testCases[0].expectedOutput
        }
    }

    const cleanExpectedOutput = expectedOutput.trim()

    if (cleanUserOutput !== cleanExpectedOutput) {
        return {
            isCorrect: false,
            feedbackMessage: `Platypus: That’s close, but the system access code requires exact precision. Your output: '${cleanUserOutput}'. Expected output: '${cleanExpectedOutput}'. Check your capitalization and spelling, Agent.`,
        }
    }

    return { isCorrect: true }
}

export function detectInnovation(
    code: string,
    missionTitle: string
): { innovationUnlocked: boolean; innovationReason: string } {
    // We specifically target the Pointer mission for these rules
    if (missionTitle !== "The Pointer Breach") {
        // Fallback for other missions: check for while-loops or ternary operators
        const hasWhileLoop = /\bwhile\s*\(/.test(code)
        const hasTernary = /\?[^:]*:/.test(code)
        if (hasWhileLoop || hasTernary) {
            return {
                innovationUnlocked: true,
                innovationReason: "Alternative control flow detected! Exceptional logic, agent."
            };
        }
        return { innovationUnlocked: false, innovationReason: "" };
    }

    // Canonical solution mapping for "The Pointer Breach"
    const canonicalSolution = `
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *ptr = (int *)malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
        printf("%d", *ptr);
        free(ptr);
        ptr = NULL;
    }
    return 0;
}`;

    // Normalize: remove all whitespace and convert to lowercase
    const normalize = (str: string) => str.replace(/\s+/g, "").toLowerCase();

    const normalizedUserCode = normalize(code);
    const normalizedCanonical = normalize(canonicalSolution);

    // 1. Do NOT trigger innovation if code matches canonical exactly
    if (normalizedUserCode === normalizedCanonical) {
        return { innovationUnlocked: false, innovationReason: "" };
    }

    // 2. Check for alternative valid syntax / advanced techniques using regex
    const hasSizeofStar = /\bsizeof\s*\(\s*\*/.test(code);
    const hasPointerArithmetic = /\bptr\s*[+\-]/.test(code);
    const hasBangNullCheck = /\bif\s*\(\s*!/.test(code);
    const hasParenthesisDereference = /\*\s*\(\s*ptr\s*\)/.test(code);

    // In C, casting malloc (e.g., (int *)malloc) is considered bad practice by some,
    // so omitting it is an innovation/proper C idiom (unlike C++).
    const lacksIntCast = !/\(\s*int\s*\*\s*\)\s*malloc/.test(code);

    if (hasSizeofStar || hasPointerArithmetic || hasBangNullCheck || hasParenthesisDereference || lacksIntCast) {
        return {
            innovationUnlocked: true,
            innovationReason: "Advanced pointer syntax detected! (Idiomatic malloc, concise null checks, or pointer arithmetic). Fox badge awarded."
        };
    }

    return { innovationUnlocked: false, innovationReason: "" };
}
