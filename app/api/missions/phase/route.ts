import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireSessionUser } from '@/lib/session'
import { canAccessMission } from '@/services/mission.service'

export async function POST(req: Request) {
    try {
        const { userId, error } = await requireSessionUser()
        if (error) return error

        const { missionId, phase } = await req.json()
        if (!missionId || typeof missionId !== 'string' || !phase) {
            return NextResponse.json({ error: 'Missing or invalid parameters' }, { status: 400 })
        }

        // 🔒 Access check — must happen before any DB writes or phase logic
        const hasAccess = await canAccessMission(userId, missionId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'You do not have access to this mission' }, { status: 403 })
        }

        // Must be a valid phase
        if (!['TEACHING', 'MCQ', 'CODING'].includes(phase)) {
            return NextResponse.json({ error: 'Invalid phase' }, { status: 400 })
        }

        // Upsert, not update: access is already granted above, and an agent can
        // reach a phase before anything has written their UserMission row. An
        // `update` throws P2025 there, which only ever surfaced as a 500.
        const updated = await db.userMission.upsert({
            where: {
                userId_missionId: { userId, missionId }
            },
            update: { phase },
            create: {
                userId,
                missionId,
                phase,
                status: 'ACTIVE',
                startedAt: new Date(),
            }
        })

        return NextResponse.json({ success: true, phase: updated.phase })
    } catch (error) {
        console.error('Phase update error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
