import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import fs from "fs"
import path from "path"

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        
        const logContent = `[${new Date().toISOString()}] Debug Session Query:\n` + 
                           `Session: ${JSON.stringify(session, null, 2)}\n\n`;
        
        const logPath = path.join(process.cwd(), "session-debug.log");
        fs.appendFileSync(logPath, logContent, "utf8");

        return NextResponse.json({ 
            success: true, 
            session,
            logPath
        })
    } catch (error: unknown) {
        const err = error as { message?: string };
        return NextResponse.json({ 
            success: false, 
            error: err.message || "Unknown error" 
        }, { status: 500 })
    }
}
