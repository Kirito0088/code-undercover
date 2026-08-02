// Only what genuinely has no data source yet. Agent summary, Sector Alpha's real
// progress, and the mission list itself are all derived from real Prisma data in
// page.tsx — see the comments at each call site there.

// TODO: replace with real progress once Intermediate/Expert missions are tracked
// per-user (today only the "standard" mission type — Sector Alpha — is queried).
export const LOCKED_SECTOR_PLACEHOLDER = {
    missionsTotal: 5,
    missionsDone: 0,
    apEarned: 0,
} as const

export interface CommandPage {
    label: string
    href: string
}

// Static — these are the app's real top-level routes, not fetched data.
export const COMMAND_PAGES: CommandPage[] = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Daily Task", href: "/daily-tasks" },
    { label: "Debug Lab", href: "/debug-lab" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "History", href: "/history" },
    { label: "Settings", href: "/profile" },
]
