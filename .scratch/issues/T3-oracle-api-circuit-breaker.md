# T3 — Oracle Server API & Circuit Breaker

**Blocked by:** T1, T2
**Blocks:** T5
**ADRs:** [ADR-002](../docs/adr/0002-global-error-line-hashing.md), [ADR-004](../docs/adr/0004-ollama-failure-handling.md)

## Goal

The Phase B seam: a single API route that takes a Root Error, returns an Explanation, and
never hangs, never 5xxs, and never leaks `directFix` to a non-premium caller.

> **Depends on OPEN-1** ([board README](./README.md#open-questions)) — whether the existing
> static `lib/compilerExplanation.ts` map short-circuits the AI path. Resolve before starting.

## Files touched

| File | Change |
|---|---|
| `app/api/compiler/explain/route.ts` | **New.** The POST handler |
| `lib/ollama.ts` | **New.** SLM client, prompt construction, schema validation |
| `lib/ollama.test.ts` | **New.** |
| `lib/explainService.ts` | **New.** Cache-lookup → generate → persist orchestration |
| `lib/explainService.test.ts` | **New.** |
| `lib/validation/explainRequest.ts` | **New.** Zod schema for the request body |
| `lib/env-validation.ts` | Add `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

## Request / response contract

```ts
// POST /api/compiler/explain
// Request
{
  rootErrorMessage: string   // 1..2000 chars
  brokenLineContent: string  // 0..1000 chars
  errorType?: string         // CompilerErrorType hint, for prompt context
}

// Response — ALWAYS 200 OK for any SLM-side failure
{
  explanation: string
  directFix: string | null   // null when caller is not premium (T6 enforces)
  source: "cache" | "generated" | "fallback"
}
```

`source` exists for observability and for T5's minimum-delay logic. **400** is still returned
for a malformed request body — the always-200 rule applies to *SLM failure*, not to caller
error.

## Orchestration (`lib/explainService.ts`)

```
computeErrorHash(msg, line)            [T1]
  → CompilerErrorCache.findUnique
      → HIT:  increment hitCount, return { ...row, source: "cache" }
      → MISS: callOllama()
                → SUCCESS + schema-valid: persist row, return source: "generated"
                → FAILURE:                return FALLBACK, persist NOTHING
```

## Circuit breaker (binding — ADR-004)

- **Exactly one** fetch attempt. No retries, no backoff loop.
- Wrapped in `AbortController` with an **8000ms** timeout.
- Response validated against a strict Zod schema: `{ explanation: string, direct_fix: string }`.
  Extra keys rejected. Markdown-fenced JSON rejected (do **not** attempt to unwrap — treat
  as failure; an SLM that can't follow the schema can't be trusted on content either).
- Any of {timeout, network error, non-2xx, invalid JSON, schema mismatch} →
  return the Fallback Explanation and write **nothing** to the cache.

```ts
export const FALLBACK_EXPLANATION = {
  explanation: "Platypus's brain is a little overloaded right now! Try fixing one obvious syntax error and compiling again.",
  directFix: "",
} as const
```

## Prompt constraints

The system prompt must enforce, and the validator must check:
- Explanation ≤ **3 sentences**, plain English, no jargon (audience: ages 13–18).
- Output is raw JSON only — no prose, no markdown fence.

> A response whose `explanation` exceeds 3 sentences is a **schema failure** → fallback.
> Do not silently truncate; a truncated explanation mid-sentence is worse than the fallback.

## Verification criteria (TDD)

**`lib/ollama.test.ts`** — mock `fetch`:

1. Valid response → parsed object returned.
2. **Timeout** — `fetch` never resolves; assert abort fires at ~8000ms and fallback returns.
   *(use fake timers; do not sleep 8s in the suite)*
3. Non-2xx (500, 503) → fallback.
4. Network rejection → fallback.
5. Malformed JSON → fallback.
6. Schema mismatch (missing `direct_fix`) → fallback.
7. Markdown-fenced JSON → fallback (explicitly **not** unwrapped).
8. 4-sentence explanation → fallback (not truncated).
9. **Exactly one** `fetch` call in every failure case — asserts no retries.

**`lib/explainService.test.ts`** — mock Prisma:

10. Cache hit → **zero** `fetch` calls; `hitCount` incremented; `source: "cache"`.
11. Cache miss + success → row persisted; `source: "generated"`.
12. Cache miss + failure → **no** row written; `source: "fallback"`.
13. Two concurrent identical misses → unique-constraint violation is handled, not thrown
    (upsert or catch-and-reread).

**Route tests:**

14. Malformed body → **400**.
15. SLM down → **200** with fallback payload.
16. Oversized `rootErrorMessage` (>2000 chars) → **400**.

## Definition of done

- [ ] OPEN-1 resolved and reflected in the implementation
- [ ] Route **never** returns 5xx for an SLM-side failure
- [ ] Worst-case route latency bounded at ~8s, verified under Vercel's function timeout
- [ ] All 16 test cases pass
- [ ] No `directFix` gating logic here yet — that is T6's seam
