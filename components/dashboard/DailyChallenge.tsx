"use client"

import { useState, useSyncExternalStore } from "react"
import { CheckCircle, XCircle, Zap, Loader2, Flame, Maximize2 } from "lucide-react"

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
const DAILY_TRIGGER_EVENT = "cu_daily_modal_trigger"

function getTodayKeyUTC() {
    return new Date().toISOString().split("T")[0]
}

function getDailyCompletionSnapshot() {
    if (typeof window === "undefined") return false
    return localStorage.getItem(DAILY_COMPLETION_KEY) === getTodayKeyUTC()
}

function subscribeToDailyCompletion(onStoreChange: () => void) {
    if (typeof window === "undefined") return () => { }

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

function uniqueOptions(options?: string[]) {
    if (!Array.isArray(options)) return []
    return Array.from(new Set(options.filter(Boolean)))
}

export function DailyChallenge({ initialQuestion }: DailyChallengeProps) {
    const completedToday = useSyncExternalStore(
        subscribeToDailyCompletion,
        getDailyCompletionSnapshot,
        () => false
    )
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; earnedAura: number; correctAnswer: string } | null>(null)

    if (!initialQuestion || !Array.isArray(initialQuestion.options) || initialQuestion.options.length === 0) return null

    const questionData = {
        ...initialQuestion,
        options: uniqueOptions(initialQuestion.options)
    }

    const openModal = () => {
        window.dispatchEvent(new Event(DAILY_TRIGGER_EVENT))
    }

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

            if (!res.ok) {
                console.error("Daily challenge API request failed with status:", res.status)
                setIsSubmitting(false)
                return
            }

            const data = await res.json()

            if (data.success) {
                const isCorrect = data.isCorrect
                setResult({
                    isCorrect,
                    explanation: data.explanation,
                    earnedAura: data.earnedAura,
                    correctAnswer: data.correctAnswer
                })

                if (isCorrect) {
                    import("canvas-confetti").then((module) => {
                        const confetti = module.default
                        confetti({
                            particleCount: 80,
                            spread: 65,
                            origin: { y: 0.7 },
                            colors: ["#10B981", "#34D399", "#F59E0B", "#3B82F6"]
                        })
                    }).catch(err => {
                        console.error("Failed to load confetti", err)
                    })
                }

                localStorage.setItem(DAILY_COMPLETION_KEY, getTodayKeyUTC())
                window.dispatchEvent(new Event(DAILY_COMPLETION_EVENT))
            }
        } catch (e) {
            console.error("Failed to submit answer", e)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (completedToday && !result) {
        return (
            <div className="bg-[#131C2E] border border-emerald-500/20 rounded-2xl p-6 text-center flex items-center justify-center flex-col select-none relative overflow-hidden group shadow-lg">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#10b98110,transparent_70%)] pointer-events-none"></div>
                <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <Zap className="size-6 text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
                <h3 className="text-white font-mono text-sm font-bold tracking-wide uppercase">DAILY INTELLIGENCE DEBRIEF COMPLETED</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-md font-sans">
                    You have successfully answered today&apos;s intercept challenge and earned your AP boost. Return tomorrow for your next assignment.
                </p>
            </div>
        )
    }

    return (
        <div className="bg-[#131C2E] border border-slate-700/60 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#10b98110,transparent_70%)] pointer-events-none"></div>
            
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-6 border-b border-slate-800/80 pb-4 relative z-10 select-none flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                        <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                        +20 AP • Today&apos;s Challenge
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                        <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                        Streak x1
                    </span>
                </div>
                
                <button
                    type="button"
                    onClick={openModal}
                    title="Expand full modal view"
                    className="text-xs font-mono text-slate-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 px-2.5 py-1 rounded-lg"
                >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Expand Modal</span>
                </button>
            </div>

            {/* Question & Options */}
            {!result ? (
                <div className="relative z-10 space-y-6">
                    <h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug text-left font-sans">
                        {questionData.question}
                    </h3>
                    
                    <div className="grid gap-3">
                        {questionData.options.map((opt, i) => {
                            const optionLetter = String.fromCharCode(65 + i)
                            const isSelected = selectedOption === opt
                            
                            return (
                                <button
                                    type="button"
                                    key={opt}
                                    onClick={() => setSelectedOption(opt)}
                                    disabled={isSubmitting}
                                    className={`text-left p-3.5 md:p-4 rounded-xl border transition-all text-sm font-sans cursor-pointer flex items-center gap-3.5 ${
                                        isSelected
                                            ? "border-emerald-500 bg-emerald-500/15 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40 font-semibold"
                                            : "border-slate-800 bg-[#0B101D]/70 text-slate-300 hover:bg-[#162035] hover:border-slate-700 hover:text-white"
                                    }`}
                                >
                                    <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono shrink-0 transition-colors ${
                                        isSelected
                                            ? "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                            : "bg-[#1E293B] border-slate-700/80 text-slate-400"
                                    }`}>
                                        {optionLetter}
                                    </span>
                                    <span className="font-mono text-sm tracking-wide">{opt}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!selectedOption || isSubmitting}
                            className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all border-none disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 cursor-pointer font-mono uppercase tracking-wider"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    <span>Decrypting...</span>
                                </>
                            ) : (
                                <span>Submit Answer</span>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* Result Screen */
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10 text-left">
                    <div className={`p-5 rounded-2xl border flex gap-3.5 ${
                        result.isCorrect 
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)]' 
                            : 'bg-red-950/40 border-red-500/40 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                    }`}>
                        <div className="mt-0.5 shrink-0">
                            {result.isCorrect ? <CheckCircle className="size-5 text-emerald-400" /> : <XCircle className="size-5 text-red-400" />}
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold font-mono text-sm tracking-wider uppercase text-white">
                                {result.isCorrect ? "DECRYPTION SUCCESSFUL" : "DECRYPTION FAILED"}
                            </h4>
                            <p className="opacity-95 leading-relaxed text-xs font-sans text-slate-300">
                                {result.explanation}
                            </p>
                            {result.isCorrect && (
                                <div className="mt-3 inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-xs px-2.5 py-0.5 rounded-md select-none">
                                    + {result.earnedAura} AP GRANTED
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
