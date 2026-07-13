import { NextResponse } from "next/server"

export async function GET() {
    return new NextResponse(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        },
    })
}
