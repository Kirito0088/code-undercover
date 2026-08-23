import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeDbQuery } from "@/lib/db"
import { calculateAgentRank } from "@/lib/aura"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/leaderboard?page=1&limit=20
 *
 * JSON form of the standings page. The mapping below is copied from
 * `mapUserToPlayer` in `app/leaderboard/page.tsx` — including the `@` prefix on
 * usernames and the rounded completion percentage — so the phone and the web
 * cannot show the same agent differently.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const page = Math.max(1, Number(searchParams.get("page")) || 1)
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
        const skip = (page - 1) * limit

        const [totalMissions, dbUsers] = await safeDbQuery(
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
            [0, []] as [number, Array<{
                id: string
                name: string | null
                username: string | null
                auraPoints: number
                auraLevel: number
                foxBadges: number
                missionsCompleted: number
                image: string | null
            }>],
            "leaderboard.GET"
        )

        const players = dbUsers.map((user) => ({
            id: user.id,
            name: user.name || user.username || "Agent",
            username: user.username ? `@${user.username}` : "@agent",
            auraPoints: user.auraPoints,
            auraLevel: user.auraLevel,
            foxBadges: user.foxBadges,
            missionsCompleted: user.missionsCompleted,
            completionPercent: totalMissions > 0
                ? Math.round((user.missionsCompleted / totalMissions) * 100)
                : 0,
            rankTier: calculateAgentRank(user.auraPoints),
            image: user.image,
        }))

        return NextResponse.json({
            players: players.slice(skip, skip + limit),
            currentUserId: session.user.id,
            page,
            totalPages: Math.max(1, Math.ceil(players.length / limit)),
            totalPlayers: players.length,
        })
    } catch (error) {
        console.error("[API] Leaderboard error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
