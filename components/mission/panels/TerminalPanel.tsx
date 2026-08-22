"use client"

import { useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import { MissionRecord } from "@/types"
import type { TerminalLine } from "../MissionWorkspace"
import { Terminal as TerminalIcon, HelpCircle, CheckCircle } from "lucide-react"


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

// Per-severity styling for diagnostic blocks. Warnings and notes are not
// failures — colouring them red made every successful-but-noisy run look broken.
const SEVERITY_TONE = {
    error: { text: "text-red-400", border: "border-red-500/40" },
    warning: { text: "text-amber-400", border: "border-amber-500/40" },
    note: { text: "text-sky-400", border: "border-sky-500/40" },
} as const

function getLineColor(type: string) {
    switch (type) {
        case "error": return "text-red-400"
        case "success": return "text-emerald-400"
        case "hint": return "text-amber-400"
        case "finish": return "text-indigo-400"
        case "input-prompt": return "text-amber-400"
        default: return "text-[#4A5D4A]"  // system lines
    }
}

export function TerminalPanel({
    mission,
    terminalOutput,
    hintsUsed,
    setHintsUsed,
    setTerminalOutput,
    onFinishMission,
}: TerminalPanelProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom whenever output changes
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [terminalOutput])

    // Auto-focus input when it appears
    const inputRef = useCallback((node: HTMLInputElement | null) => {
        if (node) {
            node.focus()
            node.scrollIntoView({ behavior: "smooth", block: "nearest" })
        }
    }, [])

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
                    { id: `hint-${Date.now()}`, type: "hint" as const, message: data.hint },
                ])
            }
        } catch (e) {
            console.error("Hint failed", e)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#07080A] border-l border-[#1F261F] relative font-mono">
            {/* Terminal Header & Hints */}
            <div className="h-9 bg-[#07080A] border-b border-[#1F261F] flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono text-[#4A5D4A]">
                    <TerminalIcon className="size-4" />
                    Terminal Output
                </div>

                <button
                    type="button"
                    onClick={handleRequestHint}
                    disabled={hintsUsed >= 5}
                    aria-label={`Request a hint (${hintsUsed} of 5 used)`}
                    className="flex items-center gap-2 border border-[#1F261F] bg-[#0D0E12] hover:border-amber-500/30 text-[#8F9F8F] hover:text-amber-400 px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50"
                >
                    <HelpCircle className="size-3 text-amber-400" />
                    Request Hint ({hintsUsed}/5)
                </button>
            </div>

            {/* Terminal Output Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {terminalOutput.map((line) => {
                    // ── Diagnostic block ────────────────────────────────
                    if (line.isDiagnostic) {
                        const d = line.diagnostic
                        const severity = d?.severity ?? "error"
                        const tone = SEVERITY_TONE[severity]
                        // line 0 means the diagnostic came from the linker, which
                        // reports no source position — show the stage instead of
                        // a bogus "solution.c:0:0".
                        const location = !d
                            ? null
                            : d.line > 0
                                ? `${d.file}:${d.line}:${d.column}`
                                : `${d.file} — link stage`

                        return (
                            <div key={line.id} className="mb-4">
                                <div className="text-[#E2E8F0] text-sm font-semibold mb-1 break-words">
                                    <span className={tone.text}>{severity}: </span>
                                    {d ? d.text : line.message}
                                </div>
                                {location && (
                                    <div className="text-[#4A5D4A] text-xs mb-2">{location}</div>
                                )}
                                {line.rawContext && (
                                    <pre className={`bg-[#0D0E12] border-l-2 ${tone.border} p-2 text-xs text-[#8F9F8F] font-mono overflow-x-auto whitespace-pre`}>
                                        {line.rawContext}
                                    </pre>
                                )}
                            </div>
                        )
                    }

                    // ── Platypus mentor card ─────────────────────────────
                    if (line.type === "hint") {
                        return (
                            <div key={line.id} className="mb-4 bg-amber-500/5 border border-amber-500/15 rounded-lg overflow-hidden">
                                {/* Platypus Header */}
                                <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/10">
                                    <div className="relative size-6 rounded-full overflow-hidden border border-amber-500/30 flex-shrink-0 bg-[#07080A]">
                                        <Image
                                            src="/characters/platipus.png"
                                            alt="Platypus"
                                            fill
                                            sizes="24px"
                                            className="object-cover object-top scale-[1.4] translate-y-1"
                                        />
                                    </div>
                                    <span className="text-amber-400 text-xs font-medium">Platypus</span>
                                    <span className="text-[#4A5D4A] text-xs font-mono ml-auto">Coding Mentor</span>
                                </div>
                                {/* Message */}
                                <div className="p-3 text-[#8F9F8F] text-sm font-mono leading-relaxed whitespace-pre-wrap">
                                    {line.message.replace('Analysis: ', '').replace('Mission requirement: ', '')}
                                </div>
                            </div>
                        )
                    }

                    // ── Finish Mission button ───────────────────────────
                    if (line.type === "finish") {
                        return (
                            <div key={line.id} className="my-6 flex justify-center">
                                <button
                                    type="button"
                                    onClick={onFinishMission}
                                    className="flex items-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-lg text-sm font-medium transition-colors border-none"
                                >
                                    <CheckCircle className="size-5" />
                                    Finish Mission
                                </button>
                            </div>
                        )
                    }

                    // ── Input Prompt ────────────────────
                    if (line.type === "input-prompt") {
                        return (
                            <div key={line.id} className="mb-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-amber-400 whitespace-nowrap">{line.message}</span>
                                    <input 
                                        type="text"
                                        id="terminal-input"
                                        name="terminal-input"
                                        autoComplete="off"
                                        ref={inputRef}
                                        aria-label={line.message}
                                        className="flex-1 bg-transparent border-none outline-none text-[#E2E8F0] font-mono caret-indigo-400"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                line.onSubmit?.(e.currentTarget.value)
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )
                    }

                    // ── Default render ─
                    return (
                        <div key={line.id} className={"mb-2 text-sm font-mono break-words " + getLineColor(line.type)} style={{ whiteSpace: "pre-wrap", tabSize: 4 }}>{line.message}</div>
                    )
                })}
                {/* Blinking cursor + scroll anchor */}
                <div className="w-2 h-4 bg-indigo-400 animate-pulse mt-1 inline-block"></div>
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
