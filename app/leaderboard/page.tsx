import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { Trophy, Shield, Cpu, ChevronLeft, ChevronRight, Award, AlertTriangle } from "lucide-react"
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

    type LeaderboardUser = {
        id: string
        name: string | null
        email: string | null
        auraPoints: number
        auraLevel: number
        foxBadges: number
        missionsCompleted: number
    }

    const [totalUsers, users] = await safeDbQuery<[number, LeaderboardUser[]]>(
        () => Promise.all([
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
        ]),
        [0, []],
        "LeaderboardPage"
    )

    const totalPages = Math.ceil(totalUsers / limit)

    return (
        <div className="flex-1 bg-[#14141A] py-8 min-h-[calc(100vh-4rem)]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div className="flex items-center gap-3">
                        <Trophy className="size-8 text-indigo-400" />
                        <div>
                            <h1 className="text-2xl font-semibold text-[#F1F1F5] tracking-tight">Global Leaderboard</h1>
                            <p className="mt-1 text-xs text-[#8B8BA7]">
                                Leaderboard rankings by Aura Points
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard Table/List */}
                <div className="bg-[#1C1C24] border border-[#323242] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#22222B] border-b border-[#323242] text-xs text-[#8B8BA7]">
                                <tr>
                                    <th className="px-6 py-4 font-medium">RANK</th>
                                    <th className="px-6 py-4 font-medium">AGENT</th>
                                    <th className="px-6 py-4 font-medium">RANK TIER</th>
                                    <th className="px-6 py-4 font-medium text-right">AURA LVL</th>
                                    <th className="px-6 py-4 font-medium text-right">MISSIONS</th>
                                    <th className="px-6 py-4 font-medium text-right">INNOVATION</th>
                                    <th className="px-6 py-4 font-medium text-right text-indigo-400">AURA POINTS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#323242]/50">
                                {users.map((u, i) => {
                                    const rank = skip + i + 1
                                    const isCurrentUser = u.id === session.user.id

                                    return (
                                        <tr
                                            key={u.id}
                                            className={`transition-colors ${
                                                isCurrentUser
                                                    ? "bg-indigo-500/5 hover:bg-indigo-500/10"
                                                    : "hover:bg-[#2A2A35]/40"
                                            }`}
                                        >
                                            <td className="px-6 py-4 font-mono text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${rank === 1 ? "text-yellow-400" :
                                                        rank === 2 ? "text-gray-300" :
                                                            rank === 3 ? "text-amber-600" :
                                                                "text-[#5C5C7A]"
                                                        }`}>
                                                        #{rank}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-8 rounded bg-[#14141A] border flex items-center justify-center shrink-0 ${isCurrentUser ? "border-indigo-500/40" : "border-[#323242]"
                                                        }`}>
                                                        <Shield className={`size-4 ${isCurrentUser ? "text-indigo-400" : "text-[#5C5C7A]"}`} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-[#F1F1F5]">
                                                            {u.name || "Anonymous Learner"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-middle text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Award className={`size-4 ${getRankBadgeStyles(calculateAgentRank(u.auraPoints)).colorText}`} />
                                                    <span className={`font-medium ${getRankBadgeStyles(calculateAgentRank(u.auraPoints)).colorText}`}>
                                                        {calculateAgentRank(u.auraPoints)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle font-mono text-xs">
                                                <span className="inline-flex items-center gap-1.5 bg-[#14141A] border border-[#323242] px-2.5 py-1 rounded text-[#8B8BA7]">
                                                    <Cpu className="size-3 text-[#5C5C7A]" />
                                                    Lvl {u.auraLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle text-[#8B8BA7] font-mono text-sm">
                                                {u.missionsCompleted}
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle">
                                                {u.foxBadges > 0 ? (
                                                    <span className="inline-flex items-center gap-1.5 justify-end">
                                                        <span className="text-amber-500 font-semibold whitespace-nowrap text-sm font-mono">x{u.foxBadges}</span>
                                                        <Image src="/characters/fox.png" alt="Fox" width={20} height={20} className="object-contain" />
                                                    </span>
                                                ) : (
                                                    <span className="text-[#3A3A52] font-mono">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right align-middle font-mono">
                                                <span className="text-sm font-semibold text-indigo-400">
                                                    {u.auraPoints.toLocaleString()}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}

                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-[#5C5C7A] font-mono text-xs">
                                            No agents have completed missions yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-[#323242] px-6 py-4 bg-[#22222B]">
                            <div className="text-xs font-mono text-[#8B8BA7]">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/leaderboard?page=${page - 1}`}
                                        className="p-2 bg-[#1C1C24] border border-[#323242] rounded hover:bg-[#2A2A35] text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link
                                        href={`/leaderboard?page=${page + 1}`}
                                        className="p-2 bg-[#1C1C24] border border-[#323242] rounded hover:bg-[#2A2A35] text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors"
                                    >
                                        <ChevronRight className="size-4" />
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
