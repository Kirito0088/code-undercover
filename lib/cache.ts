// Shared read-through cache.
//
// Backed by Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are configured, and
// by an in-process Map otherwise — the same "Redis when available, degrade
// quietly" shape as lib/rate-limit.ts, so nothing has to branch at the call
// site and local dev works with no extra services.
//
// A cache is never allowed to break a page: every Redis call is wrapped, and
// any failure falls through to the origin function.

import { Redis } from "@upstash/redis"

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN

export const isRedisCache = Boolean(url && token)

const redis = isRedisCache ? new Redis({ url: url!, token: token! }) : null

if (!isRedisCache) {
    const isBuild = process.env.NEXT_PHASE === "phase-production-build"
    if (process.env.NODE_ENV === "production" && !isBuild) {
        throw new Error(
            "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production. " +
            "In-process cache is per-instance and gives no sharing across serverless invocations. See .env.example."
        )
    }
    console.warn(
        "[CACHE] UPSTASH_REDIS_REST_URL/TOKEN not set — using in-process cache. " +
        "Fine for local dev; per-instance only, so it gives no sharing across " +
        "serverless invocations in production."
    )
}

interface Entry {
    value: unknown
    expiresAt: number
}

// Survives HMR in dev, the same reason lib/db keeps Prisma on globalThis.
const globalForCache = globalThis as unknown as { __cuCache?: Map<string, Entry> }
const memory: Map<string, Entry> = globalForCache.__cuCache ?? new Map()
globalForCache.__cuCache = memory

/** Keeps the fallback from growing without bound if keys are high-cardinality. */
const MAX_ENTRIES = 1000

function memorySweep() {
    const now = Date.now()
    for (const [k, e] of memory) if (e.expiresAt <= now) memory.delete(k)
    if (memory.size > MAX_ENTRIES) {
        // oldest-inserted first; Map preserves insertion order
        const excess = memory.size - MAX_ENTRIES
        let i = 0
        for (const k of memory.keys()) {
            if (i++ >= excess) break
            memory.delete(k)
        }
    }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    if (redis) {
        try {
            // Upstash deserializes JSON values for us.
            return (await redis.get<T>(key)) ?? null
        } catch (error) {
            console.error(`[CACHE] get failed for ${key}:`, error)
            return null
        }
    }
    const entry = memory.get(key)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
        memory.delete(key)
        return null
    }
    return entry.value as T
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (redis) {
        try {
            await redis.set(key, value, { ex: ttlSeconds })
        } catch (error) {
            console.error(`[CACHE] set failed for ${key}:`, error)
        }
        return
    }
    memorySweep()
    memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

export async function cacheDelete(...keys: string[]): Promise<void> {
    if (!keys.length) return
    if (redis) {
        try {
            await redis.del(...keys)
        } catch (error) {
            console.error(`[CACHE] del failed:`, error)
        }
        return
    }
    for (const k of keys) memory.delete(k)
}

/**
 * Read-through: return the cached value, or run `fn`, store and return it.
 *
 * `null`/`undefined` results are deliberately not cached — they usually mean a
 * failed lookup, and pinning a miss for the whole TTL turns a transient blip
 * into a sustained outage.
 */
export async function cached<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>
): Promise<T> {
    const hit = await cacheGet<T>(key)
    if (hit !== null && hit !== undefined) return hit

    const value = await fn()
    if (value !== null && value !== undefined) {
        await cacheSet(key, value, ttlSeconds)
    }
    return value
}

// ─── Key builders, so producers and invalidators can't drift ───

export const cacheKeys = {
    /** the per-user record the navbar renders on every navigation */
    navUser: (email: string) => `nav:user:${email}`,
    /** the global mission list, identical for everyone */
    missions: () => "missions:all",
}

/** Call after any write that changes what the navbar or profile menu shows. */
export async function invalidateUser(email: string): Promise<void> {
    await cacheDelete(cacheKeys.navUser(email))
}
