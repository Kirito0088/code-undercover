import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { missionId, phase } = await req.json()
        if (!missionId || !phase) {
            return NextResponse.json({ error: 'Missing logic payload' }, { status: 400 })
        }

        // Must be a valid phase
        if (!['TEACHING', 'MCQ', 'CODING'].includes(phase)) {
            return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
        }

        const updated = await db.userMission.update({
            where: {
                userId_missionId: {
                    userId: session.user.id,
                    missionId
                }
            },
            data: { phase }
        })

        return NextResponse.json({ success: true, phase: updated.phase })
    } catch (error) {
        console.error('Phase update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
