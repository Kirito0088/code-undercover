import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDashboardMissions } from "@/services/mission.service"
import { missionActionLimiter } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/missions
 *
 * The levels board as a JSON list. The web app renders this from a server
 * component that queries Prisma directly, which a native client cannot reuse —
 * this exposes the same `getDashboardMissions` result over HTTP.
 *
 * Deliberately a thin wrapper: the LOCKED/ACTIVE/COMPLETED computation stays in
 * the service so the board can never disagree with what `accept` will allow.
 */
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const rate = await missionActionLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const { searchParams } = new URL(req.url)
        const missionType = searchParams.get("type") || "standard"

        const missions = await getDashboardMissions(session.user.id, missionType)
        return NextResponse.json(missions)
    } catch (error) {
        console.error("[API] Missions list error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
