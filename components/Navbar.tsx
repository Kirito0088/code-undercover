import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { Code } from "lucide-react"
import { db } from "@/lib/db"
import { ProfileMenu } from "./layout/ProfileMenu"
import { NavBackButton } from "./layout/NavBackButton"

export default async function Navbar() {
    const session = await getServerSession(authOptions)

    let userStats: { name: string | null; email: string | null; xp: number; level: number } | null = null
    let completedCount = 0

    if (session?.user?.id) {
        userStats = await db.user.findUnique({
            where: { id: session.user.id },
            select: { name: true, email: true, xp: true, level: true },
        })
        completedCount = await db.userMission.count({
            where: { userId: session.user.id, status: "COMPLETED" },
        })
    }

    return (
        <nav className="border-b border-gray-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Code className="h-8 w-8 text-green-500" />
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-600 hidden sm:block">
                                Code Undercover
                            </span>
                        </Link>
                        <NavBackButton />
                    </div>

                    <div className="flex items-center space-x-4">
                        {session && userStats ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Dashboard
                                </Link>
                                <ProfileMenu
                                    user={{
                                        name: userStats.name,
                                        email: userStats.email,
                                        xp: userStats.xp,
                                        level: userStats.level,
                                    }}
                                    completedMissions={completedCount}
                                />
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href="/register"
                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(22,163,74,0.5)]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
