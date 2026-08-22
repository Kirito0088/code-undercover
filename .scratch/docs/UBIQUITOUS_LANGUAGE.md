# Ubiquitous Language — Platypus AI Diagnostic Assistant

Canonical vocabulary. Use these exact terms in code identifiers, comments, commit messages,
PR titles, and tickets. Where a term has a code-level name, that name is binding.

## Core Terms

| Term | Code identifier | Meaning | Do not confuse with |
|---|---|---|---|
| **Root Error** | `RootError` | The fatal GCC diagnostic with the lowest source line/column among `kind == "error"` entries. Deterministic proxy for the causal root. | "first error" (ambiguous: emission order vs. source order); "causal root" (implies real dependency analysis we do not perform) |
| **Compiler Error Cache** | `CompilerErrorCache` | Postgres table of AI-generated diagnostics, global across all students, keyed by error signature. | a per-user cache; an in-memory or Redis cache |
| **Error Hash** | `errorHash` | `SHA-256(normalized(rootErrorMessage) + normalized(brokenLineContent))`. The cache key. | a hash of the whole program; a per-user key |
| **Explanation** | `explanation` | Plain-English, ≤3 sentences, jargon-free. Why the error happened. Shown to all tiers. | Direct Fix; "hint" (a separate pre-existing mission concept) |
| **Direct Fix** | `directFix` | The concrete code correction. Generated always, served only to premium. | Explanation |
| **Fallback Explanation** | `FALLBACK_EXPLANATION` | The kid-friendly stand-in served when the SLM fails or returns invalid output. `directFix` is empty. | an HTTP error response — failures are returned as `200 OK` |
| **Reveal Friction State Machine** | `RevealState` | `Hidden → Peeking → Loading → DefaultExplanation → PremiumReveal` | a loading spinner; the friction is deliberate pedagogy |
| **Peeking** | `RevealState.Peeking` | Auto-entered on fatal error detection. **Zero network calls.** The "try it yourself first" beat. | Loading (which does fetch) |
| **Premium Reveal** | `RevealState.PremiumReveal` | The state where `directFix` is displayed. Premium only. | the Reveal CTA, which renders for *all* users and routes free users to the upsell |
| **Premium Upsell Modal** | `PremiumUpsellModal` | What a free user sees on clicking Reveal. | a disabled or hidden button — the CTA is never hidden |
| **Debug Lab** | `/debug-lab` | Route reached via the "Fixes" CTA. A separate surface. | a state in the Reveal Friction State Machine |
| **Premium User** | `session.user.isPremium` | NextAuth user with premium entitlement, checked per request at the API boundary. | "logged-in user" — authentication ≠ entitlement |

## Phase Vocabulary

| Term | Meaning |
|---|---|
| **Phase A — Deterministic Extraction** | Judge0 GCC run with `-fdiagnostics-format=json`, Root Error selection, Monaco markers and gutter decals. No AI involved. Always runs. |
| **Phase B — On-Demand Fetch** | The student-triggered request to `/api/compiler/explain`. Cache lookup, then SLM generation on miss. Runs only on explicit student action. |

## Banned Phrasings

These appear in early drafts and should not survive into code or tickets:

- ~~"first error"~~ → **Root Error**
- ~~"AI hint"~~ / ~~"AI suggestion"~~ → **Explanation** or **Direct Fix** (they are distinct)
- ~~"loading state"~~ when referring to Peeking → **Peeking** (no fetch occurs)
- ~~"paywall"~~ → **Premium Upsell Modal** (the specific component) or **premium gating** (the mechanism)
- ~~"retry"~~ → there are no retries; see [ADR-004](./adr/0004-ollama-failure-handling.md)
