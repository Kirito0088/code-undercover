"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import Link from "next/link"

const LANGUAGES = [
    { value: "C", label: "C / C++", icon: "⚙️" },
    { value: "Java", label: "Java", icon: "☕" },
    { value: "Python", label: "Python", icon: "🐍" },
    { value: "DBMS", label: "DBMS", icon: "🗄️" },
]

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        preferredLanguage: "C",
    })
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                router.push("/login")
            } else {
                const data = await res.json()
                setError(data.message || "Registration failed. Please check your inputs.")
            }
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 bg-[#14141A]">

            <div className="mx-auto w-full max-w-sm">
                <h2 className="text-center text-3xl font-semibold tracking-tight text-[#F1F1F5]">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-[#8B8BA7]">
                    Start your coding journey
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-sm">
                <div className="bg-[#1C1C24] border border-[#323242] rounded-2xl p-8 shadow-xl relative">

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="name" className="block text-xs font-medium text-[#8B8BA7] mb-1.5">
                                Name
                            </label>
                            <div className="mt-2 text-white">
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="your name"
                                />
                            </div>
                        </div>

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
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div>
                            <label className="block text-xs font-medium text-[#8B8BA7] mb-3">
                                Select Language
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {LANGUAGES.map((lang) => (
                                    <label
                                        key={lang.value}
                                        className={`
                                            relative flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 
                                            border transition-all duration-200 group
                                            ${formData.preferredLanguage === lang.value
                                                ? "border-indigo-500/60 bg-indigo-500/5 text-[#F1F1F5]"
                                                : "border-[#323242] bg-[#14141A] hover:border-indigo-500/40 text-[#8B8BA7]"
                                            }
                                        `}
                                    >
                                        <input
                                            type="radio"
                                            name="preferredLanguage"
                                            value={lang.value}
                                            checked={formData.preferredLanguage === lang.value}
                                            onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                                            className="sr-only"
                                        />
                                        {/* Custom radio indicator */}
                                        <span className={`
                                            flex-shrink-0 h-4 w-4 rounded-full border-2 transition-all duration-200
                                            flex items-center justify-center
                                            ${formData.preferredLanguage === lang.value
                                                ? "border-indigo-500 bg-indigo-500"
                                                : "border-[#323242] bg-transparent group-hover:border-indigo-500/40"
                                            }
                                        `}>
                                            {formData.preferredLanguage === lang.value && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                                            )}
                                        </span>
                                        <span className="text-lg">{lang.icon}</span>
                                        <span className="text-sm font-medium tracking-wide transition-colors">
                                            {lang.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full text-sm font-medium" disabled={loading}>
                                {loading ? "Creating account..." : "Create Account"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-xs text-[#8B8BA7]">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-[#39D375] hover:text-indigo-300 transition-colors">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
