import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { acceptMission } from "@/services/mission.service"

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        console.log("[API] Accept mission - session:", JSON.stringify(session?.user))

        if (!session?.user?.id) {
            console.error("[API] No user ID in session")
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            )
        }

        const body = await req.json()
        const { missionId } = body

        console.log("[API] Accept mission - userId:", session.user.id, "missionId:", missionId)

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
