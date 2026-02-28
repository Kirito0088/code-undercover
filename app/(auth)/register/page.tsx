"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Terminal, Code } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
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
        <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center py-12 sm:px-6 lg:px-8 bg-black/40 relative overflow-hidden">
            <div className="absolute inset-0 z-[-1] bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-green-900/10 via-black to-black"></div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-[0_0_15px_rgba(22,163,74,0.3)] transform rotate-12">
                        <Code className="h-6 w-6 text-green-500 -rotate-12" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
                    Join the Agency
                </h2>
                <p className="mt-2 text-center text-sm text-gray-400">
                    Request terminal access to start coding missions
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="backdrop-blur-xl bg-gray-900/40 py-8 px-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 sm:rounded-xl sm:px-10 border-t border-gray-800">

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
