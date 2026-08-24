import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { missionActionLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rate = await missionActionLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const completedMissions = await db.userMission.findMany({
            where: {
                userId: session.user.id,
                status: 'COMPLETED',
            },
            include: {
                mission: {
                    select: {
                        id: true,
                        order: true,
                        title: true,
                        difficulty: true,
                        language: true,
                        auraReward: true,
                    },
                },
            },
            orderBy: {
                mission: {
                    order: 'asc',
                },
            },
        })

        const history = completedMissions.map((um) => ({
            id: um.id,
            missionId: um.missionId,
            missionOrder: um.mission.order,
            missionTitle: um.mission.title,
            difficulty: um.mission.difficulty,
            language: um.mission.language,
            auraReward: um.mission.auraReward,
            submittedCode: um.submittedCode,
            attemptCount: um.attemptCount,
            hintsUsed: um.hintsUsed,
            innovationUnlocked: um.innovationUnlocked,
            completedAt: um.completedAt,
        }))

        return NextResponse.json({ history })
    } catch (error) {
        console.error('History fetch error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
