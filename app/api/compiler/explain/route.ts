import { NextResponse } from "next/server"
import { explainRequestSchema } from "@/lib/validation/explainRequest"
import { explainError } from "@/lib/explainService"
import { compilerExplainLimiter, getIpFromHeaders } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

// The Phase B seam: Root Error in, Explanation out. 400 is reserved for
// malformed caller input — an SLM-side failure always resolves through
// lib/explainService.ts to a 200 with the ADR-004 fallback payload, never a
// 5xx. No directFix gating here; that's T6.
export async function POST(req: Request) {
    const ip = getIpFromHeaders(req.headers)
    if (await compilerExplainLimiter.isRateLimited(ip)) {
        return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 })
    }

    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: "Malformed request body" }, { status: 400 })
    }

    const parsed = explainRequestSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Invalid request", details: parsed.error.flatten() },
            { status: 400 }
        )
    }

    try {
        const result = await explainError(
            parsed.data.rootErrorMessage,
            parsed.data.brokenLineContent,
            parsed.data.errorType
        )
        return NextResponse.json(result)
    } catch (error) {
        console.error("[Explain API Error]:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
