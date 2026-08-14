import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { callOllama, FALLBACK_EXPLANATION } from "./ollama"

// ADR-004: exactly one fetch attempt, wrapped in an 8000ms AbortController,
// strict schema validation on the response — any deviation is a failure,
// never a 5xx and never a retry.

function ollamaResponse(body: unknown) {
    return {
        ok: true,
        status: 200,
        json: async () => body,
    }
}

describe("callOllama", () => {
    const originalFetch = global.fetch
    const originalEnv = { ...process.env }

    beforeEach(() => {
        process.env.OLLAMA_BASE_URL = "http://oracle.example.internal:11434"
        process.env.OLLAMA_MODEL = "qwen2.5-coder-platypus:3b"
    })

    afterEach(() => {
        global.fetch = originalFetch
        process.env = { ...originalEnv }
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it("1. returns the parsed object on a valid response", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            ollamaResponse({
                response: JSON.stringify({
                    explanation: "Your loop never ends because the condition is always true.",
                    direct_fix: "Change i < 10 to i <= 10.",
                }),
            })
        )

        const result = await callOllama("error: expected expression", "for (;;) {")

        expect(result).toEqual({
            explanation: "Your loop never ends because the condition is always true.",
            direct_fix: "Change i < 10 to i <= 10.",
        })
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("2. aborts at ~8000ms and returns null on timeout", async () => {
        vi.useFakeTimers()
        global.fetch = vi.fn().mockImplementation(
            (_url, init) =>
                new Promise((_resolve, reject) => {
                    init?.signal?.addEventListener("abort", () => {
                        const err = new Error("aborted")
                        err.name = "AbortError"
                        reject(err)
                    })
                })
        )

        const promise = callOllama("error: something", "int x = 1")
        await vi.advanceTimersByTimeAsync(8000)
        const result = await promise

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("3. returns null on a non-2xx response (500)", async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) })

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("3b. returns null on a non-2xx response (503)", async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) })

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("4. returns null when fetch rejects (network error)", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"))

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("5. returns null on malformed JSON inside the response field", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            ollamaResponse({ response: "{ this is not valid json" })
        )

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("6. returns null on schema mismatch (missing direct_fix)", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            ollamaResponse({
                response: JSON.stringify({ explanation: "Only an explanation, no fix." }),
            })
        )

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("6b. returns null on schema mismatch (extra keys, strict rejection)", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            ollamaResponse({
                response: JSON.stringify({
                    explanation: "Fine.",
                    direct_fix: "Fine.",
                    confidence: 0.9,
                }),
            })
        )

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("7. returns null on markdown-fenced JSON — does NOT unwrap it", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            ollamaResponse({
                response:
                    '```json\n{"explanation": "Fenced.", "direct_fix": "Fix."}\n```',
            })
        )

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("8. returns null (not truncated) when the explanation exceeds 3 sentences", async () => {
        global.fetch = vi.fn().mockResolvedValue(
            ollamaResponse({
                response: JSON.stringify({
                    explanation: "One. Two. Three. Four.",
                    direct_fix: "Fix.",
                }),
            })
        )

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    it("9. makes exactly one fetch call across every failure case (spot check)", async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error("boom"))

        await callOllama("error: something", "int x = 1")
        await callOllama("error: something else", "int y = 2")

        expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it("returns null without ever calling fetch when Ollama env vars are unset", async () => {
        delete process.env.OLLAMA_BASE_URL
        delete process.env.OLLAMA_MODEL
        global.fetch = vi.fn()

        const result = await callOllama("error: something", "int x = 1")

        expect(result).toBeNull()
        expect(global.fetch).not.toHaveBeenCalled()
    })
})

describe("FALLBACK_EXPLANATION", () => {
    it("matches the ADR-004 kid-friendly fallback contract", () => {
        expect(FALLBACK_EXPLANATION).toEqual({
            explanation:
                "Agent, the diagnostic signal is heavily scrambled on my end. Try fixing one obvious syntax error and compile again to clear the channel.",
            direct_fix: "",
        })
    })
})
