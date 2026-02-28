"use client"

import { useState } from "react"
import { MissionRecord } from "@/types"
import { UserCheck, Zap, AlertTriangle } from "lucide-react"

interface MCQPhaseProps {
    mission: MissionRecord
    onComplete: () => void
}

export function MCQPhase({ mission, onComplete }: MCQPhaseProps) {
    const questions = mission.mcqContent
        ? JSON.parse(mission.mcqContent)
        : [
            {
                id: 1,
                question: "What happens when a dangling pointer is dereferenced?",
                options: [
                    "It automatically returns NULL",
                    "It safely crashes the program",
                    "It accesses undefined memory, causing unpredictable behavior or vulnerabilities",
                ],
                correctIndex: 2,
            },
        ]

    const [currentQIndex, setCurrentQIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [showError, setShowError] = useState(false)

    const handleSubmit = () => {
        if (selectedOption === null) return

        if (selectedOption !== questions[currentQIndex].correctIndex) {
            setShowError(true)
            setTimeout(() => setShowError(false), 2000)
            return
        }

        if (currentQIndex < questions.length - 1) {
            setCurrentQIndex(currentQIndex + 1)
            setSelectedOption(null)
            setShowError(false)
        } else {
            onComplete()
        }
    }

    const q = questions[currentQIndex]

    const getButtonClass = (index: number) => {
        const base = "w-full text-left p-4 rounded-xl border transition-all duration-200"
        if (selectedOption === index) {
            return `${base} bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]`
        }
        return `${base} bg-black/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800`
    }

    const getLabelClass = (index: number) => {
        const base = "font-mono text-sm w-6 h-6 flex items-center justify-center rounded border"
        if (selectedOption === index) {
            return `${base} bg-blue-500 text-white border-blue-400`
        }
        return `${base} text-gray-500 border-gray-600`
    }

    return (
        <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#050505] z-30">
            <div className="max-w-2xl w-full">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 mb-4 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                        <UserCheck className="h-8 w-8 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-mono text-white font-bold tracking-widest uppercase mb-2">
                        Knowledge Check
                    </h2>
                    <p className="text-gray-400 font-mono text-sm tracking-wider">
                        AUTHORIZE CLEARANCE: QUESTION {currentQIndex + 1} OF{" "}
                        {questions.length}
                    </p>
                </div>

                {/* Question Card */}
                <div className="bg-gray-900/80 border border-gray-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                    <h3 className="text-xl font-medium text-white mb-8 leading-relaxed">
                        {q.question}
                    </h3>

                    <div className="space-y-4">
                        {q.options.map((opt: string, index: number) => (
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
                                        className={`text-sm ${selectedOption === index ? "text-white" : "text-gray-300"}`}
                                    >
                                        {opt}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Error Toast */}
                    {showError && (
                        <div className="mt-6 flex items-center justify-center gap-2 text-red-400 font-mono text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            Incorrect answer. Re-evaluate the logic.
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={selectedOption === null}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-bold tracking-widest font-mono uppercase transition-all shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                        >
                            {currentQIndex < questions.length - 1
                                ? "NEXT QUESTION"
                                : "INITIATE MISSION"}
                            <Zap className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
