"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { X, Zap, Loader2, CheckCircle, XCircle, Flame, ArrowRight } from "lucide-react"

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

    // Listen for manual trigger event from the dashboard card or navigation
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
                    // Celebrate with premium confetti burst dynamically loaded on client
                    import("canvas-confetti").then((module) => {
                        const confetti = module.default
                        confetti({
                            particleCount: 90,
                            spread: 70,
                            origin: { y: 0.65 },
                            colors: ["#10B981", "#34D399", "#F59E0B", "#3B82F6"]
                        })
                    }).catch(err => {
                        console.error("Failed to load confetti", err)
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

    if (!initialQuestion || !Array.isArray(initialQuestion.options) || initialQuestion.options.length === 0) return null

    const safeOptions = Array.from(new Set(initialQuestion.options.filter(Boolean)))

    // Stagger animation settings
    const containerVariants: Variants = {
        initial: { opacity: 0 },
        animate: {
            opacity: 1,
            transition: {
                staggerChildren: 0.07
            }
        }
    }

    const itemVariants: Variants = {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 22 } }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070B14]/80 backdrop-blur-md select-none overflow-y-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) handleDismiss()
                    }}
                >
                    <motion.div
                        layout
                        className={`relative w-full max-w-lg md:max-w-xl overflow-hidden bg-[#131C2E] border rounded-3xl p-6 md:p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] transition-colors duration-300 ${
                            result 
                                ? result.isCorrect 
                                    ? "border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.18)]" 
                                    : "border-red-500/40 shadow-[0_0_40px_rgba(239,68,68,0.18)]"
                                : "border-slate-700/60 shadow-[0_0_30px_rgba(16,185,129,0.08)]"
                        }`}
                        initial={{ scale: 0.94, opacity: 0, y: 24 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.94, opacity: 0, y: 16 }}
                        transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    >
                        {/* Soft ambient background glow */}
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#10b98112,transparent_75%)] pointer-events-none" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                        <motion.div
                            key={shakeKey}
                            animate={shakeKey > 0 && result && !result.isCorrect ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                            transition={{ duration: 0.4 }}
                            className="relative z-10"
                        >
                            {/* Dismiss X button */}
                            <button
                                type="button"
                                onClick={handleDismiss}
                                title="Dismiss debrief modal"
                                className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all border border-slate-700/60 cursor-pointer shadow-sm z-20"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            <motion.div
                                variants={containerVariants}
                                initial="initial"
                                animate="animate"
                                className="space-y-6"
                            >
                                {/* Header badges */}
                                <motion.div variants={itemVariants} className="space-y-3 text-left">
                                    <div className="flex items-center gap-2 pr-10 flex-wrap">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                                            <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                                            +20 AP • Today&apos;s Challenge
                                        </span>
                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                                            Streak x1
                                        </span>
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-white tracking-tight leading-snug pt-1 font-sans">
                                        {initialQuestion.question}
                                    </h3>
                                </motion.div>

                                {/* Options list */}
                                <motion.div variants={itemVariants} className="space-y-3 text-left">
                                    {safeOptions.map((option, idx) => {
                                        const optionLetter = String.fromCharCode(65 + idx)
                                        const isSelected = selectedOption === option
                                        const isCorrectChoice = result && result.correctAnswer === option
                                        const isWrongChoice = result && isSelected && !result.isCorrect

                                        let buttonStyles = "bg-[#0B101D]/70 border-slate-800 text-slate-300 hover:bg-[#162035] hover:border-slate-700 hover:text-white"
                                        let badgeStyles = "bg-[#1E293B] border-slate-700/80 text-slate-400"

                                        if (isSelected && !result) {
                                            buttonStyles = "bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40 font-semibold"
                                            badgeStyles = "bg-emerald-500 text-slate-950 font-bold border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                                        } else if (result) {
                                            if (isCorrectChoice) {
                                                buttonStyles = "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] font-semibold"
                                                badgeStyles = "bg-emerald-500 text-slate-950 font-bold border-emerald-400"
                                            } else if (isWrongChoice) {
                                                buttonStyles = "bg-red-500/20 border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.2)] font-semibold"
                                                badgeStyles = "bg-red-500 text-white font-bold border-red-400"
                                            }
                                        }

                                        return (
                                            <motion.button
                                                type="button"
                                                key={option}
                                                onClick={() => !result && setSelectedOption(option)}
                                                whileHover={!result ? { scale: 1.01, x: 4 } : {}}
                                                whileTap={!result ? { scale: 0.98 } : {}}
                                                className={`w-full p-3.5 md:p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3.5 font-sans text-sm text-left ${buttonStyles} ${result ? "pointer-events-none" : ""}`}
                                            >
                                                <div className="flex items-center gap-3.5 min-w-0">
                                                    <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-mono shrink-0 transition-colors ${badgeStyles}`}>
                                                        {optionLetter}
                                                    </span>
                                                    <span className="font-mono text-sm tracking-wide break-words">{option}</span>
                                                </div>

                                                {result && isCorrectChoice && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                                )}
                                                {result && isWrongChoice && (
                                                    <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                                                )}
                                            </motion.button>
                                        )
                                    })}
                                </motion.div>

                                {/* Dynamic explanation debrief response */}
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 md:p-5 rounded-2xl border flex gap-3.5 text-left ${
                                            result.isCorrect
                                                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                                                : "bg-red-950/40 border-red-500/40 text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.15)]"
                                        }`}
                                    >
                                        <div className="mt-0.5 shrink-0">
                                            {result.isCorrect ? <CheckCircle className="size-5 text-emerald-400" /> : <XCircle className="size-5 text-red-400" />}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm text-white font-mono uppercase tracking-wider">
                                                {result.isCorrect ? "DECRYPTION SUCCESSFUL (+20 AP)" : "DECRYPTION FAILED"}
                                            </p>
                                            <p className="text-xs text-slate-300 font-sans leading-relaxed">
                                                {result.explanation}
                                            </p>
                                            {!result.isCorrect && result.correctAnswer && (
                                                <p className="text-xs font-mono text-amber-400 pt-1">
                                                    Correct Option: <span className="font-bold">{result.correctAnswer}</span>
                                                </p>
                                            )}
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
                                                className="px-4 py-2 text-xs md:text-sm font-medium text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer hover:underline underline-offset-4"
                                            >
                                                Skip for Today
                                            </button>
                                            <button
                                                type="button"
                                                disabled={selectedOption === null || isSubmitting}
                                                onClick={handleSubmit}
                                                className="px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all border-none disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2 cursor-pointer font-mono uppercase tracking-wider"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Decrypting...
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
                                            className="w-full py-3 rounded-xl text-xs md:text-sm font-bold font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                                        >
                                            <span>Continue to Mission Control</span>
                                            <ArrowRight className="w-4 h-4" />
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
