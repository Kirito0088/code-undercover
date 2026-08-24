import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeDbQuery } from "@/lib/db"
import { ProfileMenu } from "./layout/ProfileMenu"
import { MobileNav } from "./layout/MobileNav"
import styles from "./Navbar.module.css"

import { cached, cacheKeys } from "@/lib/cache"

// Short enough that an aura change shows up on its own within half a minute
// even if an invalidation is missed, long enough that a burst of navigations
// costs one query instead of one per page.
const NAV_USER_TTL_SECONDS = 30

const NAV_TABS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/daily-challenges", label: "Daily Challenges" },
    { href: "/debug-lab", label: "Dev Lab" },
    { href: "/leaderboard", label: "Leaderboard" },
]

// Exact port — use verbatim .nav-tab from level-select CSS via Navbar.module.css
const TAB_CLASS = styles.navTab
const PROFILE_TAB_CLASS = styles.navTabProfile

export default async function Navbar() {
    const session = await getServerSession(authOptions)

    let userStats: { name: string | null; email: string | null; auraPoints: number; auraLevel: number; comboStreak: number } | null = null

    if (session?.user?.email) {
        // This runs in the root layout, so it is on the critical path of every
        // single navigation — the shell cannot render until it resolves. A short
        // TTL keeps switching cheap while bounding staleness to ~30s; writes that
        // change what's shown call invalidateUser() for an immediate refresh.
        userStats = await cached(
            cacheKeys.navUser(session.user.email),
            NAV_USER_TTL_SECONDS,
            () => safeDbQuery(
            async () => {
                let dbUser = await db.user.findUnique({
                    where: { email: session.user!.email! },
                    select: { id: true, name: true, email: true, auraPoints: true, auraLevel: true, comboStreak: true },
                })

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
        )
    }

    return (
        <header className={styles.navbar}>
            <div className={styles.grain} aria-hidden="true" />
            <div className={styles.inner}>
                <Link href="/" className={styles.brand}>
                    <span className={styles.brandMark}>&lt;&nbsp;&gt;</span>
                    <span className={styles.brandText}>CODE UNDERCOVER</span>
                </Link>

                <nav aria-label="Primary" className={`${styles.navLinks} hidden md:flex`}>
                {NAV_TABS.map((tab) => (
                    <Link key={tab.href} href={tab.href} className={TAB_CLASS}>
                        {tab.label}
                    </Link>
                ))}

                {/* Red Leather Tab: Profile */}
                <div className={`${TAB_CLASS} ${PROFILE_TAB_CLASS} flex items-center gap-1.5`}>
                    {/* the mockup's .profile-icon, not a lucide glyph */}
                    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true" className="shrink-0">
                        <path d="M12 2c-3 0-4.8 2-4.8 4.6C7.2 9.2 9 11 12 11s4.8-1.8 4.8-4.4C16.8 4 15 2 12 2z" fill="currentColor" />
                        <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
                    </svg>
                    {session && userStats ? (
                        <ProfileMenu
                            user={{
                                name: userStats.name ?? "Profile",
                                email: userStats.email ?? "",
                                auraPoints: userStats.auraPoints,
                                auraLevel: userStats.auraLevel,
                            }}
                            completedMissions={0}
                        />
                    ) : (
                        <Link href="/login" className="hover:underline">
                            Profile
                        </Link>
                    )}
                </div>
            </nav>

            {/* Mobile Navigation Dropdown */}
            <div className="relative ml-auto md:hidden flex items-center">
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
        </header>
    )
}
