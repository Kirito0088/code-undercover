import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { missionActionLimiter } from "@/lib/rate-limit"

export async function POST(req: Request) {
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

    await db.user.update({
        where: { id: session.user.id },
        data: { hasSeenIntro: true },
    })

    return NextResponse.json({ ok: true })
}
