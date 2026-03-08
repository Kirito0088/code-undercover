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
        <div className="flex-1 flex flex-col h-full bg-[#050a12] relative overflow-hidden">
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar relative z-10 w-full h-full flex flex-col justify-center border-r-[1px] border-r-gray-900">
                {/* Briefing Container */}
                <div className="relative z-30 bg-black/40 border border-[#1e293b] p-6 rounded-lg shadow-2xl w-full my-auto before:content-[''] before:absolute before:left-[-1px] before:top-4 before:bottom-4 before:w-[4px] before:bg-cyan-500 before:rounded-l-sm">
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

            {/* Platypus Mentor Zone (Max 45% of height per constraint) */}
            <div className="relative h-[35%] w-full min-h-[250px] border-t border-gray-900 bg-gradient-to-t from-green-950/20 to-transparent flex items-end justify-center pt-8">

                {/* Dialogue Bubble */}
                <div className="absolute top-4 left-4 right-4 bg-gray-900/95 border border-green-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(34,197,94,0.1)] z-20 backdrop-blur-sm -translate-y-2">
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 border-b border-r border-green-500/30 rotate-45"></div>
                    <p className="text-xs font-mono text-green-100 text-center">
                        {getDialogue()}
                    </p>
                </div>

                {/* Platypus Avatar (CSS Drop Shadow, no baked glow) */}
                <div className="relative w-[80%] h-full max-w-[200px] animate-float">
                    <Image
                        src="/characters/platypus.png"
                        alt="Lead Mentor Platypus"
                        fill
                        className="object-contain drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                        priority
                    />
                </div>
            </div>
        </div>
    )
}
