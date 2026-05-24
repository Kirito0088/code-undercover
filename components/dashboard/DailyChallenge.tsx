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
            <div className="bg-[#111118] border border-[#22222E] rounded-xl p-6 flex justify-center items-center my-8">
                <Loader2 className="animate-spin text-indigo-400" />
            </div>
        )
    }

    if (status === "completed" && !result) {
        return (
            <div className="bg-[#111118]/50 border border-[#22222E] rounded-xl p-6 my-8 text-center flex items-center justify-center flex-col">
                <Zap className="h-8 w-8 text-amber-400 mb-2 opacity-50" />
                <h3 className="text-[#8B8BA7] font-medium">Daily Challenge Completed</h3>
                <p className="text-[#5C5C7A] text-sm mt-1">Return tomorrow for another chance to earn Aura.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#111118] border border-[#22222E] rounded-xl p-6 my-8 relative overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 border-b border-[#22222E] pb-4">
                <Zap className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm font-medium text-[#F1F1F5] tracking-tight">
                    Daily Challenge
                </h2>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2 py-0.5 rounded-md ml-2">
                    Today
                </span>
                <span className="ml-auto text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">
                    +20 AP
                </span>
            </div>

            {/* Question */}
            {questionData && !result && (
                <div>
                    <p className="text-sm text-[#F1F1F5] mt-3 mb-6 leading-relaxed">
                        {questionData.question}
                    </p>
                    <div className="grid gap-3">
                        {questionData.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedOption(opt)}
                                disabled={isSubmitting}
                                className={`text-left p-4 rounded-lg border transition-all text-sm
                                    ${selectedOption === opt
                                        ? "border-indigo-500/60 bg-indigo-500/5 text-[#F1F1F5]"
                                        : "border-[#22222E] hover:border-indigo-500/40 bg-[#0A0A0F] text-[#8B8BA7] hover:text-[#F1F1F5]"
                                    }
                                `}
                            >
                                <span className="text-[#5C5C7A] mr-2">{String.fromCharCode(65 + i)}.</span>
                                {opt}
                            </button>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedOption || isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-none"
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
                        </button>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-4 rounded-lg mb-4 flex gap-3 ${result.isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        <div className="mt-0.5">
                            {result.isCorrect ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg mb-1 text-[#F1F1F5]">
                                {result.isCorrect ? "Access Granted" : "Access Denied"}
                            </h3>
                            <p className="text-[#8B8BA7] leading-relaxed text-sm">
                                {result.explanation}
                            </p>
                            {result.isCorrect && (
                                <div className="mt-3 inline-block bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono text-xs px-2 py-0.5 rounded-md">
                                    + {result.earnedAura} AP Earned
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
