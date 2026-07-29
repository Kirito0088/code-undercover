"use client"

import React, { useState } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw, Monitor, Terminal, FileCode2, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"

interface VideoExplanationModalProps {
  isOpen: boolean
  onClose: () => void
  videoTitle?: string
  moduleCode?: string
  videoUrl?: string
  fallbackSummary?: string
  timestamps?: { time: string; label: string }[]
  keyTakeaways?: string[]
}

export function ExplanationVideoModal({
  isOpen,
  onClose,
  videoTitle = "Deconstructing System Memory Corruption",
  moduleCode = "DBG-094 // MEMORY_LEAK_ANALYSIS",
  videoUrl,
  fallbackSummary = "In this operative intel report, we break down buffer overflow vulnerabilities, pointer arithmetic errors, and dangling pointer resolution in C system modules.",
  timestamps = [
    { time: "00:00", label: "Module Overview & Threat Vector" },
    { time: "01:45", label: "Traceback Analysis & Stack Inspection" },
    { time: "03:30", label: "Fix Implementation & Memory Patch" },
    { time: "05:15", label: "Verification & System Recovery" }
  ],
  keyTakeaways = [
    "Always check bounds before writing to allocated buffers.",
    "Nullify pointers immediately after freeing dynamically allocated memory.",
    "Use valgrind or address sanitizers to audit heap leaks."
  ]
}: VideoExplanationModalProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeTab, setActiveTab] = useState<"video" | "summary" | "notes">("video")

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in font-mono select-none">
      {/* Container Card */}
      <div className="relative w-full max-w-5xl bg-[#060913]/95 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        
        {/* Futuristic Top Bar / Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-[#04060E] relative">
          {/* Corner reticles */}
          <div className="absolute top-1 left-1 size-2 border-t border-l border-cyan-400/70"></div>
          <div className="absolute top-1 right-1 size-2 border-t border-r border-cyan-400/70"></div>
          
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
              <Terminal className="size-4 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block size-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4] animate-pulse"></span>
                <span className="text-[10px] font-mono tracking-widest text-cyan-400 font-bold uppercase">{moduleCode}</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold font-sans text-white tracking-tight mt-0.5">{videoTitle}</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>[ESC] CLOSE</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Nav Tabs */}
          <div className="flex items-center gap-2 border-b border-cyan-500/20 pb-3">
            <button
              onClick={() => setActiveTab("video")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "video"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <Monitor className="size-3.5" />
              OPERATIVE VIDEO INTEL
            </button>
            <button
              onClick={() => setActiveTab("summary")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === "summary"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                  : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <FileCode2 className="size-3.5" />
              BRIEFING SUMMARY
            </button>
          </div>

          {activeTab === "video" && (
            <div className="space-y-6">
              {/* Video Player Frame / Skeleton Placeholder */}
              <div className="relative aspect-video w-full bg-[#03050C] rounded-xl border border-cyan-500/25 overflow-hidden group shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center">
                
                {/* Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d408_1px,transparent_1px),linear-gradient(to_bottom,#06b6d408_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                {videoUrl ? (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full h-full object-cover relative z-10"
                  />
                ) : (
                  /* Skeleton Placeholder Video UI */
                  <div className="flex flex-col items-center justify-center text-center p-6 relative z-10 space-y-4">
                    <div className="relative">
                      <div className="size-16 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                        <Play className="size-8 text-cyan-400 translate-x-0.5" />
                      </div>
                      <span className="absolute -top-1 -right-1 size-3 bg-cyan-400 rounded-full animate-ping"></span>
                    </div>
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest block">[ VIDEO SIGNAL PENDING ]</span>
                      <p className="text-xs font-sans text-slate-300 max-w-md mt-1">
                        Operative tutorial video feed is currently being compiled into the Debug Lab archives.
                      </p>
                    </div>

                    {/* Simulated Player Controls Bar Skeleton */}
                    <div className="w-full max-w-xl bg-[#070A14]/90 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between text-xs text-slate-300 gap-4 mt-2">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="hover:text-cyan-400 transition-colors">
                        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                      </button>
                      <div className="flex-1 bg-cyan-950/40 h-1.5 rounded-full relative overflow-hidden border border-cyan-500/30">
                        <div className="w-1/3 bg-cyan-400 h-full rounded-full shadow-[0_0_10px_#06b6d4]"></div>
                      </div>
                      <span className="font-mono text-[10px] text-cyan-400 font-bold">01:45 / 06:20</span>
                      <button onClick={() => setIsMuted(!isMuted)} className="hover:text-cyan-400 transition-colors">
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamps & Chapters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#070A14] border border-cyan-500/20 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="size-3.5" />
                    KEY INTEL TIMESTAMPS
                  </h4>
                  <div className="space-y-2">
                    {timestamps.map((ts, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs p-2 rounded-lg bg-[#03050C] border border-cyan-500/15 hover:border-cyan-500/40 transition-colors cursor-pointer">
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold">{ts.time}</span>
                        <span className="text-slate-200 font-sans">{ts.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#070A14] border border-cyan-500/20 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="size-3.5 text-cyan-400" />
                    DEBUGGING TAKEAWAYS
                  </h4>
                  <ul className="space-y-2">
                    {keyTakeaways.map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-200 font-sans flex items-start gap-2">
                        <span className="text-cyan-400 font-mono font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "summary" && (
            <div className="bg-[#070A14] border border-cyan-500/20 rounded-xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">EXECUTIVE DEBRIEF</h3>
              <p className="text-xs font-sans text-slate-200 leading-relaxed">
                {fallbackSummary}
              </p>
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="size-5 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs font-sans text-slate-200 leading-relaxed">
                  <span className="font-bold text-cyan-400 uppercase font-mono block mb-1">OPERATIVE NOTE</span>
                  Make sure to run your patches against local unit test suites before submitting your code for system decryption.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
