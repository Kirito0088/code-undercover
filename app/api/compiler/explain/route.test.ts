import { describe, it, expect, vi, beforeEach } from "vitest"

const isRateLimited = vi.fn().mockResolvedValue(false)
vi.mock("@/lib/rate-limit", () => ({
    compilerExplainLimiter: { isRateLimited: (...args: unknown[]) => isRateLimited(...args) },
    getIpFromHeaders: () => "127.0.0.1",
}))

const explainError = vi.fn()
vi.mock("@/lib/explainService", () => ({
    explainError: (...args: unknown[]) => explainError(...args),
}))

import { POST } from "./route"

function req(body: unknown) {
    return new Request("http://localhost/api/compiler/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    })
}

describe("POST /api/compiler/explain", () => {
    beforeEach(() => {
        isRateLimited.mockReset().mockResolvedValue(false)
        explainError.mockReset()
    })

    it("14. malformed body — 400", async () => {
        const res = await POST(
            new Request("http://localhost/api/compiler/explain", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{not valid json",
            })
        )

        expect(res.status).toBe(400)
    })

    it("14b. missing required field — 400", async () => {
        const res = await POST(req({ brokenLineContent: "int x = 1" }))
        expect(res.status).toBe(400)
    })

    it("15. SLM down — explainService returns the fallback, route still answers 200", async () => {
        explainError.mockResolvedValue({
            explanation: "Agent, the diagnostic signal is heavily scrambled on my end. Try fixing one obvious syntax error and compile again to clear the channel.",
            directFix: "",
            source: "fallback",
        })

        const res = await POST(req({ rootErrorMessage: "error: something novel", brokenLineContent: "x" }))
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.source).toBe("fallback")
        expect(json.directFix).toBe("")
    })

    it("16. oversized rootErrorMessage (>2000 chars) — 400", async () => {
        const res = await POST(
            req({ rootErrorMessage: "x".repeat(2001), brokenLineContent: "" })
        )
        expect(res.status).toBe(400)
        expect(explainError).not.toHaveBeenCalled()
    })

    it("returns 429 when rate limited, without calling explainError", async () => {
        isRateLimited.mockResolvedValue(true)

        const res = await POST(req({ rootErrorMessage: "error: something", brokenLineContent: "" }))

        expect(res.status).toBe(429)
        expect(explainError).not.toHaveBeenCalled()
    })

    it("returns 200 with the explanation payload on success", async () => {
        explainError.mockResolvedValue({
            explanation: "Clear beginner-friendly explanation.",
            directFix: "int x = 1;",
            source: "generated",
        })

        const res = await POST(req({ rootErrorMessage: "error: something", brokenLineContent: "int x = 1" }))
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json).toEqual({
            explanation: "Clear beginner-friendly explanation.",
            directFix: "int x = 1;",
            source: "generated",
        })
    })
})
