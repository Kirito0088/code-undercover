import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeDbQuery } from "@/lib/db"
import { ProfileMenu } from "./layout/ProfileMenu"
import { NavBackButton } from "./layout/NavBackButton"
import { MobileNav } from "./layout/MobileNav"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import { cached, cacheKeys } from "@/lib/cache"

// Short enough that an aura change shows up on its own within half a minute
// even if an invalidation is missed, long enough that a burst of navigations
// costs one query instead of one per page.
const NAV_USER_TTL_SECONDS = 30

const NAV_TABS = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/debug-lab", label: "Dev Lab" },
    { href: "/leaderboard", label: "Leaderboard" },
]

// The mockup's .nav-tab — a manila file tab hanging off the rail, with the
// little folder nub poking up above it. Rounded more at the bottom than the
// top, which is what makes it read as a tab rather than a button.
const TAB_CLASS =
    "relative rounded-[3px_3px_8px_8px] px-4 pt-[9px] pb-[7px] font-type text-[0.8rem] tracking-[0.5px] " +
    "text-[#1c1209] bg-[linear-gradient(180deg,#e0cf9f,#c9b47f_70%,#b89f6c)] " +
    "shadow-[0_3px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-3px_4px_rgba(0,0,0,0.12)] " +
    "transition-[transform,box-shadow,background] duration-150 " +
    "hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#f0cf8a,#c9a24b)] " +
    "hover:shadow-[0_5px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] " +
    "active:translate-y-px active:shadow-[0_2px_0_rgba(0,0,0,0.4)] " +
    "before:absolute before:-top-1.5 before:left-2.5 before:h-1.5 before:w-[18px] before:content-[''] " +
    "before:rounded-t-[3px] before:opacity-85 before:bg-[linear-gradient(180deg,#e0cf9f,#c9b47f)]"

const PROFILE_TAB_CLASS =
    "!text-[#ecdfc0] !bg-[linear-gradient(180deg,#a5453a,#7a2e28_70%,#5c1f19)] " +
    "hover:!bg-[linear-gradient(180deg,#b8574a,#a5453a)] " +
    "before:!bg-[linear-gradient(180deg,#a5453a,#7a2e28)]"

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

    const rank = userStats ? calculateAgentRank(userStats.auraPoints) : null
    const rankStyles = rank ? getRankBadgeStyles(rank) : null

    return (
        // Mahogany desk rail with brass fittings — the mockup's .navbar. The
        // grain is a repeating gradient over a dark wash; 68px is --nav-h,
        // which the clearance board centres its content against.
        <header
            className="relative flex h-[68px] items-center gap-4 sm:gap-6 px-4 sm:px-6 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.4)),repeating-linear-gradient(90deg,#3b2a1c_0px,#3b2a1c_2px,#1c1209_3px,#5a4029_4px,#3b2a1c_5px)] border-b-[3px] border-[var(--cm-nav-rule)] shadow-[0_2px_0_rgba(0,0,0,0.5),0_10px_22px_rgba(0,0,0,0.45)]"
            style={{ zIndex: "var(--z-chrome)" }}
        >
            {/* film grain over the wood */}
            <div className="pointer-events-none absolute inset-0 bg-grain opacity-50 mix-blend-overlay" aria-hidden="true" />

            {/* Nav Back Control */}
            <nav aria-label="History Navigation" className="relative flex overflow-hidden rounded-sm border border-black/30 bg-black/20">
                <NavBackButton />
            </nav>

            {/* Brand Title */}
            <Link href="/" className="relative font-type text-[17px] sm:text-[19px] tracking-[1.5px] text-[#f0cf8a] flex items-center gap-2 whitespace-nowrap hover:[text-shadow:0_0_14px_rgba(240,207,138,0.6)] transition-[text-shadow] duration-200">
                <span className="rounded-[3px] border border-[rgba(228,167,59,0.5)] px-1.5 py-0.5 font-courier font-bold text-[#e8a545] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                    &lt;&nbsp;&gt;
                </span>
                <span className="uppercase">CODE UNDERCOVER</span>
            </Link>

            {/* Navigation & Integrated Profile Tab */}
            <nav aria-label="Primary" className="relative ml-auto hidden md:flex items-center gap-2">
                {NAV_TABS.map((tab) => (
                    <Link key={tab.href} href={tab.href} className={TAB_CLASS}>
                        {tab.label}
                    </Link>
                ))}

                {/* Red Leather Tab: Profile */}
                <div className={`${TAB_CLASS} ${PROFILE_TAB_CLASS} flex items-center gap-1.5`}>
                    {/* the mockup's .profile-icon, not a lucide glyph */}
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="shrink-0">
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
        </header>
    )
}
