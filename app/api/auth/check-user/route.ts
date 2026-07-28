import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkUserLimiter, getIpFromHeaders } from "@/lib/rate-limit"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
    try {
        const ip = getIpFromHeaders(req.headers)
        if (await checkUserLimiter.isRateLimited(ip)) {
            return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
        }

        const { searchParams } = new URL(req.url)
        const email = searchParams.get("email")

        if (!email) {
            return NextResponse.json({ error: "Email parameter is required" }, { status: 400 })
        }

        const normalizedEmail = email.trim().toLowerCase()

        const user = await db.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true }
        })

        return NextResponse.json({ exists: !!user })
    } catch (error) {
        console.error("[Check User API Error]:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
