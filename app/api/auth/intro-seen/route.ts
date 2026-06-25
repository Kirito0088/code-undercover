import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

/**
 * POST /api/auth/intro-seen
 *
 * Writes hasSeenIntro = true to the database for the authenticated user.
 * This is the single source of truth — localStorage is only a UI cache.
 */
export async function POST() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.user.update({
        where: { id: session.user.id },
        data: { hasSeenIntro: true },
    })

    return NextResponse.json({ ok: true })
}
