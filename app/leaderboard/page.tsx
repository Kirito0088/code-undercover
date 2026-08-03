import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import {
    Trophy, ChevronLeft, ChevronRight,
    Crown, Flame, Zap, Medal, Award, Shield,
} from "lucide-react"
import Link from "next/link"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import CountdownTimer from "@/components/leaderboard/CountdownTimer"

export const dynamic = "force-dynamic"
export const revalidate = 0

interface LeaderboardPlayer {
    id: string
    name: string
    username: string
    auraPoints: number
    auraLevel: number
    foxBadges: number
    missionsCompleted: number
    completionPercent: number
    rankTier: string
    image?: string | null
}

function mapUserToPlayer(
    user: {
        id: string
        name: string | null
        username?: string | null
        auraPoints: number
        auraLevel: number
        foxBadges: number
        missionsCompleted: number
        image?: string | null
    },
    totalMissions: number
): LeaderboardPlayer {
    const rankTier = calculateAgentRank(user.auraPoints)
    const completionPercent = totalMissions > 0
        ? Math.round((user.missionsCompleted / totalMissions) * 100)
        : 0

    return {
        id: user.id,
        name: user.name || user.username || "Agent",
        username: user.username ? `@${user.username}` : "@agent",
        auraPoints: user.auraPoints,
        auraLevel: user.auraLevel,
        foxBadges: user.foxBadges,
        missionsCompleted: user.missionsCompleted,
        completionPercent,
        rankTier,
        image: user.image,
    }
}

function getRankIcon(rank: string) {
    switch (rank) {
        case "Platypus":
            return <Crown className="size-3.5 text-amber-400" />
        case "Fox":
            return <Crown className="size-3.5 text-orange-400" />
        case "Wolf":
            return <Flame className="size-3.5 text-red-400" />
        case "Chameleon":
            return <Zap className="size-3.5 text-purple-400" />
        case "Eagle":
            return <Trophy className="size-3.5 text-yellow-500" />
        case "Octopus":
            return <Trophy className="size-3.5 text-teal-400" />
        case "Raccoon":
            return <Medal className="size-3.5 text-gray-300" />
        case "Owl":
            return <Award className="size-3.5 text-amber-600" />
        case "Panda":
        default:
            return <Shield className="size-3.5 text-gray-500" />
    }
}

function getRankColorClass(rank: string): string {
    const styles = getRankBadgeStyles(rank)
    return styles.colorText
}

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

    const [totalMissions, dbUsers] = await safeDbQuery<[number, Parameters<typeof mapUserToPlayer>[0][]]>(
        () => Promise.all([
            db.mission.count(),
            db.user.findMany({
                select: {
                    id: true,
                    name: true,
                    username: true,
                    auraPoints: true,
                    auraLevel: true,
                    foxBadges: true,
                    missionsCompleted: true,
                    image: true,
                },
                orderBy: { auraPoints: "desc" },
            }),
        ]),
        [0, []],
        "LeaderboardPage.dbUsers"
    )

    const realPlayers = dbUsers.map((u) => mapUserToPlayer(u, totalMissions))
    realPlayers.sort((a, b) => b.auraPoints - a.auraPoints)

    const rankedPlayers = realPlayers.map((player, idx) => ({
        ...player,
        rank: idx + 1,
    }))

    const totalUsers = rankedPlayers.length
    const totalPages = Math.ceil(totalUsers / limit)
    const paginatedPlayers = rankedPlayers.slice(skip, skip + limit)

    const loggedInPlayer = rankedPlayers.find(p => p.id === session.user.id) ||
        (dbUsers.find(u => u.id === session.user.id) ? mapUserToPlayer(dbUsers.find(u => u.id === session.user.id)!, totalMissions) : null)

    const showTop3 = page === 1
    const top3 = rankedPlayers.slice(0, 3)
    const tablePlayers = showTop3 ? paginatedPlayers.slice(3) : paginatedPlayers

    const renderAvatar = (player: LeaderboardPlayer, sizeClass = "size-8", initialsClass = "text-xs") => {
        if (player.image) {
            return (
                <img
                    src={player.image}
                    alt={player.name}
                    className={`${sizeClass} rounded-full object-cover shrink-0`}
                />
            )
        }
        const initials = player.name ? player.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "AG"
        return (
            <div className={`${sizeClass} rounded-full bg-[#141516] border border-[#23252a] flex items-center justify-center ${initialsClass} font-bold text-[#f7f8f8] shrink-0`}>
                {initials}
            </div>
        )
    }

    return (
        <div className="flex-1 flex flex-col bg-[#010102] text-[#f7f8f8] min-h-[calc(100vh-3.5rem)]">
            {/* ─── Page Header ─── */}
            <section className="border-b border-[#23252a] bg-[#0f1011] px-6 lg:px-8 py-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <span className="inline-flex items-center gap-2 bg-[#141516] border border-[#23252a] text-[#8a8f98] text-xs px-3 py-1.5 rounded-md mb-4 font-mono tracking-wider">
                            <span className="size-1.5 rounded-full bg-[#5e6ad2]"></span>
                            LEADERBOARD
                        </span>
                        <h1 className="text-[56px] font-semibold tracking-[-1.8px] leading-[1.10] text-[#f7f8f8]">
                            Agent Rankings
                        </h1>
                        <p className="mt-2 text-[16px] text-[#8a8f98] max-w-lg leading-[1.5]">
                            The top operatives ranked by Aura Points. Climb the ranks through mission completion and flawless execution.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <CountdownTimer />
                        {loggedInPlayer && (
                            <Link href="/profile" className="bg-[#0f1011] text-[#f7f8f8] text-sm font-medium rounded-md px-3.5 py-2 border border-[#23252a] hover:bg-[#141516] transition-colors">
                                My Profile
                            </Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ─── Main Content ─── */}
            <main className="flex-1 max-w-7xl mx-auto px-6 lg:px-8 py-8 flex flex-col gap-8">
                {/* Top 3 Podium */}
                {showTop3 && top3.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {top3.map((player, idx) => {
                            const isFirst = idx === 0
                            const isSecond = idx === 1
                            const isThird = idx === 2

                            return (
                                <div
                                    key={player.id}
                                    className={`bg-[#0f1011] border border-[#23252a] rounded-xl p-6 text-left transition-all hover:border-[#23252a] hover:bg-[#141516] ${
                                        isFirst ? "md:order-2 border-[#5e6ad2]/30" : ""
                                    } ${isSecond ? "md:order-1" : ""} ${isThird ? "md:order-3" : ""}`}
                                >
                                    {/* Rank Badge */}
                                    <div className="flex items-center justify-center mb-4">
                                        <span className={`inline-flex items-center justify-center size-10 rounded-full border ${
                                            isFirst ? "bg-[#141516] border-amber-500/30 text-amber-400" :
                                            isSecond ? "bg-[#141516] border-gray-400/30 text-gray-300" :
                                            "bg-[#141516] border-amber-700/30 text-amber-600"
                                        }`}>
                                            {player.rank}
                                        </span>
                                    </div>

                                    {/* Avatar */}
                                    <div className="flex justify-center mb-4">
                                        {renderAvatar(player, "size-14", "text-base font-bold")}
                                    </div>

                                    {/* Name & Rank */}
                                    <div className="text-center mb-4">
                                        <h3 className="text-[22px] font-medium leading-[1.25] tracking-[-0.4px] font-medium text-[#f7f8f8] truncate">
                                            {player.name}
                                        </h3>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            {getRankIcon(player.rankTier)}
                                            <span className={`text-[12px] font-normal leading-[1.40] tracking-[0] font-semibold ${getRankColorClass(player.rankTier)}`}>
                                                {player.rankTier}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 border-t border-[#23252a] pt-4 text-center">
                                        <div>
                                            <div className="text-[12px] font-normal leading-[1.40] tracking-[0] text-[#62666d] uppercase tracking-wider">Missions</div>
                                            <div className="text-sm font-mono font-bold text-[#f7f8f8] mt-1">{player.missionsCompleted}</div>
                                        </div>
                                        <div>
                                            <div className="text-[12px] font-normal leading-[1.40] tracking-[0] text-[#62666d] uppercase tracking-wider">Completion</div>
                                            <div className="text-sm font-mono font-bold text-[#f7f8f8] mt-1">{player.completionPercent}%</div>
                                        </div>
                                        <div>
                                            <div className="text-[12px] font-normal leading-[1.40] tracking-[0] text-[#62666d] uppercase tracking-wider">Aura</div>
                                            <div className="text-sm font-mono font-bold text-[#5e6ad2] mt-1">{player.auraPoints}</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Table Section */}
                <div className="bg-[#0f1011] border border-[#23252a] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-[#23252a] bg-[#141516] select-none text-[12px] font-normal leading-[1.40] tracking-[0] uppercase font-semibold tracking-wider text-[#62666d]">
                                    <th className="px-6 py-4">Place</th>
                                    <th className="px-6 py-4">Agent</th>
                                    <th className="px-6 py-4">Missions</th>
                                    <th className="px-6 py-4">Completion</th>
                                    <th className="px-6 py-4">Aura</th>
                                    <th className="px-6 py-4">Rank</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#23252a]/40">
                                {tablePlayers.map((player) => {
                                    const rank = player.rankTier
                                    const isCurrentUser = player.id === session.user.id

                                    return (
                                        <tr
                                            key={player.id}
                                            className={`hover:bg-[#141516] transition-colors group ${
                                                isCurrentUser ? "bg-[#141516]/50" : ""
                                            }`}
                                        >
                                            <td className="px-6 py-4 align-middle font-mono text-[12px] font-normal leading-[1.40] tracking-[0] font-bold text-[#62666d]">
                                                {player.rank}
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-3">
                                                    {renderAvatar(player, "size-8", "text-xs")}
                                                    <div className="overflow-hidden">
                                                        <span className={`font-semibold text-sm text-[#f7f8f8] block truncate leading-tight group-hover:text-[#5e6ad2] transition-colors ${
                                                            isCurrentUser ? "text-[#5e6ad2]" : ""
                                                        }`}>
                                                            {player.name}
                                                        </span>
                                                        <span className="text-[12px] font-normal leading-[1.40] tracking-[0] text-[#62666d] font-mono block mt-0.5 truncate">
                                                            {player.username}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-[#8a8f98] text-sm align-middle">
                                                {player.missionsCompleted}
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className="font-mono text-sm font-semibold text-[#f7f8f8]">
                                                    {player.completionPercent}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <span className="font-mono text-sm font-semibold text-[#5e6ad2]">
                                                    {player.auraPoints}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-middle">
                                                <div className="flex items-center gap-2">
                                                    {getRankIcon(rank)}
                                                    <span className={`text-[12px] font-normal leading-[1.40] tracking-[0] font-semibold ${getRankColorClass(rank)}`}>
                                                        {rank}
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}

                                {tablePlayers.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-[#62666d] font-mono text-sm">
                                            No agents ranked yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-[#23252a] px-6 py-4 bg-[#141516]/40 select-none">
                            <div className="text-[12px] font-normal leading-[1.40] tracking-[0] font-mono text-[#62666d]">
                                Page {page} of {totalPages}
                            </div>
                            <div className="flex items-center gap-2">
                                {page > 1 && (
                                    <Link
                                        href={`/leaderboard?page=${page - 1}`}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#141516] border border-[#23252a] px-3 py-1.5 text-sm font-medium text-[#8a8f98] hover:text-[#f7f8f8] hover:border-[#23252a] transition-all"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </Link>
                                )}
                                {page < totalPages && (
                                    <Link
                                        href={`/leaderboard?page=${page + 1}`}
                                        className="inline-flex items-center justify-center gap-1.5 rounded-md bg-[#5e6ad2] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#828fff] transition-all"
                                    >
                                        Next
                                        <ChevronRight className="size-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}