import { MissionRecord } from "@/types"
import { missionDetails } from "@/src/data/missionsData"

interface LeftPanelProps {
    mission: MissionRecord
    missionCleared: boolean
    attemptCount: number
}

export function LeftPanel({ mission, missionCleared, attemptCount }: LeftPanelProps) {
    const details = missionDetails[mission.order] || {}

    const statusLabel = missionCleared
        ? "MISSION COMPLETE"
        : attemptCount >= 3
            ? "KEEP TRYING"
            : "ACTIVE"

    const statusColor = missionCleared
        ? "text-green-400 border-green-500/40"
        : attemptCount >= 3
            ? "text-yellow-400 border-yellow-500/40"
            : "text-cyan-400 border-cyan-500/40"

    // Shared Progress Indicator for brevity (you can also place this in each level)
    const renderProgress = () => (
        <div className="flex items-center gap-3 text-xs font-mono text-gray-600">
            <span className="text-gray-700">Attempts:</span>
            <span className={attemptCount > 5 ? "text-red-400" : "text-gray-400"}>{attemptCount}</span>
            <span className="text-gray-800">•</span>
            <span className="text-gray-700">Check the terminal for feedback</span>
        </div>
    )

    // Shared Objective block for brevity (you can also place this in each level)
    const renderObjective = () => {
        if (!mission.goal) return null
        return (
            <div className="bg-green-950/10 border border-green-900/30 rounded-lg p-4">
                <div className="text-green-400 text-xs font-bold tracking-widest uppercase mb-2">
                    OBJECTIVE
                </div>
                <div className="text-green-100/80 text-sm font-mono leading-relaxed">
                    {mission.goal}
                </div>
            </div>
        )
    }

    // ==========================================
    // LEVEL 1: The System Access
    // ==========================================
    if (mission.order === 1) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                    {/* Briefing Container */}
                    <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                LEVEL.{mission.order}
                            </span>
                            <span className={`font-mono text-[11px] font-bold tracking-widest uppercase border rounded px-2 py-0.5 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                            {mission.title}
                        </h1>
                        <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                            {details.briefing || mission.briefing || "Complete the objective as described."}
                        </div>
                    </div>
                    {renderObjective()}
                    {renderProgress()}
                </div>
            </div>
        )
    }

    // ==========================================
    // LEVEL 2: Variable Infiltration
    // ==========================================
    if (mission.order === 2) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                    {/* Briefing Container */}
                    <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                LEVEL.{mission.order}
                            </span>
                            <span className={`font-mono text-[11px] font-bold tracking-widest uppercase border rounded px-2 py-0.5 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                            {mission.title}
                        </h1>
                        <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                            {details.briefing || mission.briefing || "Complete the objective as described."}
                        </div>
                    </div>
                    {renderObjective()}
                    {renderProgress()}
                </div>
            </div>
        )
    }

    // ==========================================
    // LEVEL 3: Control Flow Lockdown
    // ==========================================
    if (mission.order === 3) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                    {/* Briefing Container */}
                    <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                LEVEL.{mission.order}
                            </span>
                            <span className={`font-mono text-[11px] font-bold tracking-widest uppercase border rounded px-2 py-0.5 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                            {mission.title}
                        </h1>
                        <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                            {details.briefing || mission.briefing || "Complete the objective as described."}
                        </div>
                    </div>
                    {renderObjective()}
                    {renderProgress()}
                </div>
            </div>
        )
    }

    // ==========================================
    // LEVEL 4: Loop Protocol
    // ==========================================
    if (mission.order === 4) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                    {/* Briefing Container */}
                    <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                LEVEL.{mission.order}
                            </span>
                            <span className={`font-mono text-[11px] font-bold tracking-widest uppercase border rounded px-2 py-0.5 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                            {mission.title}
                        </h1>
                        <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                            {details.briefing || mission.briefing || "Complete the objective as described."}
                        </div>
                    </div>
                    {renderObjective()}
                    {renderProgress()}
                </div>
            </div>
        )
    }

    // ==========================================
    // LEVEL 5: Function Assembly
    // ==========================================
    if (mission.order === 5) {
        return (
            <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                    {/* Briefing Container */}
                    <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                        <div className="flex items-center justify-between gap-3 mb-4">
                            <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                                LEVEL.{mission.order}
                            </span>
                            <span className={`font-mono text-[11px] font-bold tracking-widest uppercase border rounded px-2 py-0.5 ${statusColor}`}>
                                {statusLabel}
                            </span>
                        </div>
                        <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                            {mission.title}
                        </h1>
                        <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                            {details.briefing || mission.briefing || "Complete the objective as described."}
                        </div>
                    </div>
                    {renderObjective()}
                    {renderProgress()}
                </div>
            </div>
        )
    }

    // ==========================================
    // FALLBACK (for any subsequent levels)
    // ==========================================
    return (
        <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
            <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                            LEVEL.{mission.order}
                        </span>
                        <span className={`font-mono text-[11px] font-bold tracking-widest uppercase border rounded px-2 py-0.5 ${statusColor}`}>
                            {statusLabel}
                        </span>
                    </div>
                    <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                        {mission.title}
                    </h1>
                    <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                        {details.briefing || mission.briefing || "Complete the objective as described."}
                    </div>
                </div>
                {renderObjective()}
                {renderProgress()}
            </div>
        </div>
    )
}

