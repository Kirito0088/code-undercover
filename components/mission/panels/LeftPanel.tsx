import { MissionRecord } from "@/types"
import Image from "next/image"

interface LeftPanelProps {
    mission: MissionRecord
}

export function LeftPanel({ mission }: LeftPanelProps) {
    return (
        <>
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-green-500 font-mono text-xs border border-green-500/30 px-2 py-1 rounded bg-green-500/10 uppercase">
                        {mission.difficulty}
                    </span>
                    <span className="text-gray-400 font-mono text-xs">// MISSION #{String(mission.order).padStart(2, '0')}</span>
                </div>

                <h1 className="text-2xl font-bold text-white mb-6 tracking-tight leading-tight glow-text-subtle">
                    {mission.title}
                </h1>

                <div className="space-y-6">
                    {/* Briefing */}
                    <div>
                        <h3 className="text-xs font-mono text-green-400 mb-2 uppercase tracking-wider">Mission Goal</h3>
                        <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {mission.briefing || "Complete the objective as described."}
                        </div>
                    </div>

                    <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-800 to-transparent"></div>

                    {/* Learning Objectives */}
                    <div>
                        <h3 className="text-xs font-mono text-blue-400 mb-3 uppercase tracking-wider">What You Will Learn</h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2 text-sm text-gray-400">
                                <span className="text-blue-500 mt-0.5">▹</span>
                                <span>Core syntax and structure.</span>
                            </li>
                            <li className="flex items-start gap-2 text-sm text-gray-400">
                                <span className="text-blue-500 mt-0.5">▹</span>
                                <span>Memory management fundamentals.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Platypus Mentor Zone (Max 45% of height per constraint) */}
            <div className="relative h-[35%] w-full min-h-[250px] border-t border-gray-900 bg-gradient-to-t from-green-950/20 to-transparent flex items-end justify-center pt-8">

                {/* Dialogue Bubble */}
                <div className="absolute top-4 left-4 right-4 bg-gray-900/95 border border-green-500/30 rounded-lg p-3 shadow-[0_0_15px_rgba(34,197,94,0.1)] z-20 backdrop-blur-sm -translate-y-2">
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 border-b border-r border-green-500/30 rotate-45"></div>
                    <p className="text-xs font-mono text-green-100 text-center">
                        "Read the briefing closely, agent. The syntax must be precise."
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
        </>
    )
}
