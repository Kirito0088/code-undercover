# ADR-004: Fail-Fast Circuit Breaker with Kid-Friendly Fallback Payload

## Status
Accepted (supersedes an earlier draft decision favoring synchronous inline retries)

## Context
Ollama runs self-hosted on an Oracle Cloud Always Free ARM instance, serving a quantized
`qwen2.5-coder-platypus:3b` model. This is a genuinely fragile compute environment: cold
starts, OOM kills under load, and CPU throttling are expected, not edge cases. A cache miss
that hits this infrastructure needs a defined failure behavior, or the `Loading` state can
hang indefinitely.

An earlier draft of this decision proposed 2-3 synchronous inline retries within the same
request before falling back. That approach was rejected: the app is deployed on Vercel
(serverless), where stacking multiple sequential Ollama attempts inside one request risks
hitting platform request-timeout limits (504 Gateway Timeout) and compounds load on an
already-struggling free-tier ARM instance during exactly the moments it's least able to
handle it.

## Decision
The Ollama fetch in `route.ts` makes **exactly one attempt**, wrapped in an `AbortController`
with a strict 8000ms timeout. No inline retries.

The JSON response is strictly validated against the `{"explanation": string, "direct_fix":
string}` schema. Any deviation (malformed JSON, markdown wrapping, missing fields) is treated
as a parse failure, not silently coerced.

On timeout, unreachable server, or schema validation failure, the API route catches the
error and returns a **200 OK** (not a 5xx) with a safe, kid-friendly fallback payload:
```json
{"explanation": "Platypus's brain is a little overloaded right now! Try fixing one obvious syntax error and compiling again.", "direct_fix": ""}
```
No row is written to `CompilerErrorCache` on failure.

## Consequences
- Bounded worst-case latency per request (~8s), safe under Vercel's function timeout limits.
- Returning 200 OK with a fallback payload (rather than a 4xx/5xx) means the frontend Reveal
  Friction state machine doesn't need special-case error-state UI — the fallback payload
  flows through `Loading → Default Explanation` exactly like a real explanation would,
  keeping the student experience uninterrupted.
- No cache pollution: a transient Ollama failure never gets permanently baked into
  `CompilerErrorCache`, so the very next student (or the same student re-triggering) gets a
  fresh attempt.
- Known tradeoff: during a sustained outage, every student hitting a *novel* error signature
  independently pays the full ~8s timeout, and no student's failed attempt short-circuits the
  wait for others hitting the same novel error concurrently. No retry-storm risk, since there
  are no retries — but also no shared circuit-breaker state across requests. Acceptable for a
  single self-hosted free-tier instance; can be revisited with a shared `status` flag or edge
  cache if outage frequency in production data justifies it.
