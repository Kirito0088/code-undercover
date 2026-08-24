"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Zap, 
    Flame, 
    CheckCircle, 
    XCircle, 
    Loader2, 
    RotateCw, 
    ChevronLeft, 
    ChevronRight, 
    BookOpen, 
    Terminal, 
    Check, 
    Sparkles
} from "lucide-react"
import type { DailyChallengeQuestion } from "@/components/dashboard/DailyChallenge"
import { flashcardsData, type Flashcard } from "@/src/data/flashcardsData"
import { HudPage } from "@/components/hud/HudPage"

interface DailyTasksClientProps {
    initialQuestion: DailyChallengeQuestion | null
    user: {
        name: string | null
        email: string | null
        auraPoints: number
        auraLevel: number
        comboStreak: number
    } | null
}

const DAILY_COMPLETION_KEY = "cu_daily_completed"
const DAILY_COMPLETION_EVENT = "cu_daily_completed_changed"

function getTodayKeyUTC() {
    return new Date().toISOString().split("T")[0]
}

export function DailyTasksClient({ initialQuestion, user }: DailyTasksClientProps) {
    const [activeTab, setActiveTab] = useState<"quiz" | "flashcard">("quiz")
    
    // User AP state for real-time fly-up increments
    const [auraPoints, setAuraPoints] = useState(user?.auraPoints ?? 0)
    const [apFlying, setApFlying] = useState<{ active: boolean; amount: number }>({ active: false, amount: 0 })

    // Quiz State
    const [quizCompleted, setQuizCompleted] = useState(false)
    const [selectedOption, setSelectedOption] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [quizResult, setQuizResult] = useState<{ isCorrect: boolean; explanation: string; earnedAura: number; correctAnswer: string } | null>(null)
    const [shakeKey, setShakeKey] = useState(0)

    // Flashcard State
    const [cards] = useState<Flashcard[]>(flashcardsData)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [masteredIds, setMasteredIds] = useState<Set<string>>(new Set())
    const [flashcardApClaimed, setFlashcardApClaimed] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>("ALL")

    useEffect(() => {
        const today = getTodayKeyUTC()
        const completed = localStorage.getItem(DAILY_COMPLETION_KEY) === today
        setQuizCompleted(completed)
    }, [])

    // Filter cards based on selected category
    const categories = ["ALL", ...Array.from(new Set(flashcardsData.map((c) => c.category)))]
    const filteredCards = selectedCategory === "ALL" 
        ? cards 
        : cards.filter((c) => c.category === selectedCategory)

    const activeCard = filteredCards[currentIndex] || filteredCards[0]

    // Navigation handlers for flashcards
    const handleNextCard = () => {
        setIsFlipped(false)
        setCurrentIndex((prev) => (prev + 1) % filteredCards.length)
    }

    const handlePrevCard = () => {
        setIsFlipped(false)
        setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length)
    }

    const toggleMastered = (id: string) => {
        setMasteredIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })

        // Check if all cards mastered
        if (masteredIds.size + 1 >= flashcardsData.length && !flashcardApClaimed) {
            setFlashcardApClaimed(true)
            triggerApFlyup(30)
        }
    }

    // Quiz submit handler
    const handleQuizSubmit = async () => {
        if (!selectedOption || !initialQuestion) return

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/daily-challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    questionId: initialQuestion.id,
                    answer: selectedOption,
                }),
            })

            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    const isCorrect = data.isCorrect
                    setQuizResult({
                        isCorrect,
                        explanation: data.explanation,
                        earnedAura: data.earnedAura,
                        correctAnswer: data.correctAnswer,
                    })

                    if (isCorrect) {
                        triggerApFlyup(data.earnedAura || 20)
                        import("canvas-confetti").then((module) => {
                            module.default({
                                particleCount: 100,
                                spread: 80,
                                origin: { y: 0.6 },
                                colors: ["#10B981", "#34D399", "#F59E0B", "#3B82F6"],
                            })
                        }).catch(() => {})
                    } else {
                        setShakeKey((prev) => prev + 1)
                    }

                    localStorage.setItem(DAILY_COMPLETION_KEY, getTodayKeyUTC())
                    window.dispatchEvent(new Event(DAILY_COMPLETION_EVENT))
                    setQuizCompleted(true)
                }
            }
        } catch (e) {
            console.error("Quiz submission failed", e)
        } finally {
            setIsSubmitting(false)
        }
    }

    const triggerApFlyup = (amount: number) => {
        setApFlying({ active: true, amount })
        setTimeout(() => {
            setAuraPoints((prev) => prev + amount)
            setApFlying({ active: false, amount: 0 })
        }, 1000)
    }

    return (
        <HudPage
            eyebrow="DAILY_PROTOCOL // INTEL_OPERATIONS"
            title="Daily Task Assignment"
            subtitle="Complete today's intercept quiz or review flashcards to earn AP rewards and keep your clearance streak active."
            maxWidth="max-w-[1100px]"
            status={
                <div className="relative flex items-center gap-4 bg-[#141814] border border-[#1F261F] px-4 py-2.5 rounded-lg font-mono shrink-0 self-start sm:self-auto">
                    <div className="text-right">
                        <span className="text-[9px] text-[#4A5D4A] block uppercase select-none">OPERATIONAL AP</span>
                        <span className="text-sm font-bold text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]">
                            {auraPoints} AP
                        </span>
                    </div>

                    {/* Floating AP Flyup chip animation */}
                    <AnimatePresence>
                        {apFlying.active && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                animate={{ opacity: 1, y: -30, scale: 1.1 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="absolute -top-3 right-4 bg-emerald-500 text-black font-extrabold text-xs px-2.5 py-1 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)] flex items-center gap-1 z-30"
                            >
                                <Sparkles className="size-3.5 fill-black" />
                                +{apFlying.amount} AP
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="h-6 w-px bg-[#1F261F]"></div>

                    <div className="flex items-center gap-1.5 text-amber-400">
                        <Flame className="size-4 fill-amber-400 animate-pulse" />
                        <span className="text-xs font-bold font-mono">x{user?.comboStreak ?? 1}</span>
                    </div>
                </div>
            }
        >

                {/* Top Tab Switcher */}
                <div className="flex justify-center">
                    <div className="bg-[#0D0E12] border border-[#1F261F] p-1.5 rounded-xl flex items-center gap-2 relative max-w-md w-full shadow-inner">
                        
                        {/* Option 1: Quiz Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab("quiz")}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 cursor-pointer border-none ${
                                activeTab === "quiz" ? "text-emerald-400" : "text-[#8F9F8F] hover:text-[#E2E8F0]"
                            }`}
                        >
                            {activeTab === "quiz" && (
                                <motion.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-[#182219] border border-emerald-500/40 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Terminal className="size-4 z-10" />
                            <span className="z-10 uppercase tracking-wider">Option 1: Quiz</span>
                        </button>

                        {/* Option 2: Flashcard Tab */}
                        <button
                            type="button"
                            onClick={() => setActiveTab("flashcard")}
                            className={`flex-1 py-2.5 px-4 rounded-lg font-mono text-xs font-bold transition-all relative z-10 flex items-center justify-center gap-2 cursor-pointer border-none ${
                                activeTab === "flashcard" ? "text-emerald-400" : "text-[#8F9F8F] hover:text-[#E2E8F0]"
                            }`}
                        >
                            {activeTab === "flashcard" && (
                                <motion.div
                                    layoutId="activeTabPill"
                                    className="absolute inset-0 bg-[#182219] border border-emerald-500/40 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <BookOpen className="size-4 z-10" />
                            <span className="z-10 uppercase tracking-wider">Option 2: Flashcard</span>
                        </button>
                    </div>
                </div>

                {/* Tab Views Content */}
                <AnimatePresence mode="wait">
                    {activeTab === "quiz" ? (
                        <motion.div
                            key="quiz-tab"
                            initial={{ opacity: 0, x: -15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 15 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex flex-col gap-6"
                        >
                            {/* Quiz Card View */}
                            {initialQuestion ? (
                                <motion.div 
                                    key={shakeKey}
                                    animate={shakeKey > 0 && quizResult && !quizResult.isCorrect ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                    className="bg-[#0D0E12] border border-[#1F261F] rounded-2xl p-6 sm:p-8 relative overflow-hidden text-left shadow-[0_15px_40px_rgba(0,0,0,0.6)]"
                                >
                                    <div className="flex justify-between items-center border-b border-[#1F261F] pb-4 mb-6">
                                        <div className="flex items-center gap-2">
                                            <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono px-2.5 py-1 rounded font-bold uppercase tracking-wider">
                                                DAILY INTERCEPT QUIZ
                                            </span>
                                            <span className="text-amber-400 text-xs font-mono font-bold flex items-center gap-1">
                                                <Zap className="size-3.5 fill-amber-400" />
                                                +20 AP PAYLOAD
                                            </span>
                                        </div>

                                        {quizCompleted && (
                                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
                                                <CheckCircle className="size-3.5 text-emerald-400" />
                                                DECRYPTED TODAY
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-lg sm:text-xl font-bold font-sans text-[#E2E8F0] leading-snug mb-6">
                                        {initialQuestion.question}
                                    </h3>

                                    {/* Options List */}
                                    <div className="grid gap-3 mb-6">
                                        {initialQuestion.options.map((opt, idx) => {
                                            const letter = String.fromCharCode(65 + idx)
                                            const isSelected = selectedOption === opt
                                            const isCorrectChoice = quizResult && quizResult.correctAnswer === opt
                                            const isWrongChoice = quizResult && isSelected && !quizResult.isCorrect

                                            let styleClass = "bg-[#13161D] border-[#1F261F] text-[#8F9F8F] hover:bg-[#181C18] hover:border-emerald-500/30 hover:text-white"
                                            let badgeClass = "bg-[#07080A] border-[#1F261F] text-[#4A5D4A]"

                                            if (isSelected && !quizResult) {
                                                styleClass = "bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)] font-semibold"
                                                badgeClass = "bg-emerald-500 text-black font-bold border-emerald-400"
                                            } else if (quizResult) {
                                                if (isCorrectChoice) {
                                                    styleClass = "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.25)] font-semibold"
                                                    badgeClass = "bg-emerald-500 text-black font-bold border-emerald-400"
                                                } else if (isWrongChoice) {
                                                    styleClass = "bg-red-500/20 border-red-500 text-red-200 font-semibold"
                                                    badgeClass = "bg-red-500 text-white font-bold border-red-400"
                                                }
                                            }

                                            return (
                                                <motion.button
                                                    key={opt}
                                                    type="button"
                                                    disabled={!!quizResult}
                                                    onClick={() => setSelectedOption(opt)}
                                                    whileHover={!quizResult ? { scale: 1.01, x: 4 } : {}}
                                                    whileTap={!quizResult ? { scale: 0.98 } : {}}
                                                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-3 font-sans transition-all cursor-pointer ${styleClass}`}
                                                >
                                                    <div className="flex items-center gap-3.5 min-w-0">
                                                        <span className={`w-7 h-7 rounded-md border flex items-center justify-center text-xs font-mono shrink-0 transition-colors ${badgeClass}`}>
                                                            {letter}
                                                        </span>
                                                        <span className="font-mono text-sm tracking-wide break-words">{opt}</span>
                                                    </div>

                                                    {quizResult && isCorrectChoice && (
                                                        <CheckCircle className="size-5 text-emerald-400 shrink-0" />
                                                    )}
                                                    {quizResult && isWrongChoice && (
                                                        <XCircle className="size-5 text-red-400 shrink-0" />
                                                    )}
                                                </motion.button>
                                            )
                                        })}
                                    </div>

                                    {/* Explanation Box */}
                                    <AnimatePresence>
                                        {quizResult && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className={`p-5 rounded-xl border flex gap-3.5 mb-6 ${
                                                    quizResult.isCorrect 
                                                        ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-300"
                                                        : "bg-red-950/30 border-red-500/40 text-red-300"
                                                }`}
                                            >
                                                <div className="shrink-0 mt-0.5">
                                                    {quizResult.isCorrect ? (
                                                        <CheckCircle className="size-5 text-emerald-400" />
                                                    ) : (
                                                        <XCircle className="size-5 text-red-400" />
                                                    )}
                                                </div>
                                                <div className="space-y-1 text-left">
                                                    <p className="font-mono font-bold text-xs uppercase tracking-wider text-white">
                                                        {quizResult.isCorrect ? "DECRYPTION SUCCESSFUL (+20 AP)" : "DECRYPTION FAILED"}
                                                    </p>
                                                    <p className="text-xs font-sans text-[#8F9F8F] leading-relaxed">
                                                        {quizResult.explanation}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Actions */}
                                    <div className="flex justify-end border-t border-[#1F261F] pt-4">
                                        {!quizResult ? (
                                            <button
                                                type="button"
                                                disabled={!selectedOption || isSubmitting}
                                                onClick={handleQuizSubmit}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold font-mono px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:pointer-events-none cursor-pointer border-none flex items-center gap-2 uppercase tracking-wider"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        <span>Decrypting...</span>
                                                    </>
                                                ) : (
                                                    <span>Submit Intercept Answer</span>
                                                )}
                                            </button>
                                        ) : (
                                            <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                                <Check className="size-4 text-emerald-400" />
                                                Daily Intercept Logged
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-2xl p-8 text-center text-[#8F9F8F] font-mono text-xs">
                                    No active daily intercept question available. Check back tomorrow!
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        /* Option 2: Flashcard View */
                        <motion.div
                            key="flashcard-tab"
                            initial={{ opacity: 0, x: 15 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -15 }}
                            transition={{ duration: 0.3 }}
                            className="w-full flex flex-col gap-6"
                        >
                            {/* Category Filter Bar */}
                            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 border-b border-[#1F261F] scrollbar-none">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-mono text-[#4A5D4A] uppercase shrink-0">FILTER:</span>
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => {
                                                setSelectedCategory(cat)
                                                setCurrentIndex(0)
                                                setIsFlipped(false)
                                            }}
                                            className={`px-3 py-1 rounded-md text-[11px] font-mono font-medium transition-all cursor-pointer whitespace-nowrap border ${
                                                selectedCategory === cat
                                                    ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                                                    : "bg-[#0D0E12] border-[#1F261F] text-[#8F9F8F] hover:text-[#E2E8F0] hover:border-emerald-500/20"
                                            }`}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>

                                <div className="text-[10px] font-mono text-[#4A5D4A] shrink-0">
                                    MASTERED: <strong className="text-emerald-400">{masteredIds.size}/{flashcardsData.length}</strong>
                                </div>
                            </div>

                            {/* 3D Flippable Flashcard Container */}
                            <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
                                <div 
                                    className="w-full h-[340px] sm:h-[360px] cursor-pointer group select-none relative"
                                    style={{ perspective: "1000px" }}
                                    onClick={() => setIsFlipped(!isFlipped)}
                                >
                                    <motion.div
                                        className="w-full h-full relative"
                                        style={{ transformStyle: "preserve-3d" }}
                                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                                        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                                    >
                                        {/* FRONT FACE */}
                                        <div 
                                            className="absolute inset-0 w-full h-full bg-[#0D0E12] border border-[#1F261F] group-hover:border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-left"
                                            style={{ backfaceVisibility: "hidden" }}
                                        >
                                            <div className="flex justify-between items-center font-mono">
                                                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded font-bold uppercase">
                                                    {activeCard.category}
                                                </span>
                                                <span className="text-[9px] text-[#4A5D4A]">
                                                    CARD #{currentIndex + 1} OF {filteredCards.length}
                                                </span>
                                            </div>

                                            <div className="my-auto text-center px-4">
                                                <span className="text-[10px] font-mono text-[#4A5D4A] uppercase tracking-widest block mb-2">
                                                    [ CONCEPT / INTEL QUESTION ]
                                                </span>
                                                <h3 className="text-base sm:text-lg font-bold font-sans text-[#E2E8F0] leading-snug">
                                                    {activeCard.front}
                                                </h3>
                                            </div>

                                            <div className="flex justify-between items-center border-t border-[#1F261F] pt-3 text-[10px] font-mono text-[#4A5D4A]">
                                                <span className="flex items-center gap-1 text-emerald-400">
                                                    <RotateCw className="size-3" /> CLICK TO FLIP DEBRIEF
                                                </span>
                                                <span>DIFFICULTY: {activeCard.difficulty}</span>
                                            </div>
                                        </div>

                                        {/* BACK FACE */}
                                        <div 
                                            className="absolute inset-0 w-full h-full bg-[#10141A] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-[0_0_35px_rgba(16,185,129,0.15)] text-left"
                                            style={{ 
                                                backfaceVisibility: "hidden", 
                                                transform: "rotateY(180deg)" 
                                            }}
                                        >
                                            <div className="flex justify-between items-center font-mono">
                                                <span className="text-[10px] text-emerald-300 font-bold uppercase">
                                                    SYSTEM DEBRIEF EXPLANATION
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        toggleMastered(activeCard.id)
                                                    }}
                                                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono transition-all border cursor-pointer ${
                                                        masteredIds.has(activeCard.id)
                                                            ? "bg-emerald-500 text-black border-emerald-400 font-bold"
                                                            : "bg-[#181C18] border-[#1F261F] text-[#8F9F8F] hover:text-emerald-400"
                                                    }`}
                                                >
                                                    {masteredIds.has(activeCard.id) ? "✓ MASTERED" : "MARK MASTERED"}
                                                </button>
                                            </div>

                                            <div className="my-auto overflow-y-auto max-h-[200px] pr-1 space-y-3">
                                                <p className="text-xs text-[#E2E8F0] leading-relaxed font-sans">
                                                    {activeCard.back}
                                                </p>

                                                {activeCard.codeSnippet && (
                                                    <div className="bg-[#07080A] border border-[#1F261F] p-3 rounded-lg font-mono text-[11px] text-emerald-400 overflow-x-auto">
                                                        <pre>{activeCard.codeSnippet}</pre>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex justify-between items-center border-t border-[#1F261F] pt-3 text-[10px] font-mono text-[#4A5D4A]">
                                                <span className="flex items-center gap-1 text-emerald-400">
                                                    <RotateCw className="size-3" /> CLICK TO FLIP FRONT
                                                </span>
                                                <div className="flex gap-1">
                                                    {activeCard.tags.map((t) => (
                                                        <span key={t} className="text-[8px] bg-[#181C18] text-[#8F9F8F] px-1.5 py-0.5 rounded">
                                                            #{t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>

                                {/* Flashcard Navigation Controls */}
                                <div className="flex items-center justify-between gap-4 w-full font-mono">
                                    <button
                                        type="button"
                                        onClick={handlePrevCard}
                                        className="bg-[#0D0E12] hover:bg-[#181C18] border border-[#1F261F] hover:border-emerald-500/30 text-[#E2E8F0] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <ChevronLeft className="size-4 text-emerald-400" />
                                        <span>PREVIOUS</span>
                                    </button>

                                    <span className="text-xs text-[#8F9F8F] font-bold">
                                        {currentIndex + 1} / {filteredCards.length}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={handleNextCard}
                                        className="bg-[#0D0E12] hover:bg-[#181C18] border border-[#1F261F] hover:border-emerald-500/30 text-[#E2E8F0] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>NEXT</span>
                                        <ChevronRight className="size-4 text-emerald-400" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

        </HudPage>
    )
}
