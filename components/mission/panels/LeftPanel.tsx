import { MissionRecord } from "@/types"
import { missionDetails } from "@/src/data/missionsData"
import { cn } from "@/lib/utils"

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
        ? "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
        : attemptCount >= 3
            ? "text-amber-400 border-amber-500/20 bg-amber-500/10"
            : "text-indigo-400 border-indigo-500/20 bg-indigo-500/5"

    return (
        <div className="flex-1 flex flex-col h-full bg-[#07080A] border-r border-[#1F261F] overflow-y-auto custom-scrollbar">
            <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                {/* Briefing Container */}
                <div className="bg-[#0D0E12] border border-[#1F261F] rounded-xl p-6 w-full">
                    <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="text-xs uppercase tracking-wider text-[#4A5D4A] font-medium">
                            Level {mission.order}
                        </span>
                        <span className={cn("font-medium text-xs border rounded-md px-2 py-0.5", statusColor)}>
                            {statusLabel}
                        </span>
                    </div>
                    <h1 className="text-xl font-semibold text-[#E2E8F0] leading-tight tracking-tight mt-3 mb-3">
                        {mission.title}
                    </h1>
                    <div className="text-[#8F9F8F] text-sm leading-relaxed whitespace-pre-wrap">
                        {details.briefing || mission.briefing || "Complete the objective as described."}
                    </div>
                </div>
                {mission.goal && (
                    <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-4">
                        <div className="text-indigo-400 text-xs font-semibold tracking-wider mb-2">
                            OBJECTIVE
                        </div>
                        <div className="text-[#8F9F8F] text-sm leading-relaxed">
                            {mission.goal}
                        </div>
                    </div>
                )}
                <div className="flex items-center gap-2.5 text-xs text-[#4A5D4A]">
                    <span>Attempts:</span>
                    <span className={attemptCount > 5 ? "text-red-400 font-semibold" : "text-[#8F9F8F]"}>{attemptCount}</span>
                    <span className="text-[#4A5D4A]">•</span>
                    <span>Feedback is in terminal</span>
                </div>
            </div>
        </div>
    )
}
