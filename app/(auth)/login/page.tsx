"use client"

import { useReducer, useEffect, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import Link from "next/link"

interface LoginState {
    email: string
    password: string
    error: string
    loading: boolean
    googleLoading: boolean
}

type LoginAction =
    | { type: "SET_EMAIL"; payload: string }
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_ERROR"; payload: string }
    | { type: "SET_LOADING"; payload: boolean }
    | { type: "SET_GOOGLE_LOADING"; payload: boolean }
    | { type: "START_SUBMIT" }
    | { type: "SUBMIT_ERROR"; payload: string }
    | { type: "FINISH_LOADING" }

// Where a successful sign-in lands. The middleware, the hero CTA and the
// mission board all hand us the page they turned the visitor away from as
// ?callbackUrl, so signing in resumes that journey instead of dumping
// everyone on the same screen. The mission board is the fallback.
const DEFAULT_DESTINATION = "/levels"

function safeCallbackUrl(raw: string | null): string {
    if (!raw) return DEFAULT_DESTINATION
    try {
        // A relative path resolves against this origin; an absolute URL keeps
        // its own. Only a same-origin target is allowed through, so the
        // parameter can't be used to bounce someone to another site.
        const url = new URL(raw, window.location.origin)
        if (url.origin !== window.location.origin) return DEFAULT_DESTINATION
        return `${url.pathname}${url.search}${url.hash}`
    } catch {
        return DEFAULT_DESTINATION
    }
}

const initialLoginState: LoginState = {
    email: "",
    password: "",
    error: "",
    loading: false,
    googleLoading: false,
}

function loginReducer(state: LoginState, action: LoginAction): LoginState {
    switch (action.type) {
        case "SET_EMAIL":
            return { ...state, email: action.payload }
        case "SET_PASSWORD":
            return { ...state, password: action.payload }
        case "SET_ERROR":
            return { ...state, error: action.payload }
        case "SET_LOADING":
            return { ...state, loading: action.payload }
        case "SET_GOOGLE_LOADING":
            return { ...state, googleLoading: action.payload }
        case "START_SUBMIT":
            return { ...state, loading: true, error: "" }
        case "SUBMIT_ERROR":
            return { ...state, error: action.payload, loading: false }
        case "FINISH_LOADING":
            return { ...state, loading: false }
        default:
            return state
    }
}

function LoginForm() {
    const { push, refresh } = useRouter()
    const searchParams = useSearchParams()

    const [state, dispatch] = useReducer(loginReducer, initialLoginState)

    // Handle OAuth/external query params errors
    useEffect(() => {
        const errorParam = searchParams.get("error")
        if (errorParam === "AccountNotExist") {
            dispatch({ type: "SET_ERROR", payload: "Account does not exist. Please sign up." })
        } else if (errorParam === "OAuthCallback" || errorParam === "OAuthCreateAccount") {
            dispatch({ type: "SET_ERROR", payload: "Unable to authenticate with Google. Please try again or sign up with credentials." })
        } else if (errorParam) {
            dispatch({ type: "SET_ERROR", payload: "Authentication failed. Please try again." })
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch({ type: "START_SUBMIT" })

        try {
            // Direct NextAuth credentials authentication (single source of truth)
            const res = await signIn("credentials", {
                email: state.email.trim().toLowerCase(),
                password: state.password,
                redirect: false,
            })

            if (res?.error) {
                dispatch({
                    type: "SUBMIT_ERROR",
                    payload: res.error === "CredentialsSignin"
                        ? "Invalid email or password."
                        : res.error
                })
            } else if (res?.ok) {
                const session = await getSession()
                const userId = session?.user?.id

                if (userId) {
                    localStorage.setItem(`hasSeenIntro_${userId}`, "true")
                }
                push(safeCallbackUrl(searchParams.get("callbackUrl")))
                refresh()
            }
        } catch {
            dispatch({ type: "SUBMIT_ERROR", payload: "Something went wrong. Please try again." })
        } finally {
            dispatch({ type: "FINISH_LOADING" })
        }
    }

    const handleGoogleSignIn = async () => {
        dispatch({ type: "SET_GOOGLE_LOADING", payload: true })
        dispatch({ type: "SET_ERROR", payload: "" })
        try {
            await signIn("google", { callbackUrl: safeCallbackUrl(searchParams.get("callbackUrl")) })
        } catch {
            dispatch({ type: "SET_ERROR", payload: "Google authentication failed." })
            dispatch({ type: "SET_GOOGLE_LOADING", payload: false })
        }
    }

    return (
        <div className="bg-[#0D0E12] border border-[#1F261F] rounded-2xl p-8 shadow-xl relative">
            <form className="space-y-6" onSubmit={handleSubmit}>
                {state.error && (
                    <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                        {state.error}
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="block text-xs font-medium text-[#8F9F8F] mb-1.5">
                        Email Address
                    </label>
                    <div className="mt-2">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={state.email}
                            onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
                            placeholder="name@email.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-xs font-medium text-[#8F9F8F] mb-1.5">
                        Password
                    </label>
                    <div className="mt-2">
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={state.password}
                            onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-y-2">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            aria-labelledby="remember-me-label"
                            className="size-4 rounded border-[#1F261F] bg-[#07080A] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#07080A]"
                        />
                        <label id="remember-me-label" htmlFor="remember-me" className="ml-2 block text-xs text-[#8F9F8F]">
                            Remember me
                        </label>
                    </div>

                    <div className="text-xs">
                        <Link href="/forgot-password" className="font-medium text-[#39D375] hover:text-indigo-300 transition-colors">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <div>
                    <Button type="submit" className="w-full text-sm font-medium" disabled={state.loading}>
                        {state.loading ? "Signing in..." : "Sign In"}
                    </Button>
                </div>
            </form>

            {/* Divider */}
            <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#1F261F]" />
                </div>
                <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0D0E12] px-3 text-[#4A5D4A] font-medium">
                        or
                    </span>
                </div>
            </div>

            {/* Google Sign-In */}
            <div className="mt-6">
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={state.googleLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-md px-4 py-2.5 
                               bg-[#07080A] border border-[#1F261F] 
                               text-[#8F9F8F] text-sm
                               hover:bg-[#161820] hover:border-[#2A3A2A] 
                               focus:outline-none focus:ring-2 focus:ring-indigo-500/30 
                               transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {state.googleLoading ? (
                        <svg className="animate-spin size-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="size-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                    )}
                    {state.googleLoading ? "Connecting..." : "Sign in with Google"}
                </button>
            </div>

            <div className="mt-6 text-center text-xs text-[#8F9F8F]">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-[#39D375] hover:text-indigo-300 transition-colors">
                    Sign up
                </Link>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-sm">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#E2E8F0]">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-[#8F9F8F]">
                    Continue your learning journey
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-sm">
                <Suspense fallback={<div className="text-center text-indigo-400 text-sm">Loading security keys&hellip;</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}
