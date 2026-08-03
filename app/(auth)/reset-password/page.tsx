"use client"

import { useReducer, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { KeyRound, ShieldCheck } from "lucide-react"
import Link from "next/link"

interface ResetState {
    password: string
    confirmPassword: string
    error: string
    success: boolean
    loading: boolean
}

type ResetAction =
    | { type: "SET_PASSWORD"; payload: string }
    | { type: "SET_CONFIRM"; payload: string }
    | { type: "START_SUBMIT" }
    | { type: "SUBMIT_ERROR"; payload: string }
    | { type: "SUBMIT_SUCCESS" }
    | { type: "FINISH_LOADING" }

const initialResetState: ResetState = {
    password: "",
    confirmPassword: "",
    error: "",
    success: false,
    loading: false,
}

function resetReducer(state: ResetState, action: ResetAction): ResetState {
    switch (action.type) {
        case "SET_PASSWORD":
            return { ...state, password: action.payload }
        case "SET_CONFIRM":
            return { ...state, confirmPassword: action.payload }
        case "START_SUBMIT":
            return { ...state, error: "", loading: true }
        case "SUBMIT_ERROR":
            return { ...state, error: action.payload, loading: false }
        case "SUBMIT_SUCCESS":
            return { ...state, success: true, loading: false }
        case "FINISH_LOADING":
            return { ...state, loading: false }
        default:
            return state
    }
}

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const getSearchParam = searchParams.get.bind(searchParams)
    
    const token = getSearchParam("token")
    const email = getSearchParam("email")

    const [state, dispatch] = useReducer(resetReducer, initialResetState)

    if (!token || !email) {
        return (
            <div className="text-center py-4">
                <div className="mx-auto size-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 mb-4">
                    <KeyRound className="size-6 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-[#E2E8F0] mb-2">
                    Invalid Link
                </h3>
                <p className="text-sm text-[#8F9F8F] leading-relaxed mb-6">
                    The recovery link is invalid or has expired. Please request a new one.
                </p>
                <Link
                    href="/forgot-password"
                    className="inline-block text-sm font-medium text-[#39D375] hover:text-indigo-300 transition-colors"
                >
                    Request new link
                </Link>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        dispatch({ type: "START_SUBMIT" })

        if (state.password !== state.confirmPassword) {
            dispatch({ type: "SUBMIT_ERROR", payload: "Passwords do not match" })
            return
        }

        if (state.password.length < 8) {
            dispatch({ type: "SUBMIT_ERROR", payload: "Password must be at least 8 characters" })
            return
        }

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, email, password: state.password }),
            })

            const data = await res.json()

            if (res.ok) {
                dispatch({ type: "SUBMIT_SUCCESS" })
            } else {
                dispatch({ type: "SUBMIT_ERROR", payload: data.message || "Something went wrong" })
            }
        } catch {
            dispatch({ type: "SUBMIT_ERROR", payload: "Failed to connect to servers" })
        }
    }

    if (state.success) {
        return (
            <div className="text-center py-4">
                <div className="mx-auto size-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-4">
                    <ShieldCheck className="size-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-[#E2E8F0] mb-2">
                    Password Updated
                </h3>
                <p className="text-sm text-[#8F9F8F] leading-relaxed mb-6">
                    Your password has been successfully updated.
                </p>
                <Link
                    href="/login"
                    className="inline-block text-sm font-medium text-[#39D375] hover:text-indigo-300 transition-colors"
                >
                    Log in to your account
                </Link>
            </div>
        )
    }

    return (
        <form className="space-y-6" onSubmit={handleSubmit}>
            {state.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md">
                    <p className="text-xs text-red-400 text-center">{state.error}</p>
                </div>
            )}
            <div>
                <label htmlFor="password" className="block text-xs font-medium text-[#8F9F8F] mb-1.5">
                    New Password
                </label>
                <div className="mt-2">
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        required
                        value={state.password}
                        onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-[#8F9F8F] mb-1.5">
                    Confirm Password
                </label>
                <div className="mt-2">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        value={state.confirmPassword}
                        onChange={(e) => dispatch({ type: "SET_CONFIRM", payload: e.target.value })}
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div>
                <Button
                    type="submit"
                    className="w-full text-sm font-medium"
                    disabled={state.loading}
                >
                    {state.loading ? "Updating..." : "Update Password"}
                </Button>
            </div>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-sm">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#E2E8F0]">
                    Reset your password
                </h2>
                <p className="mt-2 text-center text-sm text-[#8F9F8F]">
                    Enter your new password
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-sm">
                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-2xl p-8 shadow-xl relative">
                    <Suspense fallback={<div className="text-center text-indigo-400 text-sm">Loading interface&hellip;</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
