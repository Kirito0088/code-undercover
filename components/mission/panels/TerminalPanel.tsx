"use client"

import { MissionRecord } from "@/types"
import { Terminal as TerminalIcon, HelpCircle, CheckCircle } from "lucide-react"

interface TerminalLine {
    type: "system" | "error" | "success" | "hint" | "finish"
    message: string
    rawContext?: string
    isDiagnostic?: boolean
}

interface TerminalPanelProps {
    mission: MissionRecord
    terminalOutput: TerminalLine[]
    hintsUsed: number
    setHintsUsed: (count: number) => void
    setTerminalOutput: React.Dispatch<React.SetStateAction<TerminalLine[]>>
    attemptCount: number
    innovationUnlocked: boolean
    onFinishMission: () => void
}

export function TerminalPanel({
    mission,
    terminalOutput,
    hintsUsed,
    setHintsUsed,
    setTerminalOutput,
    onFinishMission,
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
                {terminalOutput.map((line, index) => {
                    // ── Diagnostic error block ──────────────────────────
                    if (line.isDiagnostic) {
                        return (
                            <div key={index} className="mb-4">
                                <div className="text-white text-sm font-semibold mb-1 break-words">
                                    <span className="text-red-400">error: </span>
                                    {line.message.split('error:')[1] || line.message}
                                </div>
                                <div className="text-gray-500 text-xs mb-2">
                                    {line.message.split('error:')[0]}
                                </div>
                                {line.rawContext && (
                                    <pre className="bg-gray-900/50 border-l-2 border-red-500/50 p-2 text-xs text-gray-300 font-mono overflow-x-auto whitespace-pre">
                                        {line.rawContext}
                                    </pre>
                                )}
                            </div>
                        )
                    }

                    // ── Platypus mentor card ─────────────────────────────
                    if (line.type === "hint") {
                        return (
                            <div key={index} className="mb-4 bg-green-950/15 border border-green-800/40 rounded-lg overflow-hidden">
                                {/* Platypus Header */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border-b border-green-800/30">
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden border border-green-500/60 flex-shrink-0 bg-[#0a1610]">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src="/characters/platypus.png" alt="Platypus" className="w-full h-full object-cover object-top scale-[1.4] translate-y-1" />
                                    </div>
                                    <span className="text-green-400 text-xs font-bold tracking-wider uppercase">Platypus</span>
                                    <span className="text-green-700 text-xs font-mono ml-auto">Coding Mentor</span>
                                </div>
                                {/* Message */}
                                <div className="px-3 py-3 text-green-100/90 text-sm font-mono leading-relaxed whitespace-pre-wrap">
                                    {line.message.replace('Analysis: ', '').replace('Mission requirement: ', '')}
                                </div>
                            </div>
                        )
                    }

                    // ── Finish Mission button ───────────────────────────
                    if (line.type === "finish") {
                        return (
                            <div key={index} className="my-6 flex justify-center">
                                <button
                                    onClick={onFinishMission}
                                    className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg text-sm font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:scale-[1.02] active:scale-95"
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Finish Mission
                                </button>
                            </div>
                        )
                    }

                    // ── Default render (system, success, unparsed errors) ─
                    return (
                        <div key={index} className={"mb-2 text-sm " + getLineColor(line.type)}>
                            <span className="inline-block whitespace-pre-wrap">{line.message}</span>
                        </div>
                    )
                })}
                {/* Blinking cursor */}
                <div className="w-2 h-4 bg-green-500 animate-pulse mt-1 inline-block"></div>
            </div>
        </div>
    )
}
