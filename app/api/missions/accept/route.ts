import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { acceptMission } from "@/services/mission.service"
import { missionActionLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const rate = await missionActionLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { message: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const body = await req.json()
        const { missionId } = body

        if (!missionId || typeof missionId !== "string") {
            return NextResponse.json(
                { message: "Mission ID is required" },
                { status: 400 }
            )
        }

        const result = await acceptMission(session.user.id, missionId)

        if (!result.success) {
            return NextResponse.json(
                { message: result.error },
                { status: 403 }
            )
        }

        return NextResponse.json(
            { message: "Mission accepted", redirect: `/mission/${missionId}` },
            { status: 200 }
        )
    } catch (error) {
        console.error("[API] Accept mission error:", error)
        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        )
    }
}
