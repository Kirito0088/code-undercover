import { Redis } from "@upstash/redis"

export interface RateLimitResult {
    success: boolean;
    remaining: number;
    retryAfterMs: number;
}

// Implemented by both the in-memory fallback and the Redis-backed limiter so
// every call site can use either interchangeably. Redis calls are real network
// requests, so callers must always `await` these — even the in-memory
// implementation, whose methods return plain values, which `await` resolves
// immediately.
export interface RateLimiter {
    check(key: string): Promise<RateLimitResult> | RateLimitResult;
    isRateLimited(key: string): Promise<boolean> | boolean;
    increment(key: string): Promise<void> | void;
    sweep(): void;
}

interface Bucket {
    count: number;
    resetAt: number;
}

export class SimpleRateLimiter implements RateLimiter {
    private hits = new Map<string, Bucket>();

    constructor(
        private readonly limit: number,
        private readonly windowMs: number
    ) {}

/**
 * Consume 1 request token from the bucket.
 * Returns { success, remaining, retryAfterMs }
 *
 * NOTE: This is an in-memory rate limiter. Under multiple instances or
 * container restarts, counters reset. For production at scale, replace
 * with a shared Redis-based limiter.
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

// Atomically increments the counter and sets its expiry on the first hit in
// a window. Plain INCR + PEXPIRE would leave a window where a crash between
// the two calls loses the TTL and makes the key permanent; wrapping both in
// one EVAL keeps them atomic even against concurrent requests from other
// instances (the whole reason to move off the in-memory Map).
const INCR_WITH_EXPIRE = `
local count = redis.call("INCR", KEYS[1])
if tonumber(count) == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {count, ttl}
`

export class RedisRateLimiter implements RateLimiter {
    constructor(
        private readonly redis: Redis,
        private readonly namespace: string,
        private readonly limit: number,
        private readonly windowMs: number
    ) {}

    private redisKey(key: string): string {
        return `ratelimit:${this.namespace}:${key}`;
    }

    public async check(key: string): Promise<RateLimitResult> {
        const [count, ttl] = (await this.redis.eval(
            INCR_WITH_EXPIRE,
            [this.redisKey(key)],
            [this.windowMs]
        )) as [number, number];

        if (count > this.limit) {
            return { success: false, remaining: 0, retryAfterMs: Math.max(ttl, 0) };
        }
        return { success: true, remaining: this.limit - count, retryAfterMs: 0 };
    }

    public async isRateLimited(key: string): Promise<boolean> {
        const count = await this.redis.get<number>(this.redisKey(key));
        return (count ?? 0) >= this.limit;
    }

    public async increment(key: string): Promise<void> {
        await this.redis.eval(INCR_WITH_EXPIRE, [this.redisKey(key)], [this.windowMs]);
    }

    /** No-op: Redis expires keys natively via PEXPIRE above. */
    public sweep(): void {}
}

const redis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
              url: process.env.UPSTASH_REDIS_REST_URL,
              token: process.env.UPSTASH_REDIS_REST_TOKEN,
          })
        : null;

if (!redis) {
    console.warn(
        "[RATE-LIMIT] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to in-memory " +
        "rate limiting. Fine for local dev; unsafe across multiple instances in production."
    );
}

function createLimiter(namespace: string, limit: number, windowMs: number): RateLimiter {
    return redis
        ? new RedisRateLimiter(redis, namespace, limit, windowMs)
        : new SimpleRateLimiter(limit, windowMs);
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
            // Multiple header instances carry the same left-to-right hop
            // order as a single comma-separated value — normalize to that.
            xForwardedFor = Array.isArray(rawFwd) ? rawFwd.join(",") : rawFwd;
        }
        const rawReal = record["x-real-ip"] || record["X-Real-IP"] || record["x-real-ip".toLowerCase()];
        if (rawReal) {
            xRealIp = Array.isArray(rawReal) ? rawReal[0] : rawReal;
        }
    }

    if (xForwardedFor) {
        // A single trusted reverse proxy (e.g. Render's edge) appends the IP
        // it actually observed to the END of this header. Everything before
        // that is whatever the client itself sent and must not be trusted —
        // taking the first hop would let anyone spoof their rate-limit key.
        const hops = xForwardedFor.split(",").map((h) => h.trim()).filter(Boolean);
        if (hops.length > 0) return hops[hops.length - 1];
    }
    if (xRealIp) {
        return xRealIp.trim();
    }

    return "127.0.0.1";
}

export const checkUserLimiter = createLimiter("checkUser", 30, 60000);
export const registerLimiter = createLimiter("register", 20, 60000);
export const forgotPasswordLimiter = createLimiter("forgotPassword", 10, 900000);
export const resetPasswordLimiter = createLimiter("resetPassword", 10, 900000);
export const loginFailedLimiter = createLimiter("loginFailed", 10, 900000);
// Compiler/validate proxy to the public Piston API — throttled per-user to
// prevent one account from hammering a shared third-party service.
export const compilerRunLimiter = createLimiter("compilerRun", 20, 60000);
export const missionValidateLimiter = createLimiter("missionValidate", 20, 60000);

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
