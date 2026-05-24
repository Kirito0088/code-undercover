"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [submitted, setSubmitted] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            if (res.ok) {
                setSubmitted(true)
            } else {
                const data = await res.json()
                console.error(data.message)
            }
        } catch (error) {
            console.error("Error sending reset email:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

            <div className="mx-auto w-full max-w-sm">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#F1F1F5]">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-[#8B8BA7]">
                    Enter your email to receive reset instructions
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-sm">
                <div className="bg-[#1C1C24] border border-[#323242] rounded-2xl p-8 shadow-xl relative">

                    {submitted ? (
                        <div className="text-center py-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                                <CheckCircle className="h-6 w-6 text-emerald-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-[#F1F1F5] mb-2">
                                Email Sent
                            </h3>
                            <p className="text-sm text-[#8B8BA7] leading-relaxed">
                                If an account with that email exists in our system, recovery instructions have been dispatched.
                            </p>
                            <div className="mt-6 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <p className="text-xs text-amber-400">
                                    NOTE: Email service not configured. Contact your system administrator for manual password reset.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-block mt-6 text-sm font-medium text-[#39D375] hover:text-indigo-300 transition-colors"
                            >
                                Back to Log In
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email" className="block text-xs font-medium text-[#8B8BA7] mb-1.5">
                                    Email Address
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
                                        placeholder="name@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full text-sm font-medium"
                                    disabled={loading}
                                >
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {!submitted && (
                        <div className="mt-6 text-center text-xs text-[#8B8BA7]">
                            Remember your password?{" "}
                            <Link href="/login" className="font-medium text-[#39D375] hover:text-indigo-300 transition-colors">
                                Log in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
