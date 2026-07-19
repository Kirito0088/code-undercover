interface LimiterRecord {
    count: number;
    resetTime: number;
}

export class SimpleRateLimiter {
    private cache = new Map<string, LimiterRecord>();
    private limit: number;
    private windowMs: number;

    constructor(limit: number, windowMs: number) {
        this.limit = limit;
        this.windowMs = windowMs;
    }

    public isRateLimited(key: string): boolean {
        const now = Date.now();
        
        // Lightweight cleanup of expired entries
        if (Math.random() < 0.01) {
            for (const [k, r] of this.cache.entries()) {
                if (now > r.resetTime) {
                    this.cache.delete(k);
                }
            }
        }

        const record = this.cache.get(key);

        if (!record || now > record.resetTime) {
            this.cache.set(key, {
                count: 1,
                resetTime: now + this.windowMs,
            });
            return false;
        }

        if (record.count >= this.limit) {
            return true;
        }

        record.count++;
        return false;
    }

    public check(key: string): boolean {
        const now = Date.now();
        const record = this.cache.get(key);
        if (!record || now > record.resetTime) {
            return false;
        }
        return record.count >= this.limit;
    }

    public increment(key: string): void {
        const now = Date.now();
        const record = this.cache.get(key);
        if (!record || now > record.resetTime) {
            this.cache.set(key, {
                count: 1,
                resetTime: now + this.windowMs,
            });
        } else {
            record.count++;
        }
    }
}

// Extract IP from a headers object (works for standard Headers, NextRequest, NextApiRequest headers, and next-auth request headers)
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

// 5 requests per 1 minute (60,000 ms) per IP.
// Note: In-memory store resets on serverless cold start / doesn't sync across multiple serverless instances.
// Upstash Redis rate limiting is the production-grade replacement once this is deployed at scale.
export const checkUserLimiter = new SimpleRateLimiter(5, 60000);
export const registerLimiter = new SimpleRateLimiter(5, 60000);
export const forgotPasswordLimiter = new SimpleRateLimiter(5, 60000);
export const resetPasswordLimiter = new SimpleRateLimiter(5, 60000);

// 10 failed login attempts per 15 minutes (900,000 ms) keyed by IP + email combo.
export const loginFailedLimiter = new SimpleRateLimiter(10, 900000);
