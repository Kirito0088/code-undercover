import { MissionRecord } from "@/types"
import Image from "next/image"

interface LeftPanelProps {
    mission: MissionRecord
    missionCleared: boolean
    attemptCount: number
}

export function LeftPanel({ mission, missionCleared, attemptCount }: LeftPanelProps) {
    const getDialogue = () => {
        if (missionCleared) {
            return '"Excellent work, Agent. Module restored. Report back to base."'
        }
        if (attemptCount >= 3) {
            return '"Take your time. Re-read the briefing and check the hints panel."'
        }
        return '"Read the briefing closely, agent. The syntax must be precise."'
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden border-r-[1px] border-r-gray-900 overflow-y-auto custom-scrollbar">
            
            <div className="flex flex-col justify-center min-h-full py-8 p-4 md:p-6 gap-6 w-full max-w-2xl mx-auto">
                {/* Platypus Mentor Zone */}
                <div className="relative w-full bg-gradient-to-b from-green-950/20 to-transparent border border-green-900/50 rounded-2xl flex items-center p-4 z-20 shrink-0">
                    {/* Avatar Portrait */}
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 animate-float rounded-full border-2 border-green-500/50 bg-[#0a1610] shadow-[0_0_15px_rgba(34,197,94,0.3)] overflow-hidden hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/characters/platypus.png"
                            alt="Lead Mentor Platypus"
                            fill
                            className="object-cover object-top scale-[1.3] pt-3"
                            priority
                        />
                    </div>

                    {/* Dialogue Bubble */}
                    <div className="relative ml-4 md:ml-6 ml-auto bg-gray-900/95 border border-green-500/30 rounded-2xl rounded-tl-sm p-3 sm:p-4 shadow-[0_0_15px_rgba(34,197,94,0.1)] backdrop-blur-sm flex-1">
                        {/* Tail pointing left to the avatar */}
                        <div className="absolute top-4 -left-2 w-4 h-4 bg-gray-900 border-t border-l border-green-500/30 -rotate-45"></div>
                        <p className="text-xs sm:text-sm font-mono text-green-100 italic leading-relaxed">
                            {getDialogue()}
                        </p>
                    </div>
                </div>

                {/* Briefing Container */}
                <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
                    {/* Level Label */}
                    <div className="flex items-center gap-3 mb-4">
                        <span className="text-cyan-400 font-mono text-[13px] font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]">
                            LEVEL.{mission.order}
                        </span>
                    </div>

                    {/* Bold Title */}
                    <h1 className="text-3xl xl:text-4xl font-black text-white leading-tight tracking-widest uppercase font-sans mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] break-words">
                        {mission.title.includes("Decipher") ? "SYSTEM\nBREACH" : mission.title}
                    </h1>

                    {/* Briefing Text */}
                    <div className="text-[#94a3b8] text-sm leading-relaxed font-mono whitespace-pre-wrap w-full">
                        {mission.title.includes("Decipher")
                            ? "Hack the security grid to enter the system.\nSecurity is active. Scanning your identity..."
                            : mission.briefing || "Complete the objective as described."}
                    </div>
                </div>
            </div>
        </div>
    )
}
