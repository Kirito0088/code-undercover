"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function IntroPage() {
    const { replace, push } = useRouter()
    const { data: session, status } = useSession()
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [shouldPlay, setShouldPlay] = useState(false)
    const [autoplayBlocked, setAutoplayBlocked] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    // ── Auth + intro-seen guard ──────────────────────────────────────────────
    useEffect(() => {
        if (status === "loading") return

        if (status === "unauthenticated") {
            replace("/login")
            return
        }

        const userId = session?.user?.id
        if (!userId) return

        const hasSeenIntro = localStorage.getItem(`hasSeenIntro_${userId}`)
        if (hasSeenIntro === "true") {
            replace("/levels")
            return
        }

        // Kick off video playback directly here — no second useEffect needed.
        setShouldPlay(true)
        if (videoRef.current) {
            videoRef.current.play().catch(() => {
                // Browser blocked autoplay (video is unmuted); show manual prompt.
                setAutoplayBlocked(true)
            })
        }
    }, [replace, session, status])

    const handleManualStart = () => {
        if (videoRef.current) {
            videoRef.current.play()
            setAutoplayBlocked(false)
        }
    }

    const handleVideoEnd = () => {
        const userId = session?.user?.id
        if (userId) {
            localStorage.setItem(`hasSeenIntro_${userId}`, "true")
        }
        setIsFadingOut(true)
        setTimeout(() => push("/levels"), 2000)
    }


    if (!shouldPlay) {
        return <div className="fixed inset-0 bg-gray-950 z-50 pointer-events-none" />
    }

    return (
        <div className="fixed inset-0 z-50 bg-gray-950 flex items-center justify-center">
            {/* SKIP Button */}
            <button
                type="button"
                onClick={handleVideoEnd}
                aria-label="Skip intro video"
                className="absolute top-6 right-8 z-[70] flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs tracking-wider uppercase transition-all duration-200 bg-black/40 hover:bg-white/10 px-4 py-2 rounded border border-gray-700/50 hover:border-gray-500 backdrop-blur-sm shadow-lg"
            >
                SKIP
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4" aria-hidden="true">
                    <path d="M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.277l6.323-3.905a1.5 1.5 0 0 0 0-2.554L3.288 4.818ZM13 4.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z" />
                </svg>
            </button>

            {/* Autoplay-blocked overlay — full-screen semantic button */}
            {autoplayBlocked && (
                <button
                    type="button"
                    aria-label="Click or press Enter to start the intro video"
                    className="absolute inset-0 z-[60] w-full flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer appearance-none border-0 p-0"
                    onClick={handleManualStart}
                >
                    <div className="text-cyan-400 font-mono text-xl tracking-widest animate-pulse border border-cyan-500/30 bg-cyan-950/40 px-8 py-4 rounded-lg">
                        CLICK TO INITIATE MISSION
                    </div>
                </button>
            )}

            {/* TERMINAL INITIALIZING fade overlay */}
            <div
                className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-[2000ms] ${
                    isFadingOut ? "opacity-100" : "opacity-0"
                }`}
            >
                <div className="flex flex-col items-center">
                    <span className="relative flex size-4 mb-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full size-4 bg-green-500"></span>
                    </span>
                    <h2 className="text-green-500 font-mono text-xl tracking-[0.3em] font-semibold animate-pulse">
                        TERMINAL INITIALIZING…
                    </h2>
                </div>
            </div>

            {/* Intro video — captions track included for accessibility */}
            <video
                ref={videoRef}
                src="/intro2.mp4"
                playsInline
                muted={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onEnded={handleVideoEnd}
                onError={handleVideoEnd}
                aria-label="Code Undercover intro cinematic"
                className={`relative z-50 w-full h-full object-contain transition-opacity duration-[2000ms] bg-gray-950 ${
                    isFadingOut ? "opacity-0" : "opacity-100"
                }`}
                style={{ pointerEvents: "none" }}
            >
                {/* Captions file — add a real VTT when available */}
                <track kind="captions" srcLang="en" label="English" default />
            </video>
        </div>
    )
}
