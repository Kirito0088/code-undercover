interface Bucket {
    count: number;
    resetAt: number;
}

export class SimpleRateLimiter {
    private hits = new Map<string, Bucket>();

    constructor(
        private readonly limit: number,
        private readonly windowMs: number
    ) {}

    /**
     * Consume 1 request token from the bucket.
     * Returns { success, remaining, retryAfterMs }
     */
    public check(key: string): { success: boolean; remaining: number; retryAfterMs: number } {
        const now = Date.now();
        const bucket = this.hits.get(key);

        if (!bucket || now > bucket.resetAt) {
            this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
            return { success: true, remaining: this.limit - 1, retryAfterMs: 0 };
        }

        if (bucket.count >= this.limit) {
            return {
                success: false,
                remaining: 0,
                retryAfterMs: bucket.resetAt - now,
            };
        }

        bucket.count += 1;
        return {
            success: true,
            remaining: this.limit - bucket.count,
            retryAfterMs: 0,
        };
    }

    /**
     * Peek to see if a key is currently rate-limited (does NOT consume a token).
     */
    public isRateLimited(key: string): boolean {
        const now = Date.now();
        const bucket = this.hits.get(key);
        if (!bucket || now > bucket.resetAt) {
            return false;
        }
        return bucket.count >= this.limit;
    }

    /**
     * Explicitly increment failure count for a key (used for tracking failed attempts).
     */
    public increment(key: string): void {
        const now = Date.now();
        const bucket = this.hits.get(key);
        if (!bucket || now > bucket.resetAt) {
            this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
        } else {
            bucket.count += 1;
        }
    }

    /**
     * Sweep expired keys from memory.
     */
    public sweep(): void {
        const now = Date.now();
        for (const [key, bucket] of this.hits.entries()) {
            if (now > bucket.resetAt) this.hits.delete(key);
        }
    }
}

export function getIpFromHeaders(headersObj: Headers | Record<string, string | string[] | undefined> | null | undefined): string {
    if (!headersObj) return "127.0.0.1";

    let xForwardedFor: string | null = null;
    let xRealIp: string | null = null;

    if (typeof (headersObj as unknown as Record<string, unknown>).get === "function") {
        const headers = headersObj as Headers;
        xForwardedFor = headers.get("x-forwarded-for");
        xRealIp = headers.get("x-real-ip");
    } else {
        const record = headersObj as Record<string, string | string[] | undefined>;
        const rawFwd = record["x-forwarded-for"] || record["X-Forwarded-For"] || record["x-forwarded-for".toLowerCase()];
        if (rawFwd) {
            xForwardedFor = Array.isArray(rawFwd) ? rawFwd[0] : rawFwd;
        }
        const rawReal = record["x-real-ip"] || record["X-Real-IP"] || record["x-real-ip".toLowerCase()];
        if (rawReal) {
            xRealIp = Array.isArray(rawReal) ? rawReal[0] : rawReal;
        }
    }

    if (xForwardedFor) {
        return xForwardedFor.split(",")[0].trim();
    }
    if (xRealIp) {
        return xRealIp.trim();
    }

    return "127.0.0.1";
}

export const checkUserLimiter = new SimpleRateLimiter(30, 60000);
export const registerLimiter = new SimpleRateLimiter(20, 60000);
export const forgotPasswordLimiter = new SimpleRateLimiter(10, 900000);
export const resetPasswordLimiter = new SimpleRateLimiter(10, 900000);
export const loginFailedLimiter = new SimpleRateLimiter(10, 900000);
// Compiler/validate proxy to the public Piston API — throttled per-user to
// prevent one account from hammering a shared third-party service.
export const compilerRunLimiter = new SimpleRateLimiter(20, 60000);
export const missionValidateLimiter = new SimpleRateLimiter(20, 60000);

if (typeof setInterval !== "undefined") {
    setInterval(() => {
        checkUserLimiter.sweep();
        registerLimiter.sweep();
        forgotPasswordLimiter.sweep();
        resetPasswordLimiter.sweep();
        loginFailedLimiter.sweep();
        compilerRunLimiter.sweep();
        missionValidateLimiter.sweep();
    }, 5 * 60000);
}
