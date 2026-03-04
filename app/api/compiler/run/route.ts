import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeCode } from '@/lib/compiler'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const { code, input = "" } = await req.json()
        if (!code || typeof code !== 'string') {
            return NextResponse.json({ success: false, error: 'Missing or invalid code payload' }, { status: 400 })
        }
        if (code.length > 10000) {
            return NextResponse.json({ success: false, error: 'Code exceeds length limits' }, { status: 400 })
        }

        // Use our shared compiler engine
        const result = await executeCode(code, input)
        return NextResponse.json(result)

    } catch (error) {
        console.error("API Error in /api/compiler/run:", error)
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
    }
}
