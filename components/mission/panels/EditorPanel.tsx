"use client"

import { useState } from "react"
import { MissionRecord } from "@/types"
import type { MissionClearInfo } from "../MissionWorkspace"
import { Play } from "lucide-react"
import Editor from "@monaco-editor/react"

interface EditorPanelProps {
    mission: MissionRecord
    setTerminalOutput: React.Dispatch<React.SetStateAction<{ type: "system" | "error" | "success" | "hint"; message: string }[]>>
    attemptCount: number
    setAttemptCount: (count: number) => void
    setInnovationUnlocked: (unlocked: boolean) => void
    setMissionCleared: (cleared: boolean) => void
    setClearInfo: (info: MissionClearInfo) => void
}

export function EditorPanel({
    mission,
    setTerminalOutput,
    attemptCount,
    setAttemptCount,
    setInnovationUnlocked,
    setMissionCleared,
    setClearInfo,
}: EditorPanelProps) {
    const defaultCode = mission.startingCode || [
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
                const successLines = [
                    { type: "system", message: "> Compilation successful." },
                    { type: "success", message: "Output: " + (result.stdout || "System secured.") },
                    { type: "system", message: "MISSION CLEARED." },
                ] as { type: "system" | "error" | "success" | "hint"; message: string }[]

                if (result.comboStreak > 1 && result.comboBonus > 0) {
                    successLines.push({
                        type: "success",
                        message: `> ⚡ LOGIC COMBO x${result.comboStreak} (+${result.comboBonus} Aura Bonus)`,
                    })
                }

                setTerminalOutput(successLines)

                // Signal mission cleared to parent for victory overlay
                setMissionCleared(true)
                setClearInfo({
                    auraEarned: result.auraEarned || result.earnedAura || 50,
                    comboStreak: result.comboStreak || 0,
                    comboBonus: result.comboBonus || 0,
                })

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
                // Show validation errors from the rule engine or compiler
                const errorLines: { type: "system" | "error" | "success" | "hint"; message: string }[] = [
                    { type: "system", message: "> Validation or Compilation failed." },
                ]

                if (result.validationErrors && result.validationErrors.length > 0) {
                    for (const err of result.validationErrors) {
                        errorLines.push({ type: "error", message: "✗ " + err })
                    }
                }

                if (result.explanation) {
                    errorLines.push({ type: "hint", message: "Analysis: " + result.explanation })
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
            <div className="bg-[#161b22] border-b border-gray-800 flex items-end justify-between px-4 select-none flex-shrink-0 pt-2 h-12">
                <div className="flex items-end h-full">
                    <div className="flex gap-1.5 mr-6 mb-3">
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                        <div className="w-3 h-3 rounded-full bg-gray-600/50"></div>
                    </div>
                    <div className="bg-[#0d1117] text-gray-300 text-xs font-mono py-2 px-6 border border-gray-800 border-b-0 translate-y-[1px]">
                        solution.c
                    </div>
                </div>

                <div className="mb-1.5">
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
            </div>

            {/* Editor Area with line numbers feel */}
            <div className="flex-1 relative min-h-0 w-full overflow-hidden">
                <Editor
                    height="100%"
                    defaultLanguage="c"
                    theme="vs-dark"
                    value={code}
                    onChange={(value) => setCode(value || "")}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        padding: { top: 16 }
                    }}
                />
            </div>
        </div>
    )
}
