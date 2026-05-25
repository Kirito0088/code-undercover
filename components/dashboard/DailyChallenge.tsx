"use client"

import { useState, useSyncExternalStore } from "react"
import { CheckCircle, XCircle, Zap, Loader2 } from "lucide-react"

export interface DailyChallengeQuestion {
    id: string
    question: string
    options: string[]
}

interface DailyChallengeProps {
    initialQuestion: DailyChallengeQuestion | null
}

const DAILY_COMPLETION_KEY = "cu_daily_completed"
const DAILY_COMPLETION_EVENT = "cu_daily_completed_changed"

function getTodayKeyUTC() {
    return new Date().toISOString().split("T")[0]
}

function getDailyCompletionSnapshot() {
    if (typeof window === "undefined") return false
    return localStorage.getItem(DAILY_COMPLETION_KEY) === getTodayKeyUTC()
}

function subscribeToDailyCompletion(onStoreChange: () => void) {
    if (typeof window === "undefined") return () => {}

    const handleStorage = (event: StorageEvent) => {
        if (event.key === DAILY_COMPLETION_KEY) onStoreChange()
    }
    const handleLocalChange = () => onStoreChange()

    window.addEventListener("storage", handleStorage)
    window.addEventListener(DAILY_COMPLETION_EVENT, handleLocalChange)

    return () => {
        window.removeEventListener("storage", handleStorage)
        window.removeEventListener(DAILY_COMPLETION_EVENT, handleLocalChange)
    }
}

function uniqueOptions(options: string[]) {
    return Array.from(new Set(options))
}

export function DailyChallenge({ initialQuestion }: DailyChallengeProps) {
    const completedToday = useSyncExternalStore(
        subscribeToDailyCompletion,
        getDailyCompletionSnapshot,
        () => false
    )
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; earnedAura: number } | null>(null)

    const questionData = initialQuestion
        ? { ...initialQuestion, options: uniqueOptions(initialQuestion.options) }
        : null
    const status = completedToday || !questionData ? "completed" : "ready"

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

                localStorage.setItem(DAILY_COMPLETION_KEY, getTodayKeyUTC())
                window.dispatchEvent(new Event(DAILY_COMPLETION_EVENT))
            }
        } catch (e) {
            console.error("Failed to submit answer", e)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (status === "completed" && !result) {
        return (
            <div className="bg-[#1C1C24]/50 border border-[#323242] rounded-xl p-6 my-8 text-center flex items-center justify-center flex-col">
                <Zap className="size-8 text-amber-400 mb-2 opacity-50" />
                <h3 className="text-[#8B8BA7] font-medium">Daily Challenge Completed</h3>
                <p className="text-[#5C5C7A] text-sm mt-1">Return tomorrow for another chance to earn Aura.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#1C1C24] border border-[#323242] rounded-xl p-6 my-8 relative overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 border-b border-[#323242] pb-4">
                <Zap className="size-5 text-amber-400" />
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
                                type="button"
                                key={opt}
                                onClick={() => setSelectedOption(opt)}
                                disabled={isSubmitting}
                                className={`text-left p-4 rounded-lg border transition-all text-sm
                                    ${selectedOption === opt
                                        ? "border-indigo-500/60 bg-indigo-500/5 text-[#F1F1F5]"
                                        : "border-[#323242] hover:border-indigo-500/40 bg-[#14141A] text-[#8B8BA7] hover:text-[#F1F1F5]"
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
                            type="button"
                            onClick={handleSubmit}
                            disabled={!selectedOption || isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-md font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border-none"
                        >
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Submit"}
                        </button>
                    </div>
                </div>
            )}

            {/* Result */}
            {result && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className={`p-4 rounded-lg mb-4 flex gap-3 ${result.isCorrect ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                        <div className="mt-0.5">
                            {result.isCorrect ? <CheckCircle className="size-5" /> : <XCircle className="size-5" />}
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
