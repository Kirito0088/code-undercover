"use client"

// Reusable "case-file flies to centre, blackboard wipes over it, a chalk
// message gets written" page transition — ported from the detective-corkboard
// mockup's script.js / skill.js launchSequence(). Same three timing constants
// (WIPE_MS / CHALK_MS / LEAVE_MS) as the original, so every hop through the
// site reads identically. Unlike the mockup (separate static HTML pages
// reloading fresh), navigation here is a Next.js client-side transition, so
// there's no sessionStorage handoff to the next page — we just delay
// router.push() until the wipe has fully covered the viewport.
import { useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"

export type TransitionPhase = "idle" | "flying" | "visible" | "writing"

interface LaunchOptions {
    href: string
    /** The element to fly to centre — its live bounding rect is captured and
     *  pinned via position:fixed before the transform kicks in. Pass null to
     *  skip the fly animation and go straight to a plain navigation. */
    element: HTMLElement | null
    message: string
}

const WIPE_MS = 820
const CHALK_MS = 1360
const LEAVE_MS = 2750

export function useCaseTransition() {
    const router = useRouter()
    const [phase, setPhase] = useState<TransitionPhase>("idle")
    const [message, setMessage] = useState("")
    const launchingRef = useRef(false)

    const launch = useCallback(({ href, element, message }: LaunchOptions) => {
        if (launchingRef.current) return
        launchingRef.current = true

        const reducedMotion =
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches

        if (!element || reducedMotion) {
            router.push(href)
            return
        }

        setMessage(message)

        const rect = element.getBoundingClientRect()
        const dx = window.innerWidth / 2 - (rect.left + rect.width / 2)
        const dy = window.innerHeight / 2 - (rect.top + rect.height / 2)

        // Lift it out of the layout, pinned exactly where it already was.
        element.style.position = "fixed"
        element.style.margin = "0"
        element.style.top = `${rect.top}px`
        element.style.left = `${rect.left}px`
        element.style.width = `${rect.width}px`
        element.style.height = `${rect.height}px`
        element.style.zIndex = "90"
        element.style.pointerEvents = "none"

        setPhase("flying")

        // Two frames so the browser paints the starting position first,
        // otherwise the slide has nothing to transition from.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.style.transition = "transform .82s cubic-bezier(.28,.62,.2,1), box-shadow .82s ease"
                element.style.transform = `translate(${dx}px, ${dy}px) scale(1.16)`
                element.style.boxShadow = "0 40px 70px rgba(0,0,0,0.6), 0 0 60px rgba(232,165,69,0.18)"
            })
        })

        window.setTimeout(() => setPhase("visible"), WIPE_MS)
        window.setTimeout(() => setPhase("writing"), CHALK_MS)
        window.setTimeout(() => router.push(href), LEAVE_MS)
    }, [router])

    return { phase, message, launch }
}
