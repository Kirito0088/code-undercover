"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function IntroPage() {
    const { push, refresh } = useRouter()
    const { data: session, status, update: updateSession } = useSession()
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [autoplayBlocked, setAutoplayBlocked] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)
    const redirectTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>> | null>(null)
    if (redirectTimeoutsRef.current === null) {
        redirectTimeoutsRef.current = new Set()
    }
    const redirectTimeouts = redirectTimeoutsRef.current
    const markingRef = useRef(false)

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            redirectTimeouts.forEach(clearTimeout)
            redirectTimeouts.clear()
        }
    }, [redirectTimeouts])

    // Auth guard (defensive — middleware already handles this at the edge) and autoplay video
    useEffect(() => {
        if (status === "loading") return
        if (status === "unauthenticated") {
            push("/login")
            return
        }
        if (session?.user?.hasSeenIntro) {
            push("/levels")
            return
        }
        if (videoRef.current) {
            videoRef.current.play().catch(() => setAutoplayBlocked(true))
        }
    }, [status, session, push])

    /**
     * Called when the video ends or the user clicks Skip.
     *
     * Order of operations:
     * 1. POST /api/auth/intro-seen  →  writes hasSeenIntro=true to DB
     * 2. updateSession()            →  refreshes JWT so middleware is unblocked
     * 3. localStorage               →  written as a UI speed cache only
     * 4. Redirect to /levels
     */
    const markIntroComplete = useCallback(
        async (isSkip: boolean) => {
            if (markingRef.current) return
            markingRef.current = true

            setIsFadingOut(true)

            // Clear any pending redirect timers
            redirectTimeouts.forEach(clearTimeout)
            redirectTimeouts.clear()

            try {
                // 1. Await database write to mark intro seen
                await fetch("/api/auth/intro-seen", { method: "POST" })
                
                // 2. Await NextAuth JWT token update so middleware is unblocked
                await updateSession()
            } catch (err) {
                console.error("[INTRO] Failed to record intro complete on server:", err)
            }

            // Optimistic localStorage cache for UI speed
            const userId = session?.user?.id
            if (userId) {
                try {
                    localStorage.setItem(`hasSeenIntro_${userId}`, "true")
                } catch {
                    // Private browsing / quota exceeded — safe to ignore
                }
            }

            // Small delay to let the fade out transition visually complete
            const delay = isSkip ? 300 : 1000
            const t = setTimeout(() => {
                push("/levels")
                refresh()
                redirectTimeouts.delete(t)
            }, delay)
            redirectTimeouts.add(t)
        },
        [session, push, refresh, updateSession, redirectTimeouts]
    )

    const handleManualStart = () => {
        if (videoRef.current) {
            videoRef.current.play()
            setAutoplayBlocked(false)
        }
    }

    const isReady = status === "authenticated" && !session?.user?.hasSeenIntro

    // Dark screen while session loads (prevents flash of unprotected content)
    if (!isReady) {
        return (
            <div
                className="fixed inset-0 bg-[#07080A] z-50 pointer-events-none"
                aria-hidden="true"
            />
        )
    }

    return (
        <div className="fixed inset-0 z-50 bg-[#07080A] flex items-center justify-center">

            {/* Skip button */}
            <button
                type="button"
                onClick={() => markIntroComplete(true)}
                aria-label="Skip intro video"
                className="absolute top-6 right-8 z-[70] flex items-center gap-1.5 text-xs text-[#8F9F8F] hover:text-[#E2E8F0] transition-all duration-200 bg-[#0D0E12]/80 hover:bg-[#161820] px-3.5 py-1.5 rounded-md border border-[#1F261F] hover:border-[#2A3A2A] backdrop-blur-sm shadow-md"
            >
                Skip Intro
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="size-3.5"
                    aria-hidden="true"
                >
                    <path d="M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.277l6.323-3.905a1.5 1.5 0 0 0 0-2.554L3.288 4.818ZM13 4.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z" />
                </svg>
            </button>

            {/* Autoplay-blocked overlay */}
            {autoplayBlocked && (
                <button
                    type="button"
                    aria-label="Click or press Enter to start the intro video"
                    className="absolute inset-0 z-[60] w-full flex flex-col items-center justify-center bg-[#07080A]/80 backdrop-blur-sm cursor-pointer appearance-none border-0 p-0"
                    onClick={handleManualStart}
                >
                    <div className="text-indigo-400 text-sm font-medium tracking-wide animate-pulse border border-indigo-500/20 bg-indigo-500/5 px-6 py-3.5 rounded-lg">
                        Click to start mission intro
                    </div>
                </button>
            )}

            {/* Fade-out overlay */}
            <div
                className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-1000 ${isFadingOut ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="flex flex-col items-center">
                    <span className="relative flex size-3 mb-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                        <span className="relative inline-flex rounded-full size-3 bg-indigo-500" />
                    </span>
                    <h2 className="text-[#E2E8F0] font-semibold text-sm tracking-widest uppercase animate-pulse">
                        Initializing Terminal…
                    </h2>
                </div>
            </div>

            {/* Intro video */}
            <video
                ref={videoRef}
                src="/intro2.mp4"
                playsInline
                muted={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onEnded={() => markIntroComplete(false)}
                onError={() => markIntroComplete(false)}
                aria-label="Code Undercover intro cinematic"
                className={`relative z-50 w-full h-full object-contain transition-opacity duration-1000 bg-[#07080A] ${isFadingOut ? "opacity-0" : "opacity-100"
                    }`}
                style={{ pointerEvents: "none" }}
            >
                <track kind="captions" srcLang="en" label="English" default />
            </video>
        </div>
    )
}
