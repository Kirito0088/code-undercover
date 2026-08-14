import { describe, it, expect, vi, beforeEach } from "vitest"

const findUnique = vi.fn()
const update = vi.fn()
const create = vi.fn()

vi.mock("./db", () => ({
    db: {
        compilerErrorCache: {
            findUnique: (...args: unknown[]) => findUnique(...args),
            update: (...args: unknown[]) => update(...args),
            create: (...args: unknown[]) => create(...args),
        },
    },
}))

const callOllama = vi.fn()
vi.mock("./ollama", () => ({
    callOllama: (...args: unknown[]) => callOllama(...args),
    FALLBACK_EXPLANATION: {
        explanation:
            "Agent, the diagnostic signal is heavily scrambled on my end. Try fixing one obvious syntax error and compile again to clear the channel.",
        direct_fix: "",
    },
}))

import { explainError } from "./explainService"
import { computeErrorHash } from "./errorHash"

describe("explainError", () => {
    beforeEach(() => {
        findUnique.mockReset()
        update.mockReset()
        create.mockReset()
        callOllama.mockReset()
    })

    it("OPEN-1 layer 1: a known error type short-circuits to the static map — zero fetch, zero DB", async () => {
        const result = await explainError("error: expected ';' before '}' token", "int x = 1")

        expect(result.source).toBe("static")
        expect(result.explanation).toBeTruthy()
        expect(callOllama).not.toHaveBeenCalled()
        expect(findUnique).not.toHaveBeenCalled()
    })

    it("10. cache hit — zero fetch calls, hitCount incremented, source: cache", async () => {
        const rootErrorMessage = "some genuinely novel compiler complaint"
        const brokenLineContent = "weird_line();"
        const errorHash = computeErrorHash(rootErrorMessage, brokenLineContent)
        findUnique.mockResolvedValue({
            errorHash,
            explanation: "Cached explanation.",
            directFix: "Cached fix.",
            hitCount: 3,
        })

        const result = await explainError(rootErrorMessage, brokenLineContent)

        expect(result).toEqual({
            explanation: "Cached explanation.",
            directFix: "Cached fix.",
            source: "cache",
        })
        expect(callOllama).not.toHaveBeenCalled()
        expect(update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { errorHash },
                data: expect.objectContaining({ hitCount: { increment: 1 } }),
            })
        )
    })

    it("11. cache miss + success — row persisted, source: generated", async () => {
        findUnique.mockResolvedValue(null)
        callOllama.mockResolvedValue({
            explanation: "A fresh AI explanation.",
            direct_fix: "A fresh AI fix.",
        })
        create.mockResolvedValue({})

        const result = await explainError("some genuinely novel compiler complaint", "weird_line();")

        expect(result).toEqual({
            explanation: "A fresh AI explanation.",
            directFix: "A fresh AI fix.",
            source: "generated",
        })
        expect(create).toHaveBeenCalledTimes(1)
    })

    it("12. cache miss + failure — no row written, source: fallback", async () => {
        findUnique.mockResolvedValue(null)
        callOllama.mockResolvedValue(null)

        const result = await explainError("some genuinely novel compiler complaint", "weird_line();")

        expect(result.source).toBe("fallback")
        expect(result.explanation).toBe(
            "Agent, the diagnostic signal is heavily scrambled on my end. Try fixing one obvious syntax error and compile again to clear the channel."
        )
        expect(result.directFix).toBe("")
        expect(create).not.toHaveBeenCalled()
    })

    it("13. two concurrent identical misses — unique-constraint violation is handled, not thrown", async () => {
        findUnique.mockResolvedValue(null)
        callOllama.mockResolvedValue({
            explanation: "A fresh AI explanation.",
            direct_fix: "A fresh AI fix.",
        })
        const p2002 = Object.assign(new Error("Unique constraint failed"), { code: "P2002" })
        create.mockRejectedValue(p2002)

        await expect(
            explainError("some genuinely novel compiler complaint", "weird_line();")
        ).resolves.toEqual({
            explanation: "A fresh AI explanation.",
            directFix: "A fresh AI fix.",
            source: "generated",
        })
    })

    it("13b. a non-P2002 database error during persistence is not swallowed", async () => {
        findUnique.mockResolvedValue(null)
        callOllama.mockResolvedValue({
            explanation: "A fresh AI explanation.",
            direct_fix: "A fresh AI fix.",
        })
        create.mockRejectedValue(new Error("connection lost"))

        await expect(
            explainError("some genuinely novel compiler complaint", "weird_line();")
        ).rejects.toThrow("connection lost")
    })
})
