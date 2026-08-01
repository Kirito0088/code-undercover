import { describe, it, expect } from "vitest"
import { validateMissionOutput, detectInnovation } from "./missionValidator"

describe("validateMissionOutput", () => {
    // Mission 1 ("The System Access"): requiredOutput = "Hello Agent"
    it("accepts an exact match against requiredOutput", () => {
        expect(validateMissionOutput(1, "", "Hello Agent").isCorrect).toBe(true)
    })

    it("is case-insensitive and whitespace-tolerant", () => {
        expect(validateMissionOutput(1, "", "  hello    agent  ").isCorrect).toBe(true)
    })

    it("tolerates trailing punctuation", () => {
        expect(validateMissionOutput(1, "", "Hello Agent!").isCorrect).toBe(true)
    })

    it("rejects wrong output and includes a feedback message", () => {
        const result = validateMissionOutput(1, "", "Wrong output")
        expect(result.isCorrect).toBe(false)
        expect(result.feedbackMessage).toBeTruthy()
    })

    // Mission 2 ("Variable Infiltration"): testCases keyed by input
    it("matches the test case whose input equals the execution input", () => {
        expect(validateMissionOutput(2, "7", "You entered: 7").isCorrect).toBe(true)
        expect(validateMissionOutput(2, "42", "You entered: 42").isCorrect).toBe(true)
    })

    it("rejects output that doesn't match the matched test case", () => {
        expect(validateMissionOutput(2, "7", "You entered: 42").isCorrect).toBe(false)
    })

    it("falls back to the first test case when input matches none", () => {
        expect(validateMissionOutput(2, "999", "You entered: 7").isCorrect).toBe(true)
    })

    it("passes by default when no validation config exists for the mission", () => {
        expect(validateMissionOutput(99999, "", "anything").isCorrect).toBe(true)
    })
})

describe("detectInnovation", () => {
    describe("generic missions (not 'The Pointer Breach')", () => {
        it("unlocks on a while loop", () => {
            const result = detectInnovation("while (x < 10) { x++; }", "Some Other Mission")
            expect(result.innovationUnlocked).toBe(true)
        })

        it("unlocks on a ternary operator", () => {
            const result = detectInnovation("int y = x > 0 ? 1 : 0;", "Some Other Mission")
            expect(result.innovationUnlocked).toBe(true)
        })

        it("does not unlock for plain sequential code", () => {
            const result = detectInnovation("int x = 1;\nprintf(\"%d\", x);", "Some Other Mission")
            expect(result.innovationUnlocked).toBe(false)
        })
    })

    describe("'The Pointer Breach' mission", () => {
        const canonical = `
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
}`

        it("does not unlock innovation for the canonical solution", () => {
            const result = detectInnovation(canonical, "The Pointer Breach")
            expect(result.innovationUnlocked).toBe(false)
        })

        it("unlocks innovation for idiomatic malloc without the int* cast", () => {
            const code = `
#include <stdio.h>
#include <stdlib.h>
int main() {
    int *ptr = malloc(sizeof(int));
    if (ptr != NULL) {
        *ptr = 42;
        printf("%d", *ptr);
        free(ptr);
        ptr = NULL;
    }
    return 0;
}`
            const result = detectInnovation(code, "The Pointer Breach")
            expect(result.innovationUnlocked).toBe(true)
        })
    })
})
