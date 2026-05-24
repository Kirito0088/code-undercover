import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Code } from "lucide-react"
import { db, safeDbQuery } from "@/lib/db"
import { ProfileMenu } from "./layout/ProfileMenu"
import { NavBackButton } from "./layout/NavBackButton"
import { MobileNav } from "./layout/MobileNav"

export default async function Navbar() {
    const session = await getServerSession(authOptions)

    let userStats: { name: string | null; email: string | null; auraPoints: number; auraLevel: number } | null = null

    if (session?.user?.email) {
        userStats = await safeDbQuery(
            async () => {
                let dbUser = await db.user.findUnique({
                    where: { email: session.user!.email! },
                    select: { id: true, name: true, email: true, auraPoints: true, auraLevel: true },
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
                        select: { id: true, name: true, email: true, auraPoints: true, auraLevel: true },
                    })
                }

                return dbUser
            },
            null,
            "Navbar"
        )
    }

    return (
        <nav className="border-b border-[#22222E] bg-[#0A0A0F]/90 backdrop-blur-sm sticky top-0 z-50 h-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
                <div className="flex justify-between h-full items-center">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Code className="h-8 w-8 text-indigo-400" />
                            <span className="text-xl font-semibold text-[#F1F1F5] hidden sm:block">
                                Code Undercover
                            </span>
                        </Link>
                        <NavBackButton />
                    </div>

                    {/* Desktop Navigation - hidden on mobile */}
                    <div className="hidden md:flex items-center space-x-4">
                        {session && userStats ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors px-3 py-1.5 rounded-md hover:bg-[#1C1C28]"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/debug-lab"
                                    className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors px-3 py-1.5 rounded-md hover:bg-[#1C1C28]"
                                >
                                    Debug Lab
                                </Link>
                                <Link
                                    href="/leaderboard"
                                    className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors px-3 py-1.5 rounded-md hover:bg-[#1C1C28]"
                                >
                                    Leaderboard
                                </Link>
                                <Link
                                    href="/history"
                                    className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors px-3 py-1.5 rounded-md hover:bg-[#1C1C28]"
                                >
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
                                <Link
                                    href="/dashboard"
                                    className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors px-3 py-1.5 rounded-md hover:bg-[#1C1C28]"
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/debug-lab"
                                    className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors px-3 py-1.5 rounded-md hover:bg-[#1C1C28]"
                                >
                                    Debug Lab
                                </Link>
                                <span className="text-sm font-mono text-yellow-400">
                                    ⚠ DB Offline
                                </span>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-[#8B8BA7] hover:text-[#F1F1F5] px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Register
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
    )
}
