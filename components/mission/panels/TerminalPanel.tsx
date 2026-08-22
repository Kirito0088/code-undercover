"use client"

import { useRef, useEffect, useCallback } from "react"
import type { TerminalLine } from "../MissionWorkspace"
import { Terminal as TerminalIcon, CheckCircle } from "lucide-react"


interface TerminalPanelProps {
    terminalOutput: TerminalLine[]
    onFinishMission: () => void
}

function getLineColor(type: string) {
    switch (type) {
        case "error": return "text-red-400"
        case "success": return "text-emerald-400"
        case "finish": return "text-indigo-400"
        case "input-prompt": return "text-amber-400"
        default: return "text-[#4A5D4A]"  // system lines
    }
}

export function TerminalPanel({
    terminalOutput,
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

    return (
        <div className="flex flex-col h-full bg-[#07080A] border-l border-[#1F261F] relative font-mono">
            {/* Terminal Header */}
            <div className="h-9 bg-[#07080A] border-b border-[#1F261F] flex items-center px-4 flex-shrink-0">
                <div className="flex items-center gap-2 text-xs font-mono text-[#4A5D4A]">
                    <TerminalIcon className="size-4" />
                    Terminal Output
                </div>
            </div>

            {/* Terminal Output Area */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                {terminalOutput.map((line) => {
                    // ── Diagnostic error block ──────────────────────────
                    if (line.isDiagnostic) {
                        return (
                            <div key={line.id} className="mb-4">
                                <div className="text-[#E2E8F0] text-sm font-semibold mb-1 break-words">
                                    <span className="text-red-400">error: </span>
                                    {line.message.split('error:')[1] || line.message}
                                </div>
                                <div className="text-[#4A5D4A] text-xs mb-2">
                                    {line.message.split('error:')[0]}
                                </div>
                                {line.rawContext && (
                                    <pre className="bg-[#0D0E12] border-l-2 border-red-500/40 p-2 text-xs text-[#8F9F8F] font-mono overflow-x-auto whitespace-pre">
                                        {line.rawContext}
                                    </pre>
                                )}
                            </div>
                        )
                    }

                    // ── Hint messages are suppressed from the terminal ──
                    if (line.type === "hint") {
                        return null
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
