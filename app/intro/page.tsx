"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export default function IntroPage() {
    const router = useRouter()
    const { data: session, status } = useSession()
    const [isFadingOut, setIsFadingOut] = useState(false)
    const [shouldPlay, setShouldPlay] = useState(false)
    const [autoplayBlocked, setAutoplayBlocked] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // Wait until session is loaded before deciding
        if (status === "loading") return

        // If not authenticated, redirect to login
        if (status === "unauthenticated") {
            router.replace("/login")
            return
        }

        const userId = session?.user?.id
        if (!userId) return

        // Per-user localStorage key
        const hasSeenIntro = localStorage.getItem(`hasSeenIntro_${userId}`)
        if (hasSeenIntro === "true") {
            router.replace("/levels")
        } else {
            setShouldPlay(true)
        }
    }, [router, session, status])

    useEffect(() => {
        if (shouldPlay && videoRef.current) {
            const playPromise = videoRef.current.play()
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log("Autoplay was prevented:", error)
                    // Browser blocked autoplay (usually because it's not muted)
                    setAutoplayBlocked(true)
                })
            }
        }
    }, [shouldPlay])

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

        setTimeout(() => {
            router.push("/levels")
        }, 2000)
    }

    if (!shouldPlay) {
        return <div className="fixed inset-0 bg-black z-50 pointer-events-none" />
    }

    return (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
            {/* SKIP Button — top-right corner */}
            <button
                onClick={handleVideoEnd}
                className="absolute top-6 right-8 z-[70] flex items-center gap-2 text-gray-400 hover:text-white font-mono text-xs tracking-wider uppercase transition-all duration-200 bg-black/40 hover:bg-white/10 px-4 py-2 rounded border border-gray-700/50 hover:border-gray-500 backdrop-blur-sm shadow-lg"
            >
                SKIP
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M3.288 4.818A1.5 1.5 0 0 0 1 6.095v7.81a1.5 1.5 0 0 0 2.288 1.277l6.323-3.905a1.5 1.5 0 0 0 0-2.554L3.288 4.818ZM13 4.5a1 1 0 0 1 1 1v9a1 1 0 1 1-2 0v-9a1 1 0 0 1 1-1Z" />
                </svg>
            </button>

            {autoplayBlocked && (
                <div
                    className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
                    onClick={handleManualStart}
                >
                    <div className="text-cyan-400 font-mono text-xl tracking-widest animate-pulse border border-cyan-500/30 bg-cyan-950/40 px-8 py-4 rounded-lg">
                        CLICK TO INITIATE MISSION
                    </div>
                </div>
            )}

            {/* TERMINAL INITIALIZING Loading Background */}
            <div
                className={`absolute inset-0 z-40 flex items-center justify-center transition-opacity duration-[2000ms] ${isFadingOut ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="flex flex-col items-center">
                    <span className="relative flex h-4 w-4 mb-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                    </span>
                    <h2 className="text-green-500 font-mono text-xl tracking-[0.3em] font-bold animate-pulse">
                        TERMINAL INITIALIZING...
                    </h2>
                </div>
            </div>

            <video
                ref={videoRef}
                src="/intro2.mp4"
                playsInline
                muted={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noremoteplayback"
                onEnded={handleVideoEnd}
                onError={handleVideoEnd} // Skip if file is corrupt
                className={`relative z-50 w-full h-full object-contain transition-opacity duration-[2000ms] bg-black ${isFadingOut ? "opacity-0" : "opacity-100"
                    }`}
                style={{ pointerEvents: "none" }}
            />
        </div>
    )
}
