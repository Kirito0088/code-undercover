"use client"

import { useState } from "react"
import { MissionRecord } from "@/types"
import { Play } from "lucide-react"

interface EditorPanelProps {
    mission: MissionRecord
    setTerminalOutput: React.Dispatch<React.SetStateAction<{ type: "system" | "error" | "success" | "hint"; message: string }[]>>
    attemptCount: number
    setAttemptCount: (count: number) => void
    setInnovationUnlocked: (unlocked: boolean) => void
}

export function EditorPanel({
    mission,
    setTerminalOutput,
    attemptCount,
    setAttemptCount,
    setInnovationUnlocked,
}: EditorPanelProps) {
    const defaultCode = [
        "// Mission: " + mission.title,
        "// Language: " + mission.language,
        "",
        "#include <stdio.h>",
        "",
        "int main() {",
        "    // Agent, write your code here.",
        "    ",
        "    return 0;",
        "}",
    ].join("\n")

    const [code, setCode] = useState(defaultCode)
    const [isRunning, setIsRunning] = useState(false)

    const handleRunCode = async () => {
        setIsRunning(true)
        setTerminalOutput([
            { type: "system", message: "> Compiling and executing..." },
        ])

        setAttemptCount(attemptCount + 1)

        try {
            const response = await fetch("/api/missions/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ missionId: mission.id, code }),
            })

            const result = await response.json()

            if (result.success) {
                setTerminalOutput([
                    { type: "system", message: "> Compilation successful." },
                    { type: "success", message: "Output: " + (result.stdout || "System secured.") },
                    { type: "system", message: "MISSION CLEARED." },
                ])
                if (result.innovationUnlocked) {
                    setInnovationUnlocked(true)
                    setTimeout(() => {
                        setTerminalOutput((prev) => [
                            ...prev,
                            {
                                type: "system",
                                message: "> INNOVATION DETECTED: " + result.innovationReason,
                            },
                        ])
                    }, 2000)
                }
            } else {
                // Show validation errors from the rule engine
                const errorLines: { type: "system" | "error" | "success" | "hint"; message: string }[] = [
                    { type: "system", message: "> Validation failed." },
                ]

                if (result.validationErrors && result.validationErrors.length > 0) {
                    for (const err of result.validationErrors) {
                        errorLines.push({ type: "error", message: "✗ " + err })
                    }
                }

                if (result.stderr) {
                    errorLines.push({ type: "error", message: result.stderr })
                }

                if (result.ruleDescription) {
                    errorLines.push({ type: "hint", message: "Mission requirement: " + result.ruleDescription })
                }

                errorLines.push({ type: "system", message: "Fix the issues above and try again." })
                setTerminalOutput(errorLines)
            }
        } catch {
            setTerminalOutput([
                { type: "error", message: "System failure connecting to compilation server." },
            ])
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-[#0d1117] rounded-xl overflow-hidden border border-gray-800 shadow-2xl relative">
            {/* Neutral Window Header */}
            <div className="h-12 bg-[#161b22] border-b border-gray-800 flex items-center justify-between px-4 select-none flex-shrink-0">
                <div className="flex gap-2 items-center">
                    <div className="flex gap-1.5 mr-4">
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                    </div>
                    <div className="bg-[#0d1117] text-gray-400 text-xs font-mono py-1 px-4 rounded-t-md border border-gray-800 border-b-0 translate-y-[1px]">
                        solution.c
                    </div>
                </div>

                <button
                    onClick={handleRunCode}
                    disabled={isRunning}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-xs font-bold tracking-wider uppercase transition-colors disabled:opacity-50 shadow-[0_0_10px_rgba(22,163,74,0.3)]"
                >
                    {isRunning ? (
                        <span className="animate-pulse">RUNNING...</span>
                    ) : (
                        <>
                            <Play className="h-3 w-3" fill="currentColor" />
                            RUN CODE
                        </>
                    )}
                </button>
            </div>

            {/* Editor Area with line numbers feel */}
            <div className="flex-1 relative flex">
                {/* Line number gutter */}
                <div className="w-12 bg-[#0d1117] border-r border-gray-800/50 py-4 select-none flex-shrink-0">
                    {code.split("\n").map((_, i) => (
                        <div key={i} className="text-right pr-3 text-xs text-gray-600 leading-relaxed font-mono">
                            {i + 1}
                        </div>
                    ))}
                </div>
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    spellCheck={false}
                    className="flex-1 bg-transparent text-gray-300 p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none custom-scrollbar"
                />
            </div>
        </div>
    )
}
