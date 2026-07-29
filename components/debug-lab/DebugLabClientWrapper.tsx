"use client"

import React, { useState } from "react"
import { Play, Video } from "lucide-react"
import { ExplanationVideoModal } from "./ExplanationVideoModal"

export function DebugLabClientWrapper() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState({
    title: "Deconstructing System Memory Corruption",
    code: "DBG-094 // MEMORY_LEAK_ANALYSIS"
  })

  const openDemoModal = (title?: string, code?: string) => {
    if (title && code) {
      setSelectedVideo({ title, code })
    }
    setIsModalOpen(true)
  }

  return (
    <>
      <button
        onClick={() => openDemoModal()}
        className="px-4 py-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] cursor-pointer self-start sm:self-auto"
      >
        <Play className="size-3.5 fill-cyan-400 text-cyan-400" />
        <span>PREVIEW VIDEO INTEL TEMPLATE</span>
      </button>

      <ExplanationVideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        videoTitle={selectedVideo.title}
        moduleCode={selectedVideo.code}
      />
    </>
  )
}
