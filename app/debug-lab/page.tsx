import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDashboardMissions } from "@/services/mission.service"
import { safeDbQuery } from "@/lib/db"
import { BugOff, Play, Video, Sparkles, Terminal } from "lucide-react"
import { MissionCard } from "../dashboard/MissionCard"
import { DebugLabClientWrapper } from "@/components/debug-lab/DebugLabClientWrapper"

export default async function DebugLabPage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        redirect("/login")
    }

    const missions = await safeDbQuery(
        () => getDashboardMissions(session.user.id, "debug"),
        [],
        "DebugLabPage"
    )

    const completedCount = missions.filter((m) => m.status === "COMPLETED").length
    const totalCount = missions.length
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    return (
        <div className="flex-1 bg-[#040711] min-h-[calc(100vh-3.5rem)] py-8 relative font-mono text-[#E2E8F0] selection:bg-cyan-500/30 overflow-hidden">
            {/* Ambient Neon Blue Alert Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-[1]"></div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[350px] bg-[radial-gradient(ellipse_50%_40%_at_50%_0%,rgba(6,182,212,0.15),transparent)] pointer-events-none z-[1]"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-[#070A14]/95 border border-cyan-500/30 rounded-xl p-6 relative overflow-hidden backdrop-blur-xl shadow-[0_0_35px_rgba(6,182,212,0.15)]">
                    <div className="absolute top-1.5 left-1.5 size-2 border-t border-l border-cyan-400/60"></div>
                    <div className="absolute top-1.5 right-1.5 size-2 border-t border-r border-cyan-400/60"></div>

                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-block size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse"></span>
                            <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">SECURE_DIAGNOSTICS // INTEL_LAB</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3 font-sans drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                            <BugOff className="size-8 text-cyan-400" />
                            Debug Lab
                        </h1>
                        <p className="mt-1 text-xs text-slate-300 font-sans">
                            Fix broken modules. Earn Aura. Restore system integrity.
                        </p>
                    </div>

                    <DebugLabClientWrapper />
                </div>

                {/* Progress Bar */}
                <div className="mb-8 bg-[#070A14]/90 backdrop-blur-xl rounded-xl p-5 border border-cyan-500/30 shadow-lg">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-slate-300 font-semibold">DEBUG DECRYPTION PROGRESS</span>
                        <span className="text-xs font-mono text-cyan-400 font-bold">{completedCount}/{totalCount} Restored</span>
                    </div>
                    <div className="w-full bg-[#03050C] rounded-full h-2 p-0.5 border border-cyan-500/20">
                        <div
                            className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_#06b6d4]"
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                {/* Video Explanation Skeleton Gallery Section */}
                <div className="mb-10 space-y-4">
                    <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                        <h2 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                            <Video className="size-4 text-cyan-400" />
                            OPERATIVE VIDEO INTEL ARCHIVES (UPCOMING)
                        </h2>
                        <span className="text-[10px] font-mono text-slate-300 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">SKELETON TEMPLATES</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                id: "DBG-094",
                                title: "Buffer Overflow & Heap Leak Patches",
                                desc: "Deconstructing pointer arithmetic bugs and memory corruption inside low-level C modules.",
                                duration: "06:20",
                                level: "Sector Alpha"
                            },
                            {
                                id: "DBG-102",
                                title: "Dangling Pointers & Double Free Auditing",
                                desc: "Step-by-step memory trace walkthrough using address sanitizers and stack frame inspection.",
                                duration: "08:45",
                                level: "Sector Beta"
                            },
                            {
                                id: "DBG-205",
                                title: "Concurrency Locks & Deadlock Resolution",
                                desc: "Resolving mutex lock contention and thread starvation in multi-threaded runtime tasks.",
                                duration: "11:10",
                                level: "Sector Gamma"
                            }
                        ].map((video) => (
                            <div 
                                key={video.id}
                                className="bg-[#070A14]/90 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-5 hover:border-cyan-500/50 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]"
                            >
                                <div className="absolute top-1.5 left-1.5 size-2 border-t border-l border-cyan-400/40"></div>
                                <div className="absolute top-1.5 right-1.5 size-2 border-t border-r border-cyan-400/40"></div>

                                {/* Thumbnail Skeleton Placeholder */}
                                <div className="relative aspect-video w-full bg-[#03050C] rounded-lg border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:border-cyan-500/40 transition-colors overflow-hidden">
                                    <div className="absolute inset-0 bg-[radial-gradient-at-center,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none"></div>
                                    
                                    <div className="size-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                                        <Play className="size-5 text-cyan-400 translate-x-0.5" />
                                    </div>

                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-cyan-400 font-bold border border-cyan-500/30">
                                        {video.duration}
                                    </span>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1">
                                        <span className="text-cyan-400 font-bold">{video.id}</span>
                                        <span className="text-slate-300">{video.level}</span>
                                    </div>
                                    <h3 className="text-sm font-bold text-white font-sans group-hover:text-cyan-400 transition-colors mb-1.5">
                                        {video.title}
                                    </h3>
                                    <p className="text-xs text-slate-300 font-sans leading-relaxed line-clamp-2">
                                        {video.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Mission Grid */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {missions.map((mission) => (
                        <MissionCard key={mission.id} mission={mission} />
                    ))}
                </div>

                {missions.length === 0 && (
                    <div className="text-center py-16 bg-[#070A14]/70 rounded-xl border border-cyan-500/20 backdrop-blur-md">
                        <BugOff className="size-12 text-cyan-400/50 mx-auto mb-4 animate-pulse" />
                        <p className="text-slate-300 text-sm font-sans font-medium">No corrupted modules detected. The system is secure.</p>
                        <p className="text-slate-400 text-xs font-mono mt-1">Check back later when system anomaly logs are reported.</p>
                    </div>
                )}

            </div>
        </div>
    )
}

