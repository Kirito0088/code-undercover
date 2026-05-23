"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Terminal, KeyRound } from "lucide-react"
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
                // You could optionally show an error message state here
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

            <div className="mx-auto w-full max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                        <KeyRound className="h-6 w-6 text-yellow-500" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Passphrase Recovery
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Enter your Agent ID to receive recovery instructions
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-md">
                <div className="backdrop-blur-xl bg-gray-900/40 py-6 sm:py-8 px-4 sm:px-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 rounded-xl border-t border-gray-800">

                    {submitted ? (
                        <div className="text-center py-4">
                            <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-4">
                                <Terminal className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="text-lg font-mono font-bold text-green-400 tracking-wider mb-2">
                                SIGNAL_TRANSMITTED
                            </h3>
                            <p className="text-sm text-gray-400 font-mono leading-relaxed">
                                If an agent with that ID exists in our system, recovery instructions have been dispatched to the registered comm channel.
                            </p>
                            <div className="mt-6 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                                <p className="text-xs text-yellow-400/80 font-mono">
                                    ⚠ NOTE: Email service not configured. Contact your system administrator for manual passphrase reset.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="inline-block mt-6 text-sm font-semibold text-green-500 hover:text-green-400 transition-colors font-mono"
                            >
                                ← Return to terminal
                            </Link>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
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
                                        className="bg-black/50 border-gray-800 font-mono focus-visible:ring-yellow-500/50"
                                        placeholder="agent@codeundercover.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <Button
                                    type="submit"
                                    className="w-full font-mono font-bold tracking-wider bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700"
                                    disabled={loading}
                                >
                                    {loading ? "TRANSMITTING..." : "SEND_RECOVERY_SIGNAL"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {!submitted && (
                        <div className="mt-6 text-center text-sm text-gray-400">
                            Remember your passphrase?{" "}
                            <Link href="/login" className="font-semibold text-green-500 hover:text-green-400 transition-colors">
                                Access terminal here.
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
