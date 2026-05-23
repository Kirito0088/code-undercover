"use client"

import { useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Terminal, Shield } from "lucide-react"
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
                setError("Invalid credentials. Access denied.")
            } else {
                // Fetch session to get user ID for per-user intro check
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
                    // Fallback: if we can't get userId, always show intro
                    router.push("/intro")
                }
                router.refresh()
            }
        } catch {
            setError("System malfunction during authentication.")
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
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

            <div className="mx-auto w-full max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(22,163,74,0.3)]">
                        <Shield className="h-6 w-6 text-green-500" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Agent Authentication
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Enter your credentials to access the terminal
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-md">
                <div className="backdrop-blur-xl bg-gray-900/40 py-6 sm:py-8 px-4 sm:px-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 rounded-xl border-t border-gray-800 relative">

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-md bg-red-500/10 p-4 ring-1 ring-red-500/30 font-mono text-sm">
                                <div className="flex">
                                    <Terminal className="h-5 w-5 text-red-500 mr-2" />
                                    <h3 className="text-sm font-medium text-red-400 uppercase tracking-wider">{error}</h3>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-300 font-mono">
                                AGENT_ID / EMAIL
                            </label>
                            <div className="mt-2 text-white">
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-black/50 border-gray-800 font-mono focus-visible:ring-green-500/50"
                                    placeholder="agent@codeundercover.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-300 font-mono">
                                PASSPHRASE
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
                                    className="bg-black/50 border-gray-800 font-mono focus-visible:ring-green-500/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-y-2">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-800 bg-black/50 text-green-600 focus:ring-green-600 focus:ring-offset-gray-900"
                                />
                                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-400">
                                    Keep terminal active
                                </label>
                            </div>

                            <div className="text-sm">
                                <Link href="/forgot-password" className="font-semibold text-green-500 hover:text-green-400 transition-colors">
                                    Forgot passphrase?
                                </Link>
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full font-mono font-bold tracking-wider" disabled={loading}>
                                {loading ? "AUTHENTICATING..." : "INITIATE_LOGIN"}
                            </Button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="relative mt-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-700/50" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-gray-900/80 px-3 text-gray-500 font-mono text-xs tracking-widest">
                                OR
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
                                       bg-white/5 border border-gray-700/50 
                                       text-gray-300 font-mono text-sm tracking-wider
                                       hover:bg-white/10 hover:border-gray-600 
                                       focus:outline-none focus:ring-2 focus:ring-green-500/30 
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
                            {googleLoading ? "CONNECTING..." : "SIGN_IN_WITH_GOOGLE"}
                        </button>
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don&apos;t have clearance?{" "}
                        <Link href="/register" className="font-semibold text-green-500 hover:text-green-400 transition-colors">
                            Request access now.
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
