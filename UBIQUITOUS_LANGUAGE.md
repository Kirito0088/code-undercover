# Ubiquitous Language: Platypus AI Diagnostic Assistant

Canonical terms for this feature. Use these exact terms in code, comments, PR descriptions,
and tickets — not synonyms.

| Term | Definition | Not to be confused with |
|---|---|---|
| **Root Error** | The fatal GCC diagnostic with the lowest source line/column among `kind == "error"` entries in Judge0's `-fdiagnostics-format=json` output. A deterministic proxy for the causal root of an error cascade. | "first error" (ambiguous — could mean chronological emission order), "causal root" (implies real dependency analysis, which we don't do) |
| **Compiler Error Cache** | The `CompilerErrorCache` Prisma/Postgres table storing AI-generated `{explanation, direct_fix}` pairs, keyed by a normalized error+line hash. Global and cross-student. | a per-user cache, a Redis/in-memory cache |
| **Explanation** | The plain-English, ≤3-sentence, jargon-free description of why the Root Error occurred. Visible to all users. | "direct_fix", "hint" |
| **Direct Fix** | The concrete code-level fix for the Root Error. Generated alongside the Explanation but redacted server-side for non-premium users. | "explanation" |
| **Reveal Friction State Machine** | The four-stage UI progression: Hidden → Peeking → Loading → Default Explanation → (Premium Reveal). | a generic loading spinner — the friction is intentional pedagogy, not a technical necessity |
| **Peeking** | The state entered automatically the instant a fatal error is detected, before the student has requested an explanation. Represents "the answer is available, but try it yourself first." | "Loading" (Peeking involves zero network calls) |
| **Premium Reveal** | The state reached when a Premium user clicks "Reveal" and sees `direct_fix`. | the "Reveal" CTA itself, which renders for all users regardless of tier |
| **Debug Lab** | The `/debug-lab` route reached via the "Fixes" CTA. A distinct flow from the Reveal Friction State Machine. | the Reveal Friction explanation panel |
| **Premium User** | A NextAuth-authenticated user with premium entitlement, checked per-request at the API layer (never baked into cache rows). | "logged-in user" (all authenticated users are not necessarily premium) |
