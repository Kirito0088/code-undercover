import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Trophy, Shield, Cpu, ChevronLeft, ChevronRight, Award } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"

export default async function LeaderboardPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        redirect("/login")
    }

    const resolvedParams = await searchParams
    const page = Number(resolvedParams.page) || 1
    const limit = 20
    const skip = (page - 1) * limit

    const [totalUsers, users] = await Promise.all([
        db.user.count(),
        db.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                auraPoints: true,
                auraLevel: true,
                foxBadges: true,
                missionsCompleted: true,
            },
            orderBy: { auraPoints: "desc" },
            take: limit,
            skip,
        }),
    ])

    const totalPages = Math.ceil(totalUsers / limit)

    return (
        <div className="flex-1 bg-black/40 py-10 min-h-[calc(100vh-4rem)]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <Trophy className="h-8 w-8 text-yellow-400" />
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Global Leaderboard</h1>
                            <p className="mt-1 text-sm text-gray-400 font-mono">
                                Top Operatives Ranked by Aura Points
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table/List */}
                <div className="bg-gray-950/80 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono">
                            <thead className="bg-gray-900 border-b border-gray-800 text-xs text-gray-400">
                                <tr>
                                    <th className="px-6 py-4 font-normal">RANK</th>
                                    <th className="px-6 py-4 font-normal">AGENT</th>
                                    <th className="px-6 py-4 font-normal">RANK TIER</th>
                                    <th className="px-6 py-4 font-normal text-right">AURA LVL</th>
                                    <th className="px-6 py-4 font-normal text-right">MISSIONS</th>
                                    <th className="px-6 py-4 font-normal text-right">INNOVATION</th>
                                    <th className="px-6 py-4 font-bold text-green-400 text-right">AURA POINTS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {users.map((u, i) => {
                                    const rank = skip + i + 1
                                    const isTop3 = rank <= 3
                                    const isCurrentUser = u.id === session.user.id

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`transition-colors hover:bg-gray-800/30 ${isCurrentUser ? "bg-green-900/10" : ""
                                                }`}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${rank === 1 ? "text-yellow-400" :
                                                        rank === 2 ? "text-gray-300" :
                                                            rank === 3 ? "text-amber-600" :
                                                                "text-gray-500"
                                                        }`}>
                                                        #{rank}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded bg-gray-900 border flex items-center justify-center shrink-0 ${isCurrentUser ? "border-green-500/50" : "border-gray-800"
                                                        }`}>
                                                        <Shield className={`h-4 w-4 ${isCurrentUser ? "text-green-500" : "text-gray-600"}`} />
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold ${isCurrentUser ? "text-green-400" : "text-gray-200"}`}>
                                                            {u.name || "Anonymous Operative"}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            {u.email?.split('@')[0]}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    <Award className={`h-4 w-4 ${getRankBadgeStyles(calculateAgentRank(u.auraPoints)).colorText} ${getRankBadgeStyles(calculateAgentRank(u.auraPoints)).shadow}`} />
                                                    <span className={`font-bold uppercase tracking-wider ${getRankBadgeStyles(calculateAgentRank(u.auraPoints)).colorText} ${getRankBadgeStyles(calculateAgentRank(u.auraPoints)).shadow}`}>
                                                        {calculateAgentRank(u.auraPoints)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="inline-flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded text-gray-300">
                                                        <Cpu className="h-3 w-3 text-gray-500" />
                                                        Lvl {u.auraLevel}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle text-gray-400">
                                                {u.missionsCompleted}
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                {u.foxBadges > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <span className="text-yellow-500 font-bold whitespace-nowrap">x{u.foxBadges}</span>
                                                        <Image src="/characters/fox.png" alt="Fox" width={20} height={20} className="object-contain" />
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-700">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                <span className="text-lg font-bold text-green-400 drop-shadow-[0_0_5px_rgba(74,222,128,0.2)]">
                                                    {u.auraPoints.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}

                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                            No agents have completed missions yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-800 px-6 py-4 bg-gray-900/50">
                            <div className="text-sm font-mono text-gray-400">
                                PAGE {page} OF {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/leaderboard?page=${page - 1}`}
                                        className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link
                                        href={`/leaderboard?page=${page + 1}`}
                                        className="p-2 bg-gray-800 rounded hover:bg-gray-700 text-gray-300 transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
