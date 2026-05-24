"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import Link from "next/link"

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            })

            if (res?.error) {
                setError("Incorrect email or password.")
            } else {
                const session = await getSession()
                const userId = session?.user?.id

                if (userId) {
                    const hasSeen = localStorage.getItem(`hasSeenIntro_${userId}`)
                    if (hasSeen === "true") {
                        router.push("/levels")
                    } else {
                        router.push("/intro")
                    }
                } else {
                    router.push("/intro")
                }
                router.refresh()
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true)
        setError("")
        try {
            await signIn("google", { callbackUrl: "/intro" })
        } catch {
            setError("Google authentication failed.")
            setGoogleLoading(false)
        }
    }

    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]">

            <div className="mx-auto w-full max-w-sm">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#F1F1F5]">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-sm text-[#8B8BA7]">
                    Continue your learning journey
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-sm">
                <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-8 shadow-xl relative">

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-[#8B8BA7] mb-1.5">
                                Email Address
                            </label>
                            <div className="mt-2">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-[#8B8BA7] mb-1.5">
                                Password
                            </label>
                            <div className="mt-2">
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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
                                    className="h-4 w-4 rounded border-[#22222E] bg-[#0A0A0F] text-indigo-600 focus:ring-indigo-500 focus:ring-offset-[#0A0A0F]"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-xs text-[#8B8BA7]">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-xs">
                                <Link href="/forgot-password" className="font-medium text-[#818CF8] hover:text-indigo-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full text-sm font-medium" disabled={loading}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#22222E]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-[#111118] px-3 text-[#5C5C7A] font-medium">
                                or
                            </span>
                        </div>
                    </div>

                    {/* Google Sign-In */}
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={handleGoogleSignIn}
                            disabled={googleLoading}
                            className="w-full flex items-center justify-center gap-3 rounded-md px-4 py-2.5 
                                       bg-[#0A0A0F] border border-[#22222E] 
                                       text-[#8B8BA7] text-sm
                                       hover:bg-[#1C1C28] hover:border-[#2E2E3F] 
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500/30 
                                       transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {googleLoading ? (
                                <svg className="animate-spin h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            {googleLoading ? "Connecting..." : "Sign in with Google"}
                        </button>
                    </div>

                    <div className="mt-6 text-center text-xs text-[#8B8BA7]">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="font-medium text-[#818CF8] hover:text-indigo-300 transition-colors">
                            Sign up
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
