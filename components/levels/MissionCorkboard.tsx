"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import type { MissionStatus } from "@/types"
import type { LevelNode } from "@/app/levels/curriculum"
import { detectiveFontVariables } from "@/lib/detective-fonts"
import { MissionCard, type MissionState } from "@/components/case-map/MissionCard"
import { ThreadLayer, type ThreadEdge, type Pt } from "@/components/case-map/ThreadLayer"

type HubKey = "left" | "right" | "midLeft" | "midRight" | "top" | "lowLeft" | "lowRight"

// Where each case is pinned, as a percentage of the board, plus the paper's
// tilt and which pin on the centre photo its string ties to. Order runs
// clockwise: top band, right edge, bottom, left edge. These are the mockup's
// coordinates verbatim — the ring reaches x 10–90 / y 11–89. Pulling it inward
// is what crowds the folders into each other and into the centre photo.
const LAYOUT: { x: number; y: number; tilt: number; hub: HubKey }[] = [
    { x: 17, y: 13, tilt: -2.4, hub: "left" },
    { x: 30, y: 17, tilt: 1.8, hub: "left" },
    { x: 43, y: 11, tilt: -1.2, hub: "top" },
    // nudged up from the mockup's y:16 — at 16 it hung low enough to crowd
    // its neighbours and the MISSIONS tab below it
    { x: 57, y: 12, tilt: 2.6, hub: "top" },
    { x: 69, y: 11, tilt: -2.0, hub: "top" },
    { x: 80, y: 16, tilt: 1.6, hub: "right" },
    { x: 89, y: 28, tilt: -2.8, hub: "right" },
    { x: 79, y: 37, tilt: 2.2, hub: "right" },
    { x: 90, y: 50, tilt: -1.6, hub: "midRight" },
    { x: 80, y: 62, tilt: 2.8, hub: "midRight" },
    { x: 89, y: 75, tilt: -2.2, hub: "lowRight" },
    // shifted right of the mockup's x:74 — it sat under the surveillance-photo
    // prop pinned at 69%/72.5%
    { x: 78, y: 85, tilt: 1.4, hub: "lowRight" },
    { x: 58, y: 89, tilt: -2.6, hub: "lowRight" },
    { x: 42, y: 86, tilt: 2.0, hub: "lowLeft" },
    { x: 27, y: 88, tilt: -1.8, hub: "lowLeft" },
    { x: 12, y: 78, tilt: 2.4, hub: "lowLeft" },
    { x: 22, y: 66, tilt: -2.2, hub: "midLeft" },
    { x: 10, y: 55, tilt: 1.8, hub: "midLeft" },
    { x: 20, y: 41, tilt: -2.6, hub: "midLeft" },
    { x: 10, y: 30, tilt: 2.2, hub: "left" },
]

/** the cleared cases along the top also share one running string */
const RAIL = [0, 1, 2, 3, 4, 5]

// The seven tie-off pins, centred on the polaroid's white mat rather than on
// the photograph. The mat is 20px, so a 19px pin head centred 10px in from the
// padding box sits fully on the paper and clear of the print.
const HUB_PINS: { key: HubKey; className: string }[] = [
    { key: "top", className: "left-1/2 top-[10px] -translate-x-1/2 -translate-y-1/2" },
    { key: "left", className: "left-[10px] top-[60px] -translate-x-1/2 -translate-y-1/2" },
    { key: "right", className: "right-[10px] top-[60px] translate-x-1/2 -translate-y-1/2" },
    { key: "midLeft", className: "left-[10px] top-[130px] -translate-x-1/2 -translate-y-1/2" },
    { key: "midRight", className: "right-[10px] top-[130px] translate-x-1/2 -translate-y-1/2" },
    { key: "lowLeft", className: "left-[10px] top-[205px] -translate-x-1/2 -translate-y-1/2" },
    { key: "lowRight", className: "right-[10px] top-[205px] translate-x-1/2 -translate-y-1/2" },
]

const PROP_PHOTOS = [
    { x: "30.5%", y: "34%", tilt: "-4deg" },
    { x: "69.5%", y: "30%", tilt: "3.4deg" },
    { x: "69%", y: "72.5%", tilt: "-2.6deg" },
    { x: "31%", y: "71.5%", tilt: "4deg" },
]
const PROP_SLIPS = [
    { x: "31%", y: "44%", tilt: "-6deg", text: "Connection Point" },
    { x: "30.5%", y: "57.5%", tilt: "4deg", text: "Timeline" },
    { x: "69%", y: "44%", tilt: "5deg", text: "Alibi?" },
    { x: "69.5%", y: "57.5%", tilt: "-4deg", text: "Key Link" },
]

const HUB_BY_PATH: Record<"Beginner" | "Intermediate" | "Expert", { photo: string; alt: string; label: string }> = {
    Beginner: { photo: "/characters/dossier/panda.jpeg", alt: "Agent Panda, mission control for Code Undercover", label: "AGENT PANDA" },
    Intermediate: { photo: "/characters/dossier/fox.jpeg", alt: "Agent Fox, mission control for Code Undercover", label: "AGENT FOX" },
    Expert: { photo: "/characters/dossier/platypus.jpeg", alt: "Agent Platypus, mission control for Code Undercover", label: "AGENT PLATYPUS" },
}

const TAB_COLOR: Record<"Beginner" | "Intermediate" | "Expert", string> = {
    Beginner: "linear-gradient(180deg, #a5453a, #7a2e28)",
    Intermediate: "linear-gradient(180deg, #6d8f6f, #46664a)",
    Expert: "linear-gradient(180deg, #6b7a9e, #3d4a6b)",
}

const PIN_FACE =
    "rounded-full bg-[radial-gradient(circle_at_34%_28%,#e8837a,#a5453a_55%,#571c17_100%)]"

interface CorkboardLevel {
    lvl: LevelNode
    status: MissionStatus
    isLocked: boolean
    realMissionId?: string
}

interface MissionCorkboardProps {
    levels: CorkboardLevel[]
    activePath: "Beginner" | "Intermediate" | "Expert"
}

export function MissionCorkboard({ levels, activePath }: MissionCorkboardProps) {
    const mainRef = useRef<HTMLDivElement | null>(null)
    const glowRef = useRef<HTMLDivElement | null>(null)
    const stageRef = useRef<HTMLDivElement | null>(null)

    // Warm lamp glow following cursor
    useEffect(() => {
        const main = mainRef.current
        const glow = glowRef.current
        if (!main || !glow) return
        const onMove = (e: MouseEvent) => {
            const rect = main.getBoundingClientRect()
            glow.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`)
            glow.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`)
        }
        main.addEventListener("mousemove", onMove)
        return () => main.removeEventListener("mousemove", onMove)
    }, [])

    const hub = HUB_BY_PATH[activePath]

    // ─── Red string, measured off the live pin heads ───
    const hubPinRefs = useRef<Partial<Record<HubKey, HTMLSpanElement | null>>>({})
    const cardPinRefs = useRef<(HTMLSpanElement | null)[]>([])
    const [threads, setThreads] = useState<{ edges: ThreadEdge[]; rail: Pt[]; w: number; h: number }>({
        edges: [], rail: [], w: 0, h: 0,
    })

    const measure = useCallback(() => {
        const stage = stageRef.current
        if (!stage) return
        const base = stage.getBoundingClientRect()
        if (!base.width || !base.height) return

        const centreOf = (el: Element | null | undefined): Pt | null => {
            if (!el) return null
            const r = el.getBoundingClientRect()
            return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top }
        }

        const edges: ThreadEdge[] = []
        levels.forEach(({ status, isLocked }, i) => {
            const spot = LAYOUT[i]
            if (!spot) return
            const from = centreOf(cardPinRefs.current[i])
            const to = centreOf(hubPinRefs.current[spot.hub])
            if (!from || !to) return
            edges.push({ id: i + 1, from, to, live: !isLocked || status === "COMPLETED" })
        })

        const rail = RAIL
            .map((i) => centreOf(cardPinRefs.current[i]))
            .filter((p): p is Pt => p !== null)

        setThreads({ edges, rail, w: base.width, h: base.height })
    }, [levels])

    // Measure once the folders are laid out, and again whenever the board is
    // resized — a thread pinned to a stale coordinate drifts off its pin.
    useLayoutEffect(() => {
        measure()
        const stage = stageRef.current
        if (!stage || typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        ro.observe(stage)
        return () => ro.disconnect()
    }, [measure])

    // Webfonts change the folder metrics after first paint, which moves the pins.
    useEffect(() => {
        if (!document.fonts?.ready) return
        let cancelled = false
        document.fonts.ready.then(() => { if (!cancelled) measure() })
        return () => { cancelled = true }
    }, [measure])

    return (
        <div
            ref={mainRef}
            className={`${detectiveFontVariables} relative flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-3 min-h-[620px] w-full bg-[radial-gradient(ellipse_900px_520px_at_16%_6%,rgba(232,165,69,0.14),transparent_60%),radial-gradient(ellipse_720px_520px_at_88%_92%,rgba(0,0,0,0.42),transparent_60%),linear-gradient(160deg,#204a3a_0%,#17342a_45%,#0d2118_100%)]`}
            style={{ zIndex: "var(--z-board)" }}
        >
            <div className="pointer-events-none absolute inset-0 z-[1] bg-grain opacity-[0.55] mix-blend-overlay" aria-hidden="true" />
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light bg-[radial-gradient(circle_460px_at_var(--mx,50%)_var(--my,26%),rgba(232,165,69,0.16),transparent_68%)]"
                aria-hidden="true"
            />

            {/* ─── Brown cork board inside walnut frame ─── */}
            <div className="relative mx-auto flex min-h-0 w-full max-w-[1320px] flex-1 flex-col rounded-lg border-[11px] border-walnut px-[clamp(16px,2vw,30px)] py-[clamp(14px,2.2vh,26px)] bg-cork bg-[radial-gradient(circle_at_30%_30%,rgba(255,230,192,0.20)_1px,transparent_1.5px),radial-gradient(circle_at_70%_70%,rgba(74,38,10,0.22)_1.1px,transparent_1.6px),radial-gradient(circle_at_18%_16%,rgba(255,228,186,0.22),transparent_46%),radial-gradient(circle_at_84%_82%,rgba(60,30,8,0.30),transparent_48%)] [background-size:11px_11px,17px_17px,auto,auto] shadow-[0_30px_56px_rgba(0,0,0,0.6),0_8px_16px_rgba(0,0,0,0.45),inset_0_0_110px_rgba(74,38,10,0.55),inset_0_4px_10px_rgba(0,0,0,0.4)]"
                style={{ zIndex: 1 }}>
                <div className="pointer-events-none absolute inset-0 bg-grain opacity-50 mix-blend-multiply" aria-hidden="true" />
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.55] mix-blend-multiply bg-[radial-gradient(ellipse_88%_84%_at_44%_42%,transparent_38%,#8b5c30_100%)]"
                    aria-hidden="true"
                />

                {/* ─── Stage ─── */}
                <div ref={stageRef} className="relative w-full flex-1 min-h-[540px]">
                    {/* Pinned clutter: blank surveillance photos and handwritten slips */}
                    <div className="pointer-events-none absolute inset-0 max-sm:hidden" style={{ zIndex: "var(--z-notes)" }} aria-hidden="true">
                        {PROP_PHOTOS.map((p) => (
                            <span
                                key={`${p.x}-${p.y}`}
                                className="absolute h-[clamp(58px,6.6vh,86px)] w-[clamp(48px,5.4vh,70px)] p-[5px] pb-3.5 bg-[linear-gradient(180deg,#f6f1e2,#e6dfcb)] shadow-[0_8px_15px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.6)]"
                                style={{ left: p.x, top: p.y, transform: `rotate(${p.tilt})` }}
                            >
                                <span className={`absolute -top-1.5 left-1/2 size-[13px] -translate-x-1/2 ${PIN_FACE} shadow-[0_4px_6px_rgba(0,0,0,0.55),inset_0_-2px_3px_rgba(0,0,0,0.35)]`} />
                                <span className="absolute inset-[5px] bottom-3.5 bg-[linear-gradient(160deg,#1d1b18,#2c2a25_60%,#171512)] shadow-[inset_0_2px_6px_rgba(0,0,0,0.6)]" />
                            </span>
                        ))}
                        {PROP_SLIPS.map((s) => (
                            <span
                                key={s.text}
                                className="absolute max-w-[120px] bg-note px-[9px] pb-1.5 pt-[9px] text-center font-chalk text-[clamp(0.6rem,1.05vh,0.8rem)] font-bold leading-[1.15] text-walnut-deep shadow-[0_7px_13px_rgba(0,0,0,0.4)]"
                                style={{ left: s.x, top: s.y, transform: `rotate(${s.tilt})` }}
                            >
                                <span className={`absolute -top-[5px] left-1/2 size-[10px] -translate-x-1/2 ${PIN_FACE} shadow-[0_4px_6px_rgba(0,0,0,0.55),inset_0_-2px_3px_rgba(0,0,0,0.35)]`} />
                                {s.text}
                            </span>
                        ))}
                    </div>

                    {/* Red string, tied pin-to-pin */}
                    <ThreadLayer edges={threads.edges} rail={threads.rail} width={threads.w} height={threads.h} />

                    {/* ─── Case Folders ─── */}
                    {levels.map(({ lvl, status, isLocked, realMissionId }, i) => {
                        const spot = LAYOUT[i]
                        if (!spot) return null

                        const cardState: MissionState = status === "COMPLETED" ? "cleared" : isLocked ? "locked" : "active"
                        const href = !isLocked && realMissionId ? `/mission/${realMissionId}` : undefined

                        return (
                            <MissionCard
                                key={lvl.id}
                                index={lvl.order}
                                title={lvl.title}
                                state={cardState}
                                pinRef={(el) => { cardPinRefs.current[i] = el }}
                                onOpen={() => {
                                    if (href) window.location.href = href
                                }}
                                style={{
                                    left: `${spot.x}%`,
                                    top: `${spot.y}%`,
                                    transform: `translate(-50%, -50%) rotate(${spot.tilt}deg)`,
                                }}
                            />
                        )
                    })}

                    {/* ─── Polaroid & MISSIONS Badge ─── */}
                    <span
                        className="absolute left-1/2 -translate-x-1/2 rounded-[3px] border border-chalk/20 px-4 py-1 font-data text-[12px] font-bold tracking-[.3em] text-chalk shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)]"
                        style={{
                            top: "calc(50% - 150px - 28px)",
                            background: TAB_COLOR[activePath],
                            zIndex: "var(--z-notes)",
                        }}
                    >
                        MISSIONS
                    </span>

                    <article
                        style={{
                            width: "250px",
                            height: "290px",
                            zIndex: "var(--z-polaroid)",
                        }}
                        // 20px mat (not 14px) so a 19px pin head fits on the
                        // paper without overhanging onto the print
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-5 pb-10 bg-[#F7F4EA] border-[6px] border-[#2A2419] shadow-[0_24px_40px_-18px_rgba(0,0,0,0.7),0_4px_8px_rgba(0,0,0,0.4)]"
                    >
                        {/* seven tie-offs the red string knots onto. They sit above
                            the threads so every line ends beneath a pin head. */}
                        {HUB_PINS.map((p) => (
                            <span
                                key={p.key}
                                ref={(el) => { hubPinRefs.current[p.key] = el }}
                                className={`absolute size-[19px] ${PIN_FACE} ${p.className} shadow-[0_5px_8px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(0,0,0,0.35)]`}
                                style={{ zIndex: "var(--z-pins)" }}
                                aria-hidden="true"
                            />
                        ))}

                        <div className="relative h-[200px] w-full overflow-hidden rounded-[1px] bg-[#14231d] [filter:sepia(.22)_saturate(1.2)_contrast(1.05)_brightness(.99)]">
                            {/* `fill`, not width/height — the wrapper is already
                                sized (relative h-[200px] w-full), and passing
                                intrinsic dimensions that CSS then overrides on
                                both axes is what triggers Next's aspect-ratio
                                warning on every render. */}
                            <Image
                                src={hub.photo}
                                alt={hub.alt}
                                fill
                                sizes="200px"
                                className="object-cover"
                            />
                            <div
                                className="pointer-events-none absolute inset-0 mix-blend-multiply bg-[radial-gradient(ellipse_72%_74%_at_50%_44%,transparent_40%,rgba(15,25,18,0.5)_100%),linear-gradient(160deg,rgba(232,165,69,0.12),rgba(23,52,42,0.24))]"
                                aria-hidden="true"
                            />
                            <div
                                className="pointer-events-none absolute inset-0 bg-grain opacity-45 mix-blend-overlay"
                                aria-hidden="true"
                            />
                        </div>

                        <span className="absolute inset-x-0 bottom-3 text-center font-display text-[15px] tracking-[.16em] text-[#2A2419]">
                            {hub.label}
                        </span>
                    </article>
                </div>

                {/* ─── Back Button ─── */}
                <Link
                    href="/skill"
                    aria-label="Go back to sector selection"
                    className="absolute bottom-4 left-6 flex items-center gap-1.5 rounded-[4px] border border-[#c2b291] bg-[#e4d6b6] px-3.5 py-1.5 font-data text-[12px] font-bold tracking-[.08em] text-[#3b2b1d] shadow-md hover:-translate-y-0.5 transition-transform"
                    style={{ zIndex: "var(--z-chrome)" }}
                >
                    <ChevronLeft size={14} /> Back
                </Link>
            </div>

            {/* ─── Legend ─── */}
            <p className="relative z-[3] mt-2 flex flex-wrap items-center justify-center gap-6 font-data text-[12px] font-semibold tracking-[.08em] text-[#A6C0B4]">
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-[2px] bg-[#F4F1E4] border border-[#2F7D3A]" />
                    <span className="text-[#2F7D3A]">Cleared</span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-[2px] bg-[#E8B54A]" />
                    <span className="text-[#E8B54A]">In progress</span>
                </span>
                <span className="flex items-center gap-2">
                    <span className="size-3 rounded-[2px] bg-[#D5C7A9]" />
                    <span className="text-[#D5C7A9]">Locked</span>
                </span>
            </p>
        </div>
    )
}
