import { NextResponse } from "next/server"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.error("[CSP VIOLATION]", JSON.stringify(body, null, 2))
        return NextResponse.json({ received: true }, { status: 200 })
    } catch {
        return NextResponse.json({ received: false }, { status: 200 })
    }
}