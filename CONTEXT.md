# Project Context

## Project Overview

**code-undercover** is a gamified platform for learning C programming. Users work through
a mission-based curriculum (spy/undercover-agent themed — "missions", "briefings",
"intel") that combines short teaching content, multiple-choice checks, and hands-on
coding challenges compiled and run against real test cases. Progress is tracked with
aura points, levels, combo streaks, badges, and a leaderboard to keep learners engaged.

## Architecture

Next.js 15 (App Router) full-stack app deployed on Vercel, backed by Postgres via Prisma
and using NextAuth for authentication. User-submitted C code is compiled/executed by a
self-hosted Judge0 instance (see `docker-compose.yml` / `judge0.conf.example`) rather than
run in-process.

- **`app/`** — Next.js App Router routes and pages
  - `(auth)/` — login, register, forgot/reset password flows (NextAuth-backed)
  - `api/` — route handlers: `auth`, `compiler` (code execution), `missions`,
    `daily-challenge`, `profile`, `ping`
  - `dashboard/`, `mission/`, `daily-tasks/`, `leaderboard/`, `levels/`, `history/`,
    `profile/`, `intro/`, `debug-lab/` — the main authenticated app surfaces
- **`components/`** — shared React components
- **`design-system/`** — reusable UI primitives/design tokens (see `DESIGN.md`)
- **`lib/`** — core logic: `auth.ts` (NextAuth config), `db.ts` (Prisma client),
  `compiler.ts` / `compilerExplanation.ts` (Judge0 integration), `aura.ts` (points/level
  logic), `rate-limit.ts` (Upstash Redis), `email.ts` (Resend), `validation/`,
  `errorClassifier.ts`, `passwordPolicy.ts`
- **`services/`** — higher-level service layer (e.g. `mission.service.ts`)
- **`prisma/`** — `schema.prisma`, migrations, and `seed.ts` for seeding missions/questions
- **`middleware.ts`** — edge-layer route guard (see the 3-layer auth-gating comment in the
  file itself: JWT check → `lib/auth.ts` session refresh → localStorage UI cache only)
- **`public/`** — static assets
- **`scripts/`** — maintenance/one-off scripts; **`scripts/ml/`** is the Python
  SLM pipeline (T7 dataset generation, T8 QLoRA fine-tune) with its own venv and
  README — see `scripts/ml/README.md`
- **`supabase/`** — Supabase-related config (if used alongside/instead of raw Postgres)

## Key Concepts: Platypus AI Diagnostic Assistant

- **Root Error** — the fatal GCC diagnostic (`kind == "error"`, not `note`/`warning`) with the
  lowest `locations[0].caret.line` (tie-broken by column) in the `-fdiagnostics-format=json`
  output. Used as a deterministic, cheap proxy for the true causal root of a cascade of
  compiler errors, on the assumption that most cascades in student C code stem from a single
  upstream AST break (unclosed brace, missing semicolon, etc.). Child diagnostics
  (`children` array) are discarded in favor of the parent. See `ADR-001`.
- **Compiler Error Cache** (`CompilerErrorCache` Prisma model) — a global, cross-student cache
  of AI-generated explanations, keyed by `SHA-256(normalized(rootErrorMessage) +
  normalized(brokenLineContent))`. Deliberately *not* keyed on the whole program or the user,
  so two students who trigger the same error on an equivalent line share one cache row. See
  `ADR-002`.
- **Explanation** — a plain-English, jargon-free, ≤3-sentence description of *why* the root
  error occurred, aimed at 8th–12th standard learners (ages 13–18). Visible to all users
  (free and premium) once generated.
- **Direct Fix** — a concrete code-level fix for the root error. Generated and stored
  alongside the Explanation in the *same* cache row (both fields are always generated
  together on a cache miss), but redacted from the API response for non-premium users at
  the route-handler layer. See `ADR-002`.
- **Reveal Friction State Machine** — the four-state UI sequence a student's error explanation
  passes through: `Hidden → Peeking → Loading → Default Explanation [→ Premium Reveal]`.
  - **Hidden**: default state on mount / after a fresh compile, before any error surfaces.
  - **Peeking**: automatic the instant Judge0 returns a fatal error; the student has *not*
    triggered any explanation fetch yet. This is intentional pedagogical friction — the
    student is expected to try reading the error themselves before asking the AI.
  - **Loading**: begins when the student clicks the prompt; a Framer Motion component
    enforces a minimum 500ms artificial delay even on a cache hit (~5ms), to preserve the
    "Platypus is thinking" feel.
  - **Default Explanation**: the Explanation is shown to all users once the API resolves.
  - **Premium Reveal**: reached only by Premium users clicking "Reveal"; Free users clicking
    the same CTA see a Premium Upsell Modal instead, since the CTA renders for everyone.
  See `ADR-003`.
- **Debug Lab** — the destination route (`/debug-lab`) a student is sent to via the "Fixes"
  CTA, independent of the Reveal Friction flow.
- **Premium User** — a NextAuth-authenticated user with premium status, entitled to see
  `direct_fix`. Entitlement is checked at the API layer per-request, not baked into the
  cache.

## Key Concepts

- **Mission** — a single unit of the curriculum: teaching content (slides), an MCQ check,
  then a coding phase, in that order (`UserMission.phase`: `TEACHING` → `MCQ` → `CODING`).
- **UserMission** — a user's progress on a given mission (`status`, `phase`, `hintsUsed`,
  `attemptCount`, `submittedCode`, timestamps).
- **Aura points / Aura level** — the XP/leveling system awarded for completing missions.
- **Combo streak** — consecutive-success streak tracking (`comboStreak`, `maxCombo`).
- **Daily challenge / DailyQuestion** — a daily quiz question separate from the main
  mission track.
- **Judge0** — the external code-execution engine that compiles and runs user-submitted C
  code against validation rules (`validationRules` JSON on `Mission`: required keywords,
  forbidden patterns, min length, required output).

## Development Workflow

### Prerequisites

- Node.js >= 20
- npm
- A Postgres database (Supabase or local via `docker-compose.yml`)
- A running Judge0 instance for code execution (`docker-compose.yml`,
  `judge0.conf.example`)

### Getting Started

```bash
# Install dependencies (also runs prisma generate when DATABASE_URL is a postgres URL)
npm install

# Start the development server (Turbopack)
npm run dev

# Run tests
npm test
npm run test:watch

# Lint
npm run lint

# Build for production
npm run build
```

### Database

```bash
# Generate the Prisma client
npm run db:generate

# Push schema + seed missions/questions (first-time setup)
npm run setup

# Seed only
npm run seed
```

Schema lives in `prisma/schema.prisma`; seed data (missions, daily questions) is defined
in `prisma/seed.ts`.

### Code execution (Judge0)

Local Judge0 stack is defined in `docker-compose.yml`. Copy `judge0.conf.example` to
`judge0.conf` and fill in real Postgres/Redis secrets (gitignored, like `.env`) before
running it — see the comments in that file for required keys.

### Deployment

Deployed on Vercel (Next.js). Environment variables (DB connection strings, NextAuth
secrets, Resend API key, Upstash Redis credentials, Judge0 endpoint) are managed via
`vercel env`.

## Conventions

- **Framework** — Next.js 15 App Router, React 19, TypeScript
- **Styling** — Tailwind CSS + a project-specific design system (`design-system/`,
  documented in `DESIGN.md`)
- **Auth** — NextAuth v4 with the Prisma adapter; JWT session strategy (see
  `middleware.ts` for the route-guard layering)
- **Testing** — Vitest + Testing Library (`*.test.ts(x)` colocated with source, e.g.
  `lib/aura.test.ts`, `app/(auth)/login/login.test.tsx`). The Python pipeline under
  `scripts/ml/` is the exception: pytest, run from its own venv
  (`scripts/ml/.venv/Scripts/python -m pytest scripts/ml/test_prompt_format.py -q`).
  `vitest.config.ts` excludes `**/.venv/**` so that venv's vendored JS tests aren't
  collected as repo tests.
- **ORM** — Prisma, pinned to `^5.22.0` across all scripts

## Known Issues or Quirks

- `postinstall` intentionally skips `prisma generate` unless running in CI, on Vercel, or
  against a `postgres://` `DATABASE_URL` — avoids failures on machines without a DB
  configured yet.
- Auth/onboarding (`hasSeenIntro`) is deliberately checked in three layers (JWT at the
  edge, DB-backed session refresh, and a non-authoritative localStorage cache) — see the
  comment block at the top of `middleware.ts` before changing any of them in isolation.
- Prisma CLI is invoked as `npx prisma@^5.22.0 ...` in scripts rather than relying on the
  local `prisma` devDependency resolution — keep versions in sync if this changes.

## Useful Links

- [GitHub Repository](https://github.com/Kirito0088/code-undercover)
- Design system reference: [`DESIGN.md`](./DESIGN.md)

## Contact & Maintainers

[TODO: Add maintainer contact info if this is shared with others]
