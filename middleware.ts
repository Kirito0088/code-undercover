import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

/**
 * ROUTE GUARD — Three layers of protection:
 *
 * LAYER 1 (this file — edge, runs before React):
 *   Reads hasSeenIntro from the JWT. No DB call. Instant redirect.
 *
 * LAYER 2 (lib/auth.ts):
 *   hasSeenIntro is written into the JWT on sign-in from the DB.
 *   It is refreshed when the intro page calls updateSession().
 *
 * LAYER 3 (localStorage — UI cache only, NEVER trusted for access control):
 *   Written after the server confirms intro seen. Used only to avoid
 *   redundant API calls on cold boots. Middleware never reads it.
 */

const PROTECTED_APP_ROUTES = [
    "/dashboard",
    "/levels",
    "/mission",
    "/history",
    "/profile",
    "/leaderboard",
    "/debug-lab",
]

const AUTH_ONLY_ROUTES = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
]

export default withAuth(
    function middleware(req: NextRequestWithAuth) {
        const { pathname } = req.nextUrl
        const token = req.nextauth.token

        // 1. Logged-in users must not access auth pages
        if (AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
            if (token) {
                return NextResponse.redirect(new URL("/dashboard", req.url))
            }
            return NextResponse.next()
        }

        // 2. /intro: if user already completed intro, skip it
        if (pathname === "/intro" || pathname.startsWith("/intro/")) {
            if (token?.hasSeenIntro) {
                return NextResponse.redirect(new URL("/levels", req.url))
            }
            return NextResponse.next()
        }

        // 3. Protected app routes: must have completed intro first
        const isProtectedAppRoute = PROTECTED_APP_ROUTES.some((r) =>
            pathname.startsWith(r)
        )

        if (isProtectedAppRoute && token && !token.hasSeenIntro) {
            return NextResponse.redirect(new URL("/intro", req.url))
        }

        return NextResponse.next()
    },
    {
        pages: {
            signIn: "/login",
        },
        callbacks: {
            authorized({ token, req }) {
                const { pathname } = req.nextUrl
                // Allow unauthenticated access to auth pages (our middleware
                // above handles the logged-in redirect for those)
                if (AUTH_ONLY_ROUTES.some((r) => pathname.startsWith(r))) {
                    return true
                }
                return !!token
            },
        },
    }
)

export const config = {
    matcher: [
        // Protected app routes
        "/dashboard/:path*",
        "/levels/:path*",
        "/mission/:path*",
        "/history/:path*",
        "/profile/:path*",
        "/leaderboard/:path*",
        "/debug-lab/:path*",
        // Intro
        "/intro",
        "/intro/:path*",
        // Auth pages
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ],
}
