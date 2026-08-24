import { withAuth, NextRequestWithAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const PROTECTED_APP_ROUTES = [
    "/dashboard",
    "/skill",
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
        "/dashboard/:path*",
        "/skill/:path*",
        "/skill",
        "/levels/:path*",
        "/mission/:path*",
        "/history/:path*",
        "/profile/:path*",
        "/leaderboard/:path*",
        "/debug-lab/:path*",
        "/intro",
        "/intro/:path*",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
    ],
}
