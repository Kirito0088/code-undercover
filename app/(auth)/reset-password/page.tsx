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
                <h3 className="text-lg font-semibold text-[#F1F1F5] mb-2">
                    Invalid Link
                </h3>
                <p className="text-sm text-[#8B8BA7] leading-relaxed mb-6">
                    The recovery link is invalid or has expired. Please request a new one.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-block text-sm font-medium text-[#818CF8] hover:text-indigo-300 transition-colors"
                >
                    Request new link
                </Link>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
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
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#F1F1F5] mb-2">
                    Password Updated
                </h3>
                <p className="text-sm text-[#8B8BA7] leading-relaxed mb-6">
                    Your password has been successfully updated.
                </p>
                <Link
                    href="/login"
                    className="inline-block text-sm font-medium text-[#818CF8] hover:text-indigo-300 transition-colors"
                >
                    Log in to your account
                </Link>
            </div>
        )
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-xs text-red-400 text-center">{error}</p>
                </div>
            )}
            <div>
                <label htmlFor="password" className="block text-xs font-medium text-[#8B8BA7] mb-1.5">
                    New Password
                </label>
                <div className="mt-2">
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#8B8BA7] mb-1.5">
                    Confirm Password
                </label>
                <div className="mt-2">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <Button
                    type="submit"
                    className="w-full text-sm font-medium"
                    disabled={loading}
                >
                    {loading ? "Updating..." : "Update Password"}
                </Button>
            </div>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#0A0A0F]">
            <div className="mx-auto w-full max-w-sm">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#F1F1F5]">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-[#8B8BA7]">
                    Enter your new password
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-sm">
                <div className="bg-[#111118] border border-[#22222E] rounded-2xl p-8 shadow-xl relative">
                    <Suspense fallback={<div className="text-center text-indigo-400 text-sm">Loading interface...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
