"use client"

import { useState } from "react"
import { MissionRecord } from "@/types"
import { UserCheck, Zap, AlertTriangle } from "lucide-react"

interface MCQPhaseProps {
    mission: MissionRecord
    onComplete: () => void
}

export function MCQPhase({ mission, onComplete }: MCQPhaseProps) {
    let questions: { id?: number; question: string; options: string[]; correctIndex: number }[] = []

    try {
        questions = mission.mcqContent
            ? JSON.parse(mission.mcqContent)
            : []
    } catch {
        questions = []
    }

    // Guarantee at least one fallback question
    if (!Array.isArray(questions) || questions.length === 0) {
        if (mission.order === 1) {
            questions = [
                {
                    id: 1,
                    question: "What is the primary function of printf() in C?",
                    options: [
                        "To take input from the user",
                        "To display output on the screen",
                        "To perform mathematical operations",
                        "To load variables directly into memory",
                    ],
                    correctIndex: 1,
                },
                {
                    id: 2,
                    question: "Which header file must be included to use the printf() function?",
                    options: [
                        "<math.h>",
                        "<string.h>",
                        "<stdlib.h>",
                        "<stdio.h>",
                    ],
                    correctIndex: 3,
                },
            ]
        } else {
            questions = [
                {
                    id: 1,
                    question: "What is the main use of scanf() in C?",
                    options: [
                        "To print output",
                        "To take input from user",
                        "To perform calculations",
                        "To store data permanently",
                    ],
                    correctIndex: 1,
                },
                {
                    id: 2,
                    question: "In C-language Which symbol is used before variables in scanf()?",
                    options: [
                        "#",
                        "@",
                        "&",
                        "%",
                    ],
                    correctIndex: 2,
                },
            ]
        }
    }

    const [currentQIndex, setCurrentQIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [showError, setShowError] = useState(false)

    // Clamp index to valid range
    const safeIndex = Math.min(currentQIndex, questions.length - 1)
    const q = questions[safeIndex]

    const handleSubmit = () => {
        if (selectedOption === null || !q) return

        if (selectedOption !== q.correctIndex) {
            setShowError(true)
            setTimeout(() => setShowError(false), 2000)
            return
        }

        if (safeIndex < questions.length - 1) {
            setCurrentQIndex(safeIndex + 1)
            setSelectedOption(null)
            setShowError(false)
        } else {
            onComplete()
        }
    }

    const getButtonClass = (index: number) => {
        const base = "w-full text-left p-4 rounded-xl border transition-all duration-200 outline-none"
        if (selectedOption === index) {
            return `${base} bg-indigo-500/5 border-indigo-500/60`
        }
        return `${base} bg-[#0A0A0F] border-[#22222E] hover:border-indigo-500/40`
    }

    const getLabelClass = (index: number) => {
        const base = "text-xs font-mono w-6 h-6 flex items-center justify-center rounded border"
        if (selectedOption === index) {
            return `${base} bg-indigo-500 text-white border-indigo-400`
        }
        return `${base} text-[#5C5C7A] border-[#22222E]`
    }

    if (!q) {
        return (
            <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#0A0A0F] z-30">
                <div className="text-center">
                    <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto mb-4" />
                    <p className="text-[#8B8BA7] text-sm">No question available. Proceeding to mission...</p>
                    <button
                        onClick={onComplete}
                        className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg font-medium transition-colors border-none"
                    >
                        Continue
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-8 bg-[#0A0A0F] z-30 overflow-y-auto">
            <div className="max-w-2xl w-full my-auto">
                {/* Header */}
                <div className="text-center mb-6 sm:mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <UserCheck className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h2 className="text-2xl text-[#F1F1F5] font-semibold mb-2">
                        Knowledge Check
                    </h2>
                    <p className="text-[#8B8BA7] text-sm">
                        Question {safeIndex + 1} of {questions.length}
                    </p>
                </div>

                {/* Question Card */}
                <div className="bg-[#111118] border border-[#22222E] p-5 sm:p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                    <h3 className="text-lg sm:text-xl font-medium text-[#F1F1F5] mb-6 sm:mb-8 leading-relaxed">
                        {q.question}
                    </h3>

                    <div className="space-y-4">
                        {(q.options ?? []).map((opt: string, index: number) => (
                            <button
                                key={index}
                                onClick={() => {
                                    setSelectedOption(index)
                                    setShowError(false)
                                }}
                                className={getButtonClass(index)}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={getLabelClass(index)}>
                                        {String.fromCharCode(65 + index)}
                                    </span>
                                    <span
                                        className={`text-sm ${selectedOption === index ? "text-[#F1F1F5]" : "text-[#8B8BA7]"}`}
                                    >
                                        {opt}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Error Toast */}
                    {showError && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-red-400 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Incorrect answer. Re-evaluate the logic.
                        </div>
                    )}

                    <div className="mt-6 sm:mt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedOption === null}
                            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-lg font-medium transition-colors border-none text-xs sm:text-sm"
                        >
                            {safeIndex < questions.length - 1
                                ? "Next Question"
                                : "Start Coding"}
                            <Zap className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}