# Backend endpoints the Android client needs

These are **not** part of the Android build. They are Next.js route handlers
that belong in the web app, staged here so the `android` branch stays
self-contained and `main` is untouched.

## Why they are needed

Most of the web app's *writes* already have REST routes, and the Android client
uses them unchanged. Its *reads* are the problem: the levels board, mission
detail, leaderboard and dashboard are React Server Components that query Prisma
directly and render HTML. There is no JSON for a native client to consume.

These four routes expose data the web app already computes. None of them change
existing behaviour, and no existing file is modified.

| Route | Method | Serves |
|---|---|---|
| `/api/missions` | GET | Levels board — `getDashboardMissions`, with LOCKED/ACTIVE/COMPLETED status |
| `/api/missions/[missionId]` | GET | Mission content + this user's phase, hints used and last submission |
| `/api/leaderboard` | GET | Standings, paginated |
| `/api/dashboard` | GET | The caller's own aura, level, streak and badge counts |

## Applying them

Copy the tree into the web app repo — the paths already match:

```
server-endpoints/app/api/missions/route.ts              → app/api/missions/route.ts
server-endpoints/app/api/missions/[missionId]/route.ts  → app/api/missions/[missionId]/route.ts
server-endpoints/app/api/leaderboard/route.ts           → app/api/leaderboard/route.ts
server-endpoints/app/api/dashboard/route.ts             → app/api/dashboard/route.ts
```

Do this on a branch off `main` and open a PR — do not commit them to `main`
directly, and do not merge the `android` branch into `main` (it has unrelated
history and an Android project at its root).

## Security notes

These were written to match the guarantees the existing routes already make:

- **Auth on every route.** `getServerSession` first; 401 otherwise.
- **`/api/missions/[missionId]` gates on `canAccessMission`**, the same check
  `hint`, `phase` and `validate` use. Without it the endpoint would leak
  teaching material and MCQ answers for missions the agent has not unlocked.
- **`validationRules` is never returned.** It holds the required output and
  keywords a submission is graded against. The web client is not given it
  either.
- **`/api/dashboard` is self-scoped.** It reads the session user's row and takes
  no user id parameter, so it cannot be used to enumerate other accounts.
- **Rate limited** with the existing limiters (`missionActionLimiter`,
  `profileLimiter`).

## Verification status

**These have not been compiled or run.** The `android` branch has no Node
toolchain, no `node_modules` and no `tsconfig`, so nothing here has been type
checked. They are written against the interfaces in `main` as of `1cbdea4`:

- `getDashboardMissions`, `canAccessMission`, `getMissionById` from
  `services/mission.service.ts`
- `db`, `safeDbQuery` from `lib/db.ts`
- `calculateAgentRank` from `lib/aura.ts`
- `missionActionLimiter`, `profileLimiter` from `lib/rate-limit.ts`

Run `npm run lint` and `npx tsc --noEmit` after copying them in. The dynamic
route uses the `params: Promise<...>` signature that Next 15+ requires, matching
how `app/leaderboard/page.tsx` already awaits `searchParams`.

## Client expectations

The Android repositories that call these live in
`app/src/main/java/com/example/codeundercover_1/data/repo/`, and the response
shapes they decode are in `data/model/Models.kt`. `MissionSummary`,
`MissionDetail`, `LeaderboardPlayer` and `AgentStats` are the contracts to keep
in step.
