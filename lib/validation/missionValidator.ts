export interface ValidationResult {
    missionCleared: boolean;
    innovationUnlocked: boolean;
    innovationReason?: string;
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
