"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Terminal, Code } from "lucide-react"
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
                setError(data.message || "Registration failed. Firewall blocked request.")
            }
        } catch {
            setError("System malfunction during onboarding.")
        } finally {
            setLoading(false)
        }
    }

    return (
            <div className="relative z-10 flex min-h-[calc(100vh-4rem)] flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">

            <div className="mx-auto w-full max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(22,163,74,0.3)] transform rotate-12">
                        <Code className="h-6 w-6 text-green-500 -rotate-12" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Join the Agency
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Request terminal access to start coding missions
                </p>
            </div>

            <div className="mt-8 mx-auto w-full max-w-md">
                <div className="backdrop-blur-xl bg-gray-900/40 py-6 sm:py-8 px-4 sm:px-10 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 rounded-xl border-t border-gray-800">

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
                            <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-300 font-mono">
                                CALLSIGN / NAME
                            </label>
                            <div className="mt-2 text-white">
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="bg-black/50 border-gray-800 font-mono focus-visible:ring-green-500/50"
                                    placeholder="Neo"
                                />
                            </div>
                        </div>

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
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="bg-black/50 border-gray-800 font-mono focus-visible:ring-green-500/50"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Language Selector */}
                        <div>
                            <label className="block text-sm font-medium leading-6 text-gray-300 font-mono mb-3">
                                SELECT_SPECIALIZATION
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {LANGUAGES.map((lang) => (
                                    <label
                                        key={lang.value}
                                        className={`
                                            relative flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 
                                            border transition-all duration-200 group
                                            ${formData.preferredLanguage === lang.value
                                                ? "border-green-500/60 bg-green-500/10 shadow-[0_0_12px_rgba(22,163,74,0.15)] ring-1 ring-green-500/30"
                                                : "border-gray-700/50 bg-black/30 hover:border-gray-600 hover:bg-black/50"
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
                                                ? "border-green-500 bg-green-500"
                                                : "border-gray-600 bg-transparent group-hover:border-gray-500"
                                            }
                                        `}>
                                            {formData.preferredLanguage === lang.value && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-black" />
                                            )}
                                        </span>
                                        <span className="text-lg">{lang.icon}</span>
                                        <span className={`
                                            text-sm font-mono font-medium tracking-wide transition-colors
                                            ${formData.preferredLanguage === lang.value
                                                ? "text-green-400"
                                                : "text-gray-400 group-hover:text-gray-300"
                                            }
                                        `}>
                                            {lang.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full font-mono font-bold tracking-wider" disabled={loading}>
                                {loading ? "ENCRYPTING_PAYLOAD..." : "REQUEST_ACCESS"}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already cleared?{" "}
                        <Link href="/login" className="font-semibold text-green-500 hover:text-green-400 transition-colors">
                            Access terminal here.
                        </Link>
                    </div>
                </div>
            </div>
            </div>
    )
}
