# T6 — Premium Routing & Auth Gating

**Blocked by:** T5
**Blocks:** —
**ADRs:** [ADR-002](../docs/adr/0002-global-error-line-hashing.md), [ADR-003](../docs/adr/0003-pedagogical-ui-friction.md)

## Goal

Close the loop: gate `directFix` behind premium entitlement at the **server** boundary, and
turn the Reveal CTA into the upsell funnel for free users.

> **This is the security-critical ticket.** ADR-002's guarantee holds only if redaction
> happens server-side. Everything else in this feature is recoverable; this is not.

## Files touched

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add premium fields to `User` |
| `prisma/migrations/` | New migration |
| `lib/auth.ts` | Surface `isPremium` on the JWT + session |
| `types/next-auth.d.ts` | Extend `Session["user"]` with `isPremium` |
| `lib/entitlements.ts` | **New.** `isPremiumUser(session)` — single source of truth |
| `app/api/compiler/explain/route.ts` | **Redact `directFix` before responding** |
| `components/platypus/RevealPanel.tsx` | Reveal CTA → fix or upsell modal |
| `components/platypus/PremiumUpsellModal.tsx` | **New.** |
| `components/platypus/FixesCta.tsx` | **New.** Routes to `/debug-lab` |

## Schema

```prisma
// User model additions
isPremium        Boolean   @default(false)
premiumUntil     DateTime?
```

`isPremiumUser()` returns `isPremium && (premiumUntil === null || premiumUntil > now)`.
Expiry is checked in one place, never inline at call sites.

## The redaction seam (binding — ADR-002)

In `app/api/compiler/explain/route.ts`, **after** `explainService` resolves and **before**
the response is serialized:

```ts
const premium = isPremiumUser(session)
return NextResponse.json({
  explanation: result.explanation,
  directFix: premium ? result.directFix : null,   // ← the entire security boundary
  source: result.source,
})
```

**Non-negotiable:** the full `directFix` string must **never** be serialized into a response
sent to a non-premium client. Not hidden with CSS, not `display:none`, not conditionally
rendered client-side from a fully-populated payload. Any of those are trivially defeated by
opening the network tab.

## CTA behavior (ADR-003)

The Reveal CTA renders **identically for every user** — never hidden, never disabled.

| User | Clicks "Reveal" | Result |
|---|---|---|
| Premium | → | `directFix` expands inline |
| Free | → | `PremiumUpsellModal` opens over the editor |
| Unauthenticated | → | `PremiumUpsellModal` (with a sign-in path) |

The separate **"Fixes"** CTA routes to `/debug-lab` for all users, unrelated to entitlement.

## Verification criteria (TDD)

**Server-side redaction — the load-bearing tests:**

1. Premium session → response body contains the real `directFix` string.
2. Free session → response body has `directFix: null`. **Assert on the raw serialized JSON**,
   not on a parsed component prop.
3. Unauthenticated → `directFix: null`.
4. Expired `premiumUntil` → treated as **free**; `directFix: null`.
5. `premiumUntil: null` + `isPremium: true` → treated as premium (no expiry = perpetual).
6. **Leak regression test:** free-user response, stringified, does **not** contain any
   substring of the cached `directFix`. This is the test that catches a future refactor
   re-introducing the leak.

**Entitlement unit tests (`lib/entitlements.test.ts`):**

7. `isPremium: false` → `false`, regardless of `premiumUntil`.
8. `isPremium: true`, `premiumUntil` in the future → `true`.
9. `isPremium: true`, `premiumUntil` in the past → `false`.
10. `session: null` → `false`, does not throw.

**Component:**

11. Free user: Reveal CTA **renders** (not hidden/disabled) and opens the upsell modal.
12. Premium user: Reveal CTA expands `directFix` inline.
13. "Fixes" CTA navigates to `/debug-lab` for both tiers.
14. Upsell modal is dismissible and returns focus to the CTA (a11y).

**Cache integrity:**

15. A free user triggering a cache **miss** still causes a row with a **populated**
    `directFix` to be written — the cache is user-agnostic (ADR-002). Redaction is a
    response-layer concern only, never a storage-layer one.

## Definition of done

- [ ] Test 6 (leak regression) passes — **blocking**
- [ ] Test 15 passes — cache stores `directFix` regardless of who triggered generation
- [ ] Zero client-side-only gating anywhere in the diff
- [ ] Reveal CTA never hidden or disabled for any tier
- [ ] Migration applies cleanly; existing users default to `isPremium: false`
- [ ] All 15 criteria pass
