import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { canAccessMission, getMissionById } from "@/services/mission.service"
import { missionActionLimiter } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/missions/[missionId]
 *
 * Full mission content plus this user's progress, for the native mission
 * runner.
 *
 * Access is gated by `canAccessMission` exactly as the hint, phase and validate
 * routes are — otherwise this endpoint would become a way to read the teaching
 * material and MCQ answers for missions the agent has not unlocked.
 *
 * `validationRules` is intentionally NOT returned. It contains the required
 * output and keywords the submission is graded against, and the web client is
 * never given it either.
 */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ missionId: string }> }
) {
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

        const { missionId } = await params
        if (!missionId) {
            return NextResponse.json({ error: "Mission ID is required" }, { status: 400 })
        }

        const hasAccess = await canAccessMission(session.user.id, missionId)
        if (!hasAccess) {
            return NextResponse.json(
                { error: "You do not have access to this mission" },
                { status: 403 }
            )
        }

        const mission = await getMissionById(missionId)
        if (!mission) {
            return NextResponse.json({ error: "Mission not found" }, { status: 404 })
        }

        const userMission = await db.userMission.findUnique({
            where: {
                userId_missionId: { userId: session.user.id, missionId },
            },
        })

        return NextResponse.json({
            id: mission.id,
            order: mission.order,
            title: mission.title,
            description: mission.description,
            briefing: mission.briefing,
            difficulty: mission.difficulty,
            language: mission.language,
            type: mission.type,
            goal: mission.goal,
            startingCode: mission.startingCode,
            auraReward: mission.auraReward,
            teachingContent: mission.teachingContent,
            mcqContent: mission.mcqContent,

            // Per-user progress, so the client resumes at the right phase
            // instead of restarting the briefing every time.
            phase: userMission?.phase ?? "TEACHING",
            status: userMission?.status ?? "ACTIVE",
            hintsUsed: userMission?.hintsUsed ?? 0,
            submittedCode: userMission?.submittedCode ?? null,
        })
    } catch (error) {
        console.error("[API] Mission detail error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
