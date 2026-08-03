import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Code2, Flame, Radar, ShieldCheck } from "lucide-react"
import { db, safeDbQuery } from "@/lib/db"
import { ProfileMenu } from "./layout/ProfileMenu"
import { NavBackButton } from "./layout/NavBackButton"
import { MobileNav } from "./layout/MobileNav"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"

export default async function Navbar() {
    const session = await getServerSession(authOptions)

    let userStats: { name: string | null; email: string | null; auraPoints: number; auraLevel: number; comboStreak: number } | null = null

    if (session?.user?.email) {
        userStats = await safeDbQuery(
            async () => {
                let dbUser = await db.user.findUnique({
                    where: { email: session.user!.email! },
                    select: { id: true, name: true, email: true, auraPoints: true, auraLevel: true, comboStreak: true },
                })

                // Defensive handling: auto-create missing user for orphaned sessions
                if (!dbUser) {
                    dbUser = await db.user.create({
                        data: {
                            email: session.user!.email!,
                            name: session.user!.name || "Agent",
                            auraPoints: 0,
                            auraLevel: 1,
                        },
                        select: { id: true, name: true, email: true, auraPoints: true, auraLevel: true, comboStreak: true },
                    })
                }

                return dbUser
            },
            null,
            "Navbar"
        )
    }

    const rank = userStats ? calculateAgentRank(userStats.auraPoints) : null
    const rankStyles = rank ? getRankBadgeStyles(rank) : null

    const navLink =
        "text-[13px] font-medium text-muted hover:text-text hover:bg-surface transition-all px-3 py-1.5 rounded-md border border-transparent hover:border-border"

    return (
        <header className="sticky top-0 z-50">
            {/* Gamification strip (always visible when authed) */}
            {session && userStats && (
                <div className="bg-bg border-b border-border px-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between h-9 font-mono text-[11px]">
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 text-muted">
                                <Radar className="size-3.5 text-accent" />
                                <span className="hidden sm:inline">STATUS</span>
                                <span className="inline-flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-accent animate-pulse" />
                                    <span className="text-accent">ONLINE</span>
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="size-3.5" />
                                <span className="text-muted">CLEARANCE</span>
                                <span className={`font-semibold uppercase tracking-wider ${rankStyles?.colorText}`}>{rank}</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="inline-flex items-center gap-1.5 text-muted">
                                <span>LVL</span>
                                <span className="text-text">{userStats.auraLevel}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-muted">
                                <span>AP</span>
                                <span className="text-accent font-bold">{userStats.auraPoints}</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-muted">
                                <Flame className={`size-3.5 ${(userStats.comboStreak ?? 0) > 0 ? "text-amber-400" : ""}`} />
                                <span className={`${(userStats.comboStreak ?? 0) > 0 ? "text-amber-400 font-bold" : ""}`}>{userStats.comboStreak ?? 0}</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <nav className="border-b border-border bg-bg/90 backdrop-blur-sm h-14">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                    <div className="flex justify-between h-full items-center">
                        <div className="flex items-center">
                            <Link href="/" className="flex items-center gap-x-2 group">
                                <div className="relative size-9 rounded-lg bg-surface border border-border flex items-center justify-center group-hover:border-accent/40 transition-colors">
                                    <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-accent"></span>
                                    <span className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-accent"></span>
                                    <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-accent"></span>
                                    <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-accent"></span>
                                    <Code2 className="size-5 text-accent" />
                                </div>
                                <span className="text-lg font-semibold tracking-tight text-text hidden sm:block">
                                    Code <span className="text-accent">Undercover</span>
                                </span>
                            </Link>
                            <NavBackButton />
                        </div>

                        {/* Desktop Navigation - hidden on mobile */}
                        <div className="hidden md:flex items-center gap-x-1">
                            {session && userStats ? (
                                <>
                                    <Link href="/dashboard" className={navLink}>
                                        Dashboard
                                    </Link>

                                    <Link href="/daily-tasks" className={`${navLink} relative flex items-center gap-1.5`}>
                                        <span>Daily</span>
                                        <span className="relative flex size-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                                            <span className="relative inline-flex rounded-full size-2 bg-accent"></span>
                                        </span>
                                    </Link>

                                    <Link href="/levels" className={navLink}>
                                        Sectors
                                    </Link>
                                    <Link href="/leaderboard" className={navLink}>
                                        Leaderboard
                                    </Link>
                                    <Link href="/debug-lab" className={navLink}>
                                        Lab
                                    </Link>
                                    <Link href="/history" className={navLink}>
                                        History
                                    </Link>
                                    <ProfileMenu
                                        user={{
                                            name: userStats.name ?? "Agent",
                                            email: userStats.email ?? "",
                                            auraPoints: userStats.auraPoints,
                                            auraLevel: userStats.auraLevel,
                                        }}
                                        completedMissions={0}
                                    />
                                </>
                            ) : session ? (
                                /* Session exists but DB is down — show basic nav without crashing */
                                <>
                                    <Link href="/dashboard" className={navLink}>
                                        Dashboard
                                    </Link>
                                    <Link href="/debug-lab" className={navLink}>
                                        Lab
                                    </Link>
                                    <span className="text-sm font-mono text-amber-400">
                                        ⚠ DB Offline
                                    </span>
                                </>
                            ) : (
                                <>
                                    <Link href="/login" className="text-muted hover:text-text px-3 py-2 rounded-md text-sm font-medium transition-colors">
                                        Log in
                                    </Link>
                                    <Link href="/register" className="bg-accent hover:opacity-90 text-accent-fg px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                        Start Free
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile Navigation */}
                        <MobileNav isAuthenticated={!!(session && userStats)}>
                            {session && userStats && (
                                <ProfileMenu
                                    user={{
                                        name: userStats.name ?? "Agent",
                                        email: userStats.email ?? "",
                                        auraPoints: userStats.auraPoints,
                                        auraLevel: userStats.auraLevel,
                                    }}
                                    completedMissions={0}
                                />
                            )}
                        </MobileNav>
                    </div>
                </div>
            </nav>
        </header>
    )
}
