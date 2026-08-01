import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db, safeDbQuery } from "@/lib/db"
import { 
    Trophy, Shield, ChevronLeft, ChevronRight,
    Crown, Flame, Zap, Medal, Bookmark, ChevronDown, Award,
    Search, LayoutDashboard, Users, Settings, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import CountdownTimer from "@/components/leaderboard/CountdownTimer"

// Force Next.js to render this page dynamically on every request (opts out of build-time caching)
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
    wins: number
    losses: number
    winrate: number
    kda: string
    rankTier: string
    image?: string | null
}

// Map real user properties into LeaderboardPlayer
function mapUserToPlayer(user: {
    id: string
    name: string | null
    username?: string | null
    auraPoints: number
    auraLevel: number
    foxBadges: number
    missionsCompleted: number
    image?: string | null
}): LeaderboardPlayer {
    const wins = user.missionsCompleted
    // Calculate losses based on auraPoints and level so it looks natural
    const losses = Math.max(1, user.auraLevel * 2 - user.missionsCompleted)
    const winrate = Math.round((wins / (wins + losses)) * 100) || 0
    
    // KDA can be a deterministic function of auraPoints
    const kda = ((user.auraPoints + 500) / 1000).toFixed(2)
    const rankTier = calculateAgentRank(user.auraPoints)

    return {
        id: user.id,
        name: user.name || user.username || "Agent",
        username: user.username ? `@${user.username}` : "@agent",
        auraPoints: user.auraPoints,
        auraLevel: user.auraLevel,
        foxBadges: user.foxBadges,
        missionsCompleted: user.missionsCompleted,
        wins,
        losses,
        winrate,
        kda,
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

    // Fetch database users
    const [, dbUsers] = await safeDbQuery<[number, Parameters<typeof mapUserToPlayer>[0][]]>(
        () => Promise.all([
            db.user.count(),
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

    // Map database users to LeaderboardPlayer
    const realPlayers = dbUsers.map(mapUserToPlayer)

    // Sort by auraPoints descending
    realPlayers.sort((a, b) => b.auraPoints - a.auraPoints)

    // Assign placement rank (1-indexed)
    const rankedPlayers = realPlayers.map((player, idx) => ({
        ...player,
        rank: idx + 1
    }))

    const totalUsers = rankedPlayers.length
    const totalPages = Math.ceil(totalUsers / limit)
    const paginatedPlayers = rankedPlayers.slice(skip, skip + limit)

    // Find current user player record for profile header display
    const loggedInPlayer = rankedPlayers.find(p => p.id === session.user.id) || 
        (dbUsers.find(u => u.id === session.user.id) ? mapUserToPlayer(dbUsers.find(u => u.id === session.user.id)!) : null)

    const showTop3 = page === 1
    const top3 = rankedPlayers.slice(0, 3)
    const tablePlayers = showTop3 ? paginatedPlayers.slice(3) : paginatedPlayers

    // Render avatar utility
    const renderAvatar = (player: LeaderboardPlayer, sizeClass = "size-8", initialsClass = "text-xs") => {
        if (player.image) {
            return (
                <img 
                    src={player.image} 
                    alt={player.name} 
                    className={`${sizeClass} rounded-full object-cover shrink-0 shadow-md`} 
                />
            )
        }
        const initials = player.name ? player.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "AG"
        // Return a circular div with beautiful gradients based on player id
        const gradientColors = "from-emerald-500 to-teal-600"
        return (
            <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradientColors} flex items-center justify-center ${initialsClass} font-bold text-white shrink-0 shadow-md`}>
                {initials}
            </div>
        )
    }

    return (
        <div className="flex-1 flex min-h-[calc(100vh-3.5rem)] bg-[#0F0F12] text-[#F1F1F5] font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[#1F1F26] bg-[#0F0F12] flex flex-col shrink-0 hidden lg:flex sticky top-14 h-[calc(100vh-3.5rem)] select-none">
                {/* Profile Card */}
                {loggedInPlayer && (
                    <div className="p-5 flex items-center gap-3 border-b border-[#1F1F26]">
                        {renderAvatar(loggedInPlayer, "size-10", "text-sm")}
                        <div className="overflow-hidden">
                            <div className="text-sm font-semibold text-[#F1F1F5] truncate leading-tight">
                                {loggedInPlayer.name}
                            </div>
                            <div className="text-xs text-[#8B8BA7] truncate mt-0.5 font-mono">
                                {loggedInPlayer.username}
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="p-4">
                    <div className="relative flex items-center bg-[#181820] border border-[#2B2B38] rounded-lg px-3 py-2 cursor-pointer hover:border-[#3C3C4E] transition-all">
                        <Search className="size-4 text-[#8B8BA7] mr-2 shrink-0" />
                        <span className="text-xs text-[#8B8BA7] flex-1">Search</span>
                        <kbd className="bg-[#2B2B38] text-[#8B8BA7] border border-[#3C3C4E] px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0">
                            ⌘K
                        </kbd>
                    </div>
                </div>

                {/* Navigation Menu */}
                <nav className="flex-1 px-3 space-y-1">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#181820] transition-colors"
                    >
                        <LayoutDashboard className="size-4" />
                        Dashboard
                    </Link>
                    <Link
                        href="/leaderboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#F1F1F5] bg-[#181820] font-medium"
                    >
                        <Users className="size-4 text-emerald-400" />
                        Clubs
                    </Link>

                    <div className="pt-6">
                        <div className="flex items-center justify-between px-3 mb-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-[#5C5C7A]">
                                Favorite clubs
                            </span>
                            <ChevronDown className="size-3 text-[#5C5C7A]" />
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] cursor-pointer hover:bg-[#181820]/40 transition-colors">
                                <div className="size-2 rounded-full bg-red-500" />
                                Top players
                            </div>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] cursor-pointer hover:bg-[#181820]/40 transition-colors">
                                <div className="size-2 rounded-full bg-blue-500" />
                                Lol academy
                            </div>
                            <div className="flex items-center gap-3 px-3 py-1.5 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] cursor-pointer hover:bg-[#181820]/40 transition-colors">
                                <div className="size-2 rounded-full bg-purple-500" />
                                Rampage
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Footer Section */}
                <div className="p-4 border-t border-[#1F1F26] space-y-4">
                    <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#181820] transition-colors"
                    >
                        <Settings className="size-4" />
                        Settings
                    </Link>

                    <button type="button" className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold shadow-md transition-colors">
                        <MessageSquare className="size-4 fill-white text-transparent" />
                        Invite Miko
                    </button>

                    <div className="pt-2 space-y-1">
                        <span className="block px-3 py-1 text-xs text-[#5C5C7A] hover:text-[#8B8BA7] cursor-pointer transition-colors">
                            Request feature
                        </span>
                        <span className="block px-3 py-1 text-xs text-[#5C5C7A] hover:text-[#8B8BA7] cursor-pointer transition-colors">
                            Get help
                        </span>
                        <span className="block px-3 py-1 text-xs text-[#5C5C7A] hover:text-[#8B8BA7] cursor-pointer transition-colors">
                            Report bug
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Area */}
            <main className="flex-1 bg-[#14141A] min-h-[calc(100vh-3.5rem)] flex flex-col overflow-y-auto">
                {/* Banner Section */}
                <section className="relative overflow-hidden bg-[#12121A] border-b border-[#252535] py-10 px-6 lg:px-8">
                    {/* Jinx Background Image Overlay */}
                    <div 
                        className="absolute inset-0 bg-cover bg-center opacity-[0.12] pointer-events-none mix-blend-luminosity"
                        style={{ backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Jinx_0.jpg')`, backgroundPosition: '50% 35%' }}
                    />
                    {/* Radial & linear fading gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#12121A] via-[#12121A]/70 to-[#12121A]/40 pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12121A] to-transparent pointer-events-none" />
                    
                    {/* Dev Grid Pattern Overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
                    
                    <div className="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                        {/* Club Meta Info */}
                        <div className="flex items-center gap-5">
                            {/* Orange Glowing Flame Logo */}
                            <div className="size-16 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-600 to-red-600 flex items-center justify-center shadow-lg shadow-amber-600/20 shrink-0 border border-amber-400/20">
                                <Flame className="size-8 text-white fill-white/10" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-[#F1F1F5] tracking-tight">
                                        Inside the fire
                                    </h1>
                                </div>
                                <p className="mt-1.5 text-xs md:text-sm text-[#8B8BA7] max-w-xl leading-relaxed">
                                    The League of Legends Discord server, in collaboration with Riot Games. Find the latest news and talk about games.
                                </p>
                                
                                {/* Actions under text */}
                                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                                    <button type="button" className="bg-[#1C1C24] border border-[#323242] p-2 rounded-lg text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors" title="Bookmark">
                                        <Bookmark className="size-4" />
                                    </button>
                                    <button type="button" className="bg-[#1C1C24] border border-[#323242] px-4 py-2 rounded-lg text-xs font-semibold text-[#F1F1F5] hover:bg-[#252530] transition-all">
                                        Upgrade my data
                                    </button>
                                    <button type="button" className="bg-[#1C1C24] border border-[#323242] px-4 py-2 rounded-lg text-xs font-semibold text-[#F1F1F5] hover:bg-[#252530] transition-all">
                                        Edit club
                                    </button>
                                    <button type="button" className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-md transition-all">
                                        Invite friends
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Resets Clock Box (Top Right style) */}
                        <div className="bg-[#14141A]/60 backdrop-blur-sm border border-[#2B2B38] px-4 py-3 rounded-xl flex items-center shrink-0">
                            <CountdownTimer />
                        </div>
                    </div>
                </section>

                {/* Main Content Area */}
                <div className="w-full px-6 lg:px-8 py-8 flex flex-col gap-6">
                    {/* Filter Bar */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#1C1C24]/60 border border-[#252532] px-6 py-4 rounded-2xl select-none w-full">
                        {/* Left Filters */}
                        <div className="flex items-center gap-1.5 bg-[#0F0F12] p-1 rounded-lg border border-[#252532]">
                            <button type="button" className="bg-[#1C1C24] text-white px-4 py-1.5 rounded-md text-xs font-semibold shadow-sm transition-all">
                                Rank
                            </button>
                            <button type="button" className="text-[#8B8BA7] hover:text-[#F1F1F5] px-4 py-1.5 rounded-md text-xs font-medium transition-all">
                                Win Rate
                            </button>
                            <button type="button" className="text-[#8B8BA7] hover:text-[#F1F1F5] px-4 py-1.5 rounded-md text-xs font-medium transition-all">
                                KDA
                            </button>
                        </div>

                        {/* Right Filters */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1 bg-[#0F0F12] p-1 rounded-lg border border-[#252532]">
                                <button type="button" className="text-[#8B8BA7] hover:text-[#F1F1F5] px-3 py-1.2 rounded text-[11px] font-medium transition-all">
                                    24h
                                </button>
                                <button type="button" className="text-[#8B8BA7] hover:text-[#F1F1F5] px-3 py-1.2 rounded text-[11px] font-medium transition-all">
                                    7D
                                </button>
                                <button type="button" className="text-[#8B8BA7] hover:text-[#F1F1F5] px-3 py-1.2 rounded text-[11px] font-medium transition-all">
                                    30D
                                </button>
                                <button type="button" className="bg-[#1C1C24] text-white px-3 py-1 rounded text-[11px] font-semibold transition-all">
                                    Seasonal
                                </button>
                            </div>

                            {/* Queue dropdown */}
                            <div className="flex items-center bg-[#1C1C24] border border-[#2B2B38] px-3 py-1.5 rounded-lg text-xs text-[#8B8BA7] font-semibold cursor-pointer hover:border-[#3C3C4E] transition-all">
                                Queue
                                <ChevronDown className="size-3 ml-2 text-[#8B8BA7]" />
                            </div>

                            {/* Show My Place Button */}
                            <button type="button" className="bg-[#1C1C24] border border-[#2B2B38] px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#F1F1F5] hover:bg-[#252530] transition-colors">
                                Show my place
                            </button>
                        </div>
                    </div>

                    {/* Top 3 Podium Cards */}
                    {showTop3 && top3.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {top3.map((player, idx) => {
                                const isFirst = idx === 0
                                const isSecond = idx === 1
                                const isThird = idx === 2

                                // Trophy colors & sizes
                                let trophyColor = "text-yellow-400"
                                let trophyGlow = "drop-shadow-[0_0_10px_rgba(250,204,21,0.4)]"
                                if (isSecond) {
                                    trophyColor = "text-gray-300"
                                    trophyGlow = "drop-shadow-[0_0_10px_rgba(209,213,219,0.3)]"
                                } else if (isThird) {
                                    trophyColor = "text-amber-600"
                                    trophyGlow = "drop-shadow-[0_0_10px_rgba(217,119,6,0.3)]"
                                }

                                const rank = player.rankTier

                                return (
                                    <div 
                                        key={player.id} 
                                        className={`bg-[#1C1C24]/60 border border-[#252532] hover:border-[#323246] p-6 rounded-2xl relative overflow-hidden transition-all duration-300 group ${
                                            isFirst ? "bg-gradient-to-b from-[#1C1C24]/80 to-[#22222B]/30 border-emerald-500/10 hover:border-emerald-500/20" : ""
                                        }`}
                                    >
                                        {/* Trophy Icon */}
                                        <div className={`absolute top-5 right-5 ${trophyColor} ${trophyGlow}`}>
                                            <Trophy className="size-8 stroke-[1.5]" />
                                        </div>

                                        {/* User Details */}
                                        <div className="flex items-center gap-3.5 mb-5">
                                            {renderAvatar(player, "size-12", "text-sm font-bold")}
                                            <div>
                                                <h3 className="text-base font-bold text-[#F1F1F5] truncate max-w-[140px]">
                                                    {player.name}
                                                </h3>
                                                
                                                {/* Rank Badge */}
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    {getRankIcon(rank)}
                                                    <span className={`text-xs font-semibold ${getRankColorClass(rank)}`}>
                                                        {rank}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Statistics Grid */}
                                        <div className="grid grid-cols-3 gap-2 border-t border-[#252532]/60 pt-4 text-left">
                                            <div>
                                                <div className="text-[10px] text-[#5C5C7A] uppercase tracking-wider font-bold">
                                                    Lokal stats
                                                </div>
                                                <div className="text-xs font-bold text-[#F1F1F5] mt-1 font-mono">
                                                    {player.wins} - {player.losses}
                                                </div>
                                                <div className="w-10 h-0.5 bg-amber-500 rounded-full mt-1.5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-[#5C5C7A] uppercase tracking-wider font-bold">
                                                    Winrate
                                                </div>
                                                <div className="text-xs font-bold text-[#F1F1F5] mt-1 font-mono">
                                                    {player.winrate}%
                                                </div>
                                                <div className="w-10 h-0.5 bg-emerald-500 rounded-full mt-1.5" />
                                            </div>
                                            <div>
                                                <div className="text-[10px] text-[#5C5C7A] uppercase tracking-wider font-bold">
                                                    Kda
                                                </div>
                                                <div className="text-xs font-bold text-[#F1F1F5] mt-1 font-mono">
                                                    {player.kda}
                                                </div>
                                                <div className="w-10 h-0.5 bg-indigo-500 rounded-full mt-1.5" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Table Section */}
                    <div className="bg-[#1C1C24]/60 border border-[#252532] rounded-2xl overflow-hidden shadow-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-[#252535] bg-[#171720]/50 select-none text-[10px] uppercase font-bold tracking-wider text-[#5C5C7A]">
                                        <th className="px-6 py-4">Place</th>
                                        <th className="px-6 py-4">Player name</th>
                                        <th className="px-6 py-4">Lokal stats</th>
                                        <th className="px-6 py-4">Winrate</th>
                                        <th className="px-6 py-4">KDA</th>
                                        <th className="px-6 py-4">Rank</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#252532]/40">
                                    {tablePlayers.map((player) => {
                                        const rank = player.rankTier
                                        const winrateVal = player.winrate
                                        let barColor = "bg-[#10B981]" // Green
                                        if (winrateVal < 48) barColor = "bg-red-500"
                                        else if (winrateVal < 53) barColor = "bg-yellow-500"

                                        return (
                                            <tr 
                                                key={player.id} 
                                                className={`hover:bg-[#252532]/25 transition-colors group ${
                                                    player.id === session.user.id ? "bg-indigo-500/5 hover:bg-indigo-500/10" : ""
                                                }`}
                                            >
                                                {/* Place */}
                                                <td className="px-6 py-4 align-middle font-mono text-xs font-bold text-[#8B8BA7]">
                                                    {player.rank}
                                                </td>

                                                {/* Player name */}
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        {renderAvatar(player, "size-8", "text-xs")}
                                                        <div className="overflow-hidden">
                                                            <span className="font-semibold text-sm text-[#F1F1F5] block truncate leading-tight group-hover:text-indigo-400 transition-colors">
                                                                {player.name}
                                                            </span>
                                                            <span className="text-[10px] text-[#5C5C7A] font-mono block mt-0.5 truncate">
                                                                {player.username}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Lokal stats */}
                                                <td className="px-6 py-4 font-mono text-[#8B8BA7] text-xs align-middle">
                                                    {player.wins} - {player.losses}
                                                </td>

                                                {/* Winrate with colored underline bar */}
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="inline-block">
                                                        <span className="font-mono text-xs font-semibold text-[#F1F1F5]">
                                                            {player.winrate}%
                                                        </span>
                                                        <div className={`w-10 h-0.5 ${barColor} rounded-full mt-1`} />
                                                    </div>
                                                </td>

                                                {/* KDA */}
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="inline-block">
                                                        <span className="font-mono text-xs font-semibold text-[#8B8BA7]">
                                                            {player.kda}
                                                        </span>
                                                        <div className="w-10 h-0.5 bg-indigo-500 rounded-full mt-1" />
                                                    </div>
                                                </td>

                                                {/* Rank */}
                                                <td className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-2">
                                                        {getRankIcon(rank)}
                                                        <span className={`text-xs font-semibold ${getRankColorClass(rank)}`}>
                                                            {rank}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {tablePlayers.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-[#5C5C7A] font-mono text-xs">
                                                No matches recorded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-[#252535] px-6 py-4 bg-[#1A1A24]/40 select-none">
                                <div className="text-xs font-mono text-[#8B8BA7]">
                                    Page {page} of {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    {page > 1 && (
                                        <Link
                                            href={`/leaderboard?page=${page - 1}`}
                                            className="p-1.5 bg-[#1C1C24] border border-[#2B2B38] rounded-lg hover:bg-[#252530] text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors"
                                        >
                                            <ChevronLeft className="size-4" />
                                        </Link>
                                    )}
                                    {page < totalPages && (
                                        <Link
                                            href={`/leaderboard?page=${page + 1}`}
                                            className="p-1.5 bg-[#1C1C24] border border-[#2B2B38] rounded-lg hover:bg-[#252530] text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors"
                                        >
                                            <ChevronRight className="size-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
