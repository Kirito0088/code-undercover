"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { KeyRound, ShieldCheck } from "lucide-react"
import Link from "next/link"

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    
    const token = searchParams?.get("token")
    const email = searchParams?.get("email")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    if (!token || !email) {
        return (
            <div className="text-center py-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                    <KeyRound className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-lg font-mono font-bold text-red-400 tracking-wider mb-2">
                    INVALID_LINK
                </h3>
                <p className="text-sm text-gray-400 font-mono leading-relaxed mb-6">
                    The recovery link is invalid or has expired. Please request a new transmission.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-block text-sm font-semibold text-green-500 hover:text-green-400 transition-colors font-mono"
                >
                    ← Request new link
                </Link>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        if (password !== confirmPassword) {
            setError("Passphrases do not match")
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError("Passphrase must be at least 8 characters")
            setLoading(false)
            return
        }

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, email, password }),
            })

            const data = await res.json()

            if (res.ok) {
                setSuccess(true)
            } else {
                setError(data.message || "Something went wrong")
            }
        } catch (err) {
            setError("Failed to connect to servers")
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="text-center py-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 mb-4">
                    <ShieldCheck className="h-6 w-6 text-green-500" />
                </div>
                <h3 className="text-lg font-mono font-bold text-green-400 tracking-wider mb-2">
                    PASSPHRASE_UPDATED
                </h3>
                <p className="text-sm text-gray-400 font-mono leading-relaxed mb-6">
                    Your terminal access passphrase has been successfully re-encrypted.
                </p>
                <Link
                    href="/login"
                    className="inline-block text-sm font-semibold text-green-500 hover:text-green-400 transition-colors font-mono"
                >
                    → Proceed to terminal login
                </Link>
            </div>
        )
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-xs text-red-400 font-mono text-center">⚠ {error}</p>
                </div>
            )}
            <div>
                <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-300 font-mono">
                    NEW_PASSPHRASE
                </label>
                <div className="mt-2">
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-black/50 border-gray-800 font-mono focus-visible:ring-green-500/50"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-300 font-mono">
                    CONFIRM_PASSPHRASE
                </label>
                <div className="mt-2">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-black/50 border-gray-800 font-mono focus-visible:ring-green-500/50"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <Button
                    type="submit"
                    className="w-full font-mono font-bold tracking-wider bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    disabled={loading}
                >
                    {loading ? "ENCRYPTING..." : "UPDATE_PASSPHRASE"}
                </Button>
            </div>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        <KeyRound className="h-6 w-6 text-green-500" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                    Reset Passphrase
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Enter your new secure passphrase
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="backdrop-blur-xl bg-gray-900/40 py-8 px-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:rounded-xl sm:px-10 border-t border-gray-800">
                    <Suspense fallback={<div className="text-center text-green-500 font-mono">LOADING_INTERFACE...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
