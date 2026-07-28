import { describe, it, expect, vi } from "vitest"
import { SimpleRateLimiter, getIpFromHeaders } from "./rate-limit"

describe("SimpleRateLimiter.check", () => {
    it("allows requests up to the limit, then blocks", () => {
        const limiter = new SimpleRateLimiter(3, 60000)
        expect(limiter.check("a").success).toBe(true)
        expect(limiter.check("a").success).toBe(true)
        expect(limiter.check("a").success).toBe(true)
        const blocked = limiter.check("a")
        expect(blocked.success).toBe(false)
        expect(blocked.remaining).toBe(0)
    })

    it("tracks keys independently", () => {
        const limiter = new SimpleRateLimiter(1, 60000)
        expect(limiter.check("a").success).toBe(true)
        expect(limiter.check("b").success).toBe(true)
        expect(limiter.check("a").success).toBe(false)
    })

    it("resets the bucket after the window elapses", () => {
        vi.useFakeTimers()
        try {
            const limiter = new SimpleRateLimiter(1, 1000)
            expect(limiter.check("a").success).toBe(true)
            expect(limiter.check("a").success).toBe(false)
            vi.advanceTimersByTime(1001)
            expect(limiter.check("a").success).toBe(true)
        } finally {
            vi.useRealTimers()
        }
    })
})

describe("SimpleRateLimiter.isRateLimited / increment", () => {
    it("does not consume a token when peeking", () => {
        const limiter = new SimpleRateLimiter(1, 60000)
        expect(limiter.isRateLimited("a")).toBe(false)
        expect(limiter.isRateLimited("a")).toBe(false)
        expect(limiter.check("a").success).toBe(true)
    })

    it("increment() builds up failures until isRateLimited() trips", () => {
        const limiter = new SimpleRateLimiter(2, 60000)
        expect(limiter.isRateLimited("a")).toBe(false)
        limiter.increment("a")
        expect(limiter.isRateLimited("a")).toBe(false)
        limiter.increment("a")
        expect(limiter.isRateLimited("a")).toBe(true)
    })
})

describe("SimpleRateLimiter.sweep", () => {
    it("removes only expired buckets", () => {
        vi.useFakeTimers()
        try {
            const limiter = new SimpleRateLimiter(1, 1000)
            limiter.check("expired")
            vi.advanceTimersByTime(1001)
            limiter.check("fresh")
            limiter.sweep()
            // "expired" bucket is gone, so a fresh check succeeds again
            expect(limiter.check("expired").success).toBe(true)
            // "fresh" bucket is still within its window, so it's now exhausted
            expect(limiter.check("fresh").success).toBe(false)
        } finally {
            vi.useRealTimers()
        }
    })
})

describe("getIpFromHeaders", () => {
    it("returns the loopback fallback when headers are missing", () => {
        expect(getIpFromHeaders(null)).toBe("127.0.0.1")
        expect(getIpFromHeaders(undefined)).toBe("127.0.0.1")
    })

    it("reads x-forwarded-for from a Headers instance, trusting only the last (proxy-appended) hop", () => {
        // The rightmost entry is what the trusted reverse proxy actually
        // observed; entries before it are client-supplied and spoofable.
        const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })
        expect(getIpFromHeaders(headers)).toBe("5.6.7.8")
    })

    it("ignores a spoofed x-forwarded-for prefix from the client", () => {
        const headers = new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.5" })
        expect(getIpFromHeaders(headers)).not.toBe("9.9.9.9")
        expect(getIpFromHeaders(headers)).toBe("203.0.113.5")
    })

    it("falls back to x-real-ip on a Headers instance", () => {
        const headers = new Headers({ "x-real-ip": "9.9.9.9" })
        expect(getIpFromHeaders(headers)).toBe("9.9.9.9")
    })

    it("reads x-forwarded-for from a plain record (NextAuth credentials req.headers)", () => {
        expect(getIpFromHeaders({ "x-forwarded-for": "10.0.0.1" })).toBe("10.0.0.1")
    })

    it("handles array-valued headers from a plain record, trusting only the last hop", () => {
        expect(getIpFromHeaders({ "x-forwarded-for": ["10.0.0.2", "10.0.0.3"] })).toBe("10.0.0.3")
    })
})
