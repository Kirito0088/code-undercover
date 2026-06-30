import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { canAccessMission } from '@/services/mission.service'

const HINTS = [
    "System Log > Pointers must point to valid memory addresses.",
    "System Log > Use malloc() for dynamic memory.",
    "System Log > Remember to check if your pointer is NULL before using it.",
    "System Log > Freeing memory twice will cause a crash (double free).",
    "System Log > After freeing a pointer, set it to NULL to prevent dangling."
]

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { missionId } = await req.json()
        if (!missionId || typeof missionId !== 'string') {
            return NextResponse.json({ error: 'Missing or invalid missionId' }, { status: 400 })
        }

        // 🔒 Access check — must happen before any DB writes or hint logic
        const hasAccess = await canAccessMission(session.user.id, missionId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'You do not have access to this mission' }, { status: 403 })
        }

        const userMission = await db.userMission.findUnique({
            where: {
                userId_missionId: {
                    userId: session.user.id,
                    missionId
                }
            }
        })

        if (!userMission) {
            return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
        }

        if (userMission.hintsUsed >= 5) {
            return NextResponse.json({ error: 'Maximum hints reached' }, { status: 429 })
        }

        const updated = await db.userMission.update({
            where: { id: userMission.id },
            data: { hintsUsed: userMission.hintsUsed + 1 }
        })

        const hintAssigned = HINTS[updated.hintsUsed - 1]

        return NextResponse.json({ success: true, hintsUsed: updated.hintsUsed, hint: hintAssigned })
    } catch (error) {
        console.error('Hint request error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
