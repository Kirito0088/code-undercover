import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
