import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db, safeDbQuery } from "@/lib/db"
import { profileLimiter } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

/**
 * GET /api/dashboard
 *
 * The signed-in agent's progression record. `/api/profile` only exposes PATCH
 * and DELETE today, so there is no way for a native client to read aura, level,
 * streak or badge counts — the dashboard page reads them from Prisma in a
 * server component.
 *
 * Scoped to the caller only: it returns the session user's own row and never
 * accepts a user id parameter.
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const rate = await profileLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const [user, totalMissions] = await safeDbQuery(
            () => Promise.all([
                db.user.findUnique({
                    where: { id: session.user.id },
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        email: true,
                        image: true,
                        auraPoints: true,
                        auraLevel: true,
                        missionsCompleted: true,
                        foxBadges: true,
                        comboStreak: true,
                        maxCombo: true,
                        preferredLanguage: true,
                        hasSeenIntro: true,
                    },
                }),
                db.mission.count(),
            ]),
            [null, 0] as [null, number],
            "dashboard.GET"
        )

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        return NextResponse.json({ ...user, totalMissions })
    } catch (error) {
        console.error("[API] Dashboard error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
