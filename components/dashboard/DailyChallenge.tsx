"use client"

import { useState, useEffect } from "react"
import { CheckCircle, XCircle, Zap, Loader2 } from "lucide-react"

interface Question {
    id: string
    question: string
    options: string[]
}

export function DailyChallenge() {
    const [status, setStatus] = useState<"loading" | "ready" | "completed">("loading")
    const [questionData, setQuestionData] = useState<Question | null>(null)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; earnedAura: number } | null>(null)

    useEffect(() => {
        // Check local storage for today's completion
        const today = new Date().toISOString().split("T")[0]
        const lastCompleted = localStorage.getItem("cu_daily_completed")

        if (lastCompleted === today) {
            setStatus("completed")
            return
        }

        // Fetch question
        const fetchQuestion = async () => {
            try {
                const res = await fetch("/api/daily-challenge")
                const data = await res.json()
                if (data.success && data.question) {
                    setQuestionData(data.question)
                    setStatus("ready")
                } else {
                    setStatus("completed") // Fallback
                }
            } catch (e) {
                console.error("Failed to fetch daily challenge", e)
                setStatus("completed")
            }
        }

        fetchQuestion()
    }, [])

    const handleSubmit = async () => {
        if (!selectedOption || !questionData) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/daily-challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: questionData.id,
                    answer: selectedOption
                })
            })
            const data = await res.json()

            if (data.success) {
                setResult({
                    isCorrect: data.isCorrect,
                    explanation: data.explanation,
                    earnedAura: data.earnedAura
                })

                // Mark as completed for today
                const today = new Date().toISOString().split("T")[0]
                localStorage.setItem("cu_daily_completed", today)
            }
        } catch (e) {
            console.error("Failed to submit answer", e)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === "loading") {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-center items-center my-8">
                <Loader2 className="animate-spin text-green-500" />
            </div>
        )
    }

    if (status === "completed" && !result) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 my-8 text-center flex items-center justify-center flex-col">
                <Zap className="h-8 w-8 text-yellow-500 mb-2 opacity-50" />
                <h3 className="text-gray-400 font-mono">Daily Challenge Completed</h3>
                <p className="text-gray-500 text-sm mt-1">Return tomorrow for another chance to earn Aura.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#0d1117] border border-gray-800 rounded-xl p-6 my-8 relative overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-800/50 pb-4">
                <Zap className="h-5 w-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-gray-200 tracking-wide uppercase font-mono">
                    Daily Knowledge Intercept
                </h2>
                <span className="ml-auto text-xs font-bold bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded">
                    +20 AURA
                </span>
            </div>

            {/* Question */}
            {questionData && !result && (
                <div>
                    <p className="text-gray-300 font-medium mb-6 leading-relaxed">
                        {questionData.question}
                    </p>
                    <div className="grid gap-3">
                        {questionData.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedOption(opt)}
                                disabled={isSubmitting}
                                className={`text-left p-4 rounded-lg border transition-all text-sm font-mono
                                    ${selectedOption === opt
                                        ? "border-green-500 bg-green-500/10 text-green-400"
                                        : "border-gray-800 hover:border-gray-600 bg-black/40 text-gray-400 hover:text-gray-200"
                                    }
                                `}
                            >
                                <span className="text-gray-600 mr-2">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedOption || isSubmitting}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold text-sm tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                        </button>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-4 rounded-lg mb-4 flex gap-3 ${result.isCorrect ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        <div className="mt-0.5">
                            {result.isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="font-bold font-mono text-lg mb-1">
                                {result.isCorrect ? "Access Granted" : "Access Denied"}
                            </h3>
                            <p className="opacity-90 leading-relaxed text-sm">
                                {result.explanation}
                            </p>
                            {result.isCorrect && (
                                <div className="mt-3 inline-block bg-yellow-400/20 text-yellow-400 font-mono font-bold text-xs px-2 py-1 rounded">
                                    + {result.earnedAura} Aura Earned
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
