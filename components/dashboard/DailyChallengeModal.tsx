"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { X, Zap, Loader2, CheckCircle, XCircle } from "lucide-react"
import confetti from "canvas-confetti"

export interface DailyChallengeQuestion {
    id: string
    question: string
    options: string[]
}

interface DailyChallengeModalProps {
    initialQuestion: DailyChallengeQuestion | null
}

const DAILY_COMPLETION_KEY = "cu_daily_completed"
const DAILY_COMPLETION_EVENT = "cu_daily_completed_changed"
const DAILY_DISMISSAL_KEY = "cu_daily_dismissed"
const DAILY_TRIGGER_EVENT = "cu_daily_modal_trigger"

function getTodayKeyUTC() {
    return new Date().toISOString().split("T")[0]
}

export function DailyChallengeModal({ initialQuestion }: DailyChallengeModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [result, setResult] = useState<{ isCorrect: boolean; explanation: string; earnedAura: number; correctAnswer: string } | null>(null)
    const [shakeKey, setShakeKey] = useState(0)

    useEffect(() => {
        if (!initialQuestion) return

        const today = getTodayKeyUTC()
        const isCompleted = localStorage.getItem(DAILY_COMPLETION_KEY) === today
        const isDismissed = sessionStorage.getItem(DAILY_DISMISSAL_KEY) === today

        // Auto-open after 500ms if not completed and not dismissed in this session
        if (!isCompleted && !isDismissed) {
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [initialQuestion])

    // Listen for manual trigger event from the dashboard card
    useEffect(() => {
        const handleTrigger = () => {
            setSelectedOption(null)
            setResult(null)
            setIsOpen(true)
        }

        window.addEventListener(DAILY_TRIGGER_EVENT, handleTrigger)
        return () => {
            window.removeEventListener(DAILY_TRIGGER_EVENT, handleTrigger)
        }
    }, [])

    const handleDismiss = () => {
        const today = getTodayKeyUTC()
        sessionStorage.setItem(DAILY_DISMISSAL_KEY, today)
        setIsOpen(false)
    }

    const handleSubmit = async () => {
        if (!selectedOption || !initialQuestion) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/daily-challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: initialQuestion.id,
                    answer: selectedOption
                })
            })
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
                    // Celebrate with premium confetti burst
                    confetti({
                        particleCount: 80,
                        spread: 60,
                        origin: { y: 0.7 },
                        colors: ["#10B981", "#34D399", "#3B82F6", "#60A5FA"]
                    })
                } else {
                    // Trigger shake animation
                    setShakeKey(prev => prev + 1)
                }

                // Save completion status
                localStorage.setItem(DAILY_COMPLETION_KEY, getTodayKeyUTC())
                window.dispatchEvent(new Event(DAILY_COMPLETION_EVENT))
            }
        } catch (e) {
            console.error("Failed to submit daily challenge answer", e)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!initialQuestion) return null

    // Stagger animation settings
    const containerVariants: Variants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.08
            }
        }
    }

    const itemVariants: Variants = {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-md select-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        layout
                        className={`relative w-full max-w-lg overflow-hidden bg-[#1E293B] border rounded-3xl p-6 md:p-8 shadow-2xl transition-colors duration-300 ${
                            result 
                                ? result.isCorrect 
                                    ? "border-emerald-500/40 shadow-emerald-950/20" 
                                    : "border-red-500/40 shadow-red-950/20"
                                : "border-slate-700/60 shadow-black/40"
                        }`}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 10 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    >
                        <motion.div
                            key={shakeKey}
                            animate={shakeKey > 0 && result && !result.isCorrect ? { x: [-8, 8, -6, 6, -2, 2, 0] } : {}}
                            transition={{ duration: 0.4 }}
                        >
                            {/* Dismiss X button */}
                            <button
                                type="button"
                                onClick={handleDismiss}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors border-none bg-transparent cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <motion.div
                                variants={containerVariants}
                                initial="initial"
                                animate="animate"
                                className="space-y-6"
                            >
                                {/* Header */}
                                <motion.div variants={itemVariants} className="space-y-2 text-left">
                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            <Zap className="w-3.5 h-3.5 fill-current text-amber-400" />
                                            +20 AP • Today&apos;s Challenge
                                        </span>
                                        <span className="text-xs font-medium text-slate-400">🔥 Streak x1</span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-white tracking-tight pt-2 leading-snug">
                                        {initialQuestion.question}
                                    </h3>
                                </motion.div>

                                {/* Options list */}
                                <motion.div variants={itemVariants} className="space-y-3 text-left">
                                    {initialQuestion.options.map((option, idx) => (
                                        <motion.button
                                            type="button"
                                            key={option}
                                            onClick={() => !result && setSelectedOption(option)}
                                            whileHover={!result ? { scale: 1.01, x: 4 } : {}}
                                            whileTap={!result ? { scale: 0.98 } : {}}
                                            className={`w-full p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 font-mono text-sm text-left ${
                                                selectedOption === option
                                                    ? "bg-emerald-500/10 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.15)] font-semibold"
                                                    : "bg-[#0F172A] border-slate-800 text-slate-300 hover:border-slate-600"
                                            } ${result ? "pointer-events-none opacity-80" : ""}`}
                                        >
                                            <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-sans font-bold text-slate-400 shrink-0">
                                                {String.fromCharCode(65 + idx)}
                                            </span>
                                            <span>{option}</span>
                                        </motion.button>
                                    ))}
                                </motion.div>

                                {/* Dynamic explanation response */}
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 rounded-xl border flex gap-3 text-left ${
                                            result.isCorrect
                                                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                                                : "bg-red-950/30 border-red-500/40 text-red-300"
                                        }`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {result.isCorrect ? <CheckCircle className="size-5" /> : <XCircle className="size-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm mb-1 text-white">
                                                {result.isCorrect ? "ACCESS GRANTED (+20 AP)" : "ACCESS DENIED"}
                                            </p>
                                            <p className="text-xs text-slate-300 font-sans leading-relaxed">
                                                {result.explanation}
                                            </p>
                                        </div>
                                    </motion.div>
                                )}

                                {/* Actions footer */}
                                <motion.div variants={itemVariants} className="flex items-center justify-end gap-3 pt-2">
                                    {!result ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleDismiss}
                                                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                                            >
                                                Skip for Today
                                            </button>
                                            <button
                                                type="button"
                                                disabled={selectedOption === null || isSubmitting}
                                                onClick={handleSubmit}
                                                className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none text-white shadow-lg shadow-emerald-500/20 transition-all border-none flex items-center gap-2 cursor-pointer"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Checking...
                                                    </>
                                                ) : (
                                                    "Submit Answer"
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsOpen(false)}
                                            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors border-none cursor-pointer"
                                        >
                                            Continue to Dashboard
                                        </button>
                                    )}
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
