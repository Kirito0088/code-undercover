import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getSupa() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  const key =
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    ""
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(request: Request) {
    const supa = getSupa()
    if (!supa) {
        console.error("[AUTH] OAuth callback misconfigured: missing SUPABASE_URL/ANON_KEY")
        return NextResponse.redirect(new URL("/login?error=OAuthConfig", request.url))
    }
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