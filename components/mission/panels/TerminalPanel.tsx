"use client"

import { MissionRecord } from "@/types"
import { Terminal as TerminalIcon, HelpCircle } from "lucide-react"

interface TerminalPanelProps {
    mission: MissionRecord
    terminalOutput: { type: "system" | "error" | "success" | "hint"; message: string }[]
    hintsUsed: number
    setHintsUsed: (count: number) => void
    setTerminalOutput: React.Dispatch<React.SetStateAction<{ type: "system" | "error" | "success" | "hint"; message: string }[]>>
    attemptCount: number
    innovationUnlocked: boolean
}

export function TerminalPanel({
    mission,
    terminalOutput,
    hintsUsed,
    setHintsUsed,
    setTerminalOutput,
}: TerminalPanelProps) {
    const handleRequestHint = async () => {
        if (hintsUsed >= 5) return

        try {
            const res = await fetch("/api/missions/hint", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id }),
            })
            const data = await res.json()
            if (data.success) {
                setHintsUsed(data.hintsUsed)
                setTerminalOutput((prev) => [
                    ...prev,
                    { type: "hint" as const, message: data.hint },
                ])
            }
        } catch (e) {
            console.error("Hint failed", e)
        }
    }

    const getLineColor = (type: string) => {
        switch (type) {
            case "error": return "text-red-400"
            case "success": return "text-green-400"
            case "hint": return "text-blue-400"
            default: return "text-gray-400"
        }
    }

    return (
        <div className="flex flex-col h-full bg-black/95 rounded-xl border border-gray-800 shadow-2xl overflow-hidden relative font-mono">
            {/* Terminal Header & Hints */}
            <div className="h-12 bg-gray-900/50 border-b border-gray-800 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2 text-gray-400 font-bold text-xs tracking-widest uppercase">
                    <TerminalIcon className="h-4 w-4" />
                    Terminal Output
                </div>

                <button
                    onClick={handleRequestHint}
                    disabled={hintsUsed >= 5}
                    className="flex items-center gap-2 border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-blue-500/50 text-gray-300 px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
                >
                    <HelpCircle className="h-3 w-3 text-blue-400" />
                    REQUEST HINT ({hintsUsed}/5)
                </button>
            </div>

            {/* Terminal Output Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {terminalOutput.map((line, index) => (
                    <div key={index} className={"mb-2 text-sm " + getLineColor(line.type)}>
                        <span className="inline-block">{line.message}</span>
                    </div>
                ))}
                {/* Blinking cursor */}
                <div className="w-2 h-4 bg-green-500 animate-pulse mt-1 inline-block"></div>
            </div>
        </div>
    )
}
