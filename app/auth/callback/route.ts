import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supa = createClient(supabaseUrl, supabaseAnonKey)

export async function GET(request: Request) {
    // Supabase will redirect here after Google consent with ?code=...&state=...
    // getSession() will exchange the code for a session
    const { data, error } = await supa.auth.getSession()

    if (error) {
        console.error("[AUTH] OAuth callback error:", error)
        return NextResponse.redirect(new URL("/login?error=OAuthCallback", request.url))
    }

    // User is now signed in, redirect to dashboard/levels
    return NextResponse.redirect(new URL("/levels", request.url))
}