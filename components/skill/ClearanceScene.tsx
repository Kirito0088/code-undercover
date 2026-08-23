"use client"

// Clearance select — port of the mockup's skill.html / skill.css / skill.js.
// Three pinned evidence boards on a chalkboard wall; a red string runs behind
// all of them, the pushpins drop in from off-screen and the frame takes the
// hit, and stamping a board flies it to centre under the blackboard wipe
// before opening the matching mission board.
//
// Shared by /skill (public) and /dashboard (auth-gated) — both screens are
// this same board, so they render one component rather than two copies.
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react"
import { flushSync } from "react-dom"
import { useRouter } from "next/navigation"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { detectiveFontVariables } from "@/lib/detective-fonts"
import { useCaseTransition } from "@/hooks/useCaseTransition"
import { CaseTransitionOverlay } from "@/components/transition/CaseTransitionOverlay"
import type { ClearanceProgress, ClearanceTier } from "@/lib/clearance"
import styles from "./ClearanceScene.module.css"

/** How long the "this one is still locked" rattle runs — matches the CSS. */
const RATTLE_MS = 550

interface ClearanceCard {
    id: string
    tier: ClearanceTier
    /** clearance label pinned over the top edge */
    level: string
    caption: string
    photo: string
    alt: string
    desc: string
    /** LevelsClient reads ?path= and only accepts Beginner|Intermediate|Expert */
    nextRoute: string
    cardClass: string
}

const CLEARANCE_CARDS: ClearanceCard[] = [
    {
        id: "beginner",
        tier: "Beginner",
        level: "BEGINNER",
        caption: "AGENT PANDA",
        photo: "/characters/dossier/panda.jpeg",
        alt: "Beginner clearance dossier photo — Agent Panda",
        desc: "Learn basic coding concepts and build a strong foundation.",
        nextRoute: "/levels?path=Beginner",
        cardClass: styles.cardBeginner,
    },
    {
        id: "intermediate",
        tier: "Intermediate",
        level: "INTERMEDIATE",
        caption: "AGENT FOX",
        photo: "/characters/dossier/fox.jpeg",
        alt: "Intermediate clearance dossier photo — Agent Fox",
        desc: "Sharpen your debugging and take on more complex challenges.",
        nextRoute: "/levels?path=Intermediate",
        cardClass: styles.cardIntermediate,
    },
    {
        id: "pro",
        tier: "Pro",
        level: "PRO",
        caption: "AGENT PLATYPUS",
        photo: "/characters/dossier/platypus.jpeg",
        alt: "Pro clearance dossier photo — Agent Platypus",
        desc: "Solve advanced problems and put your expertise to work.",
        nextRoute: "/levels?path=Expert",
        cardClass: styles.cardPro,
    },
]

/** "AGENT PANDA" for the tier that holds a locked board shut. */
const CAPTION_BY_TIER = Object.fromEntries(
    CLEARANCE_CARDS.map((c) => [c.tier, c.caption])
) as Record<ClearanceTier, string>

const CODE_BITS = [
    { text: '<debug mode="on"/>', top: "10%", left: "4%", r: "-5deg", delay: "0s" },
    { text: "if (bug.found) { solve(); }", top: "26%", left: "36%", r: "3deg", delay: "1.2s" },
    { text: "01001000 01001001", top: "8%", left: "72%", r: "-3deg", delay: "1.8s" },
    { text: "for (clue of evidence)", top: "52%", left: "2%", r: "4deg", delay: "2.6s" },
    { text: "console.log('caught you');", top: "86%", left: "64%", r: "-4deg", delay: "0.3s" },
    { text: "return caseClosed;", top: "90%", left: "22%", r: "2deg", delay: "1.5s" },
]

interface ClearanceSceneProps {
    /** Per-tier progress deciding which boards are open. See lib/clearance.ts. */
    progress: ClearanceProgress
}

export function ClearanceScene({ progress }: ClearanceSceneProps) {
    const router = useRouter()
    const mainRef = useRef<HTMLElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<Record<string, HTMLElement | null>>({})
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [flyingId, setFlyingId] = useState<string | null>(null)
    const [rattlingId, setRattlingId] = useState<string | null>(null)
    const rattleTimer = useRef<number | null>(null)

    useEffect(() => () => {
        if (rattleTimer.current !== null) window.clearTimeout(rattleTimer.current)
    }, [])

    const { phase, message, launch } = useCaseTransition()
    const isTransitioning = phase !== "idle"

    // Warm lamp glow following the cursor across the board. Written straight to
    // CSS custom properties rather than through state — a mousemove that sets
    // state re-renders all three boards on every pointer sample.
    useEffect(() => {
        const main = mainRef.current
        const glow = glowRef.current
        if (!main || !glow) return

        const onMove = (e: globalThis.MouseEvent) => {
            const rect = main.getBoundingClientRect()
            glow.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`)
            glow.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`)
        }

        main.addEventListener("mousemove", onMove)
        return () => main.removeEventListener("mousemove", onMove)
    }, [])

    // Same "Assigning clearance" chalk message as the mockup's skill.js —
    // it's the same text regardless of which board was picked.
    const handleStartMission = (e: MouseEvent<HTMLAnchorElement>, card: ClearanceCard) => {
        // Let cmd/ctrl/shift-click open the mission board in a new tab.
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        if (isTransitioning) return
        // Belt and braces — a locked board renders a button, not this link.
        if (!progress[card.tier].unlocked) {
            rattle(card.id)
            return
        }

        setSelectedId(card.id)
        setFlyingId(card.id)
        launch({
            href: card.nextRoute,
            element: cardRefs.current[card.id] ?? null,
            message: "Assigning clearance",
        })
    }

    // Trying a padlocked board shakes it.
    const rattle = (cardId: string) => {
        if (rattleTimer.current !== null) window.clearTimeout(rattleTimer.current)

        // Clicking again mid-shake should shake again, and a CSS animation only
        // replays if the class is genuinely absent for one style recalculation.
        // flushSync commits the removal to the DOM and reading a layout
        // property forces that recalculation; toggling across a state update
        // alone would coalesce into one frame and change nothing on screen.
        if (rattlingId === cardId) {
            flushSync(() => setRattlingId(null))
            void cardRefs.current[cardId]?.offsetWidth
        }

        setRattlingId(cardId)
        rattleTimer.current = window.setTimeout(() => setRattlingId(null), RATTLE_MS)
    }

    const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        router.back()
    }

    return (
        <main ref={mainRef} className={`${styles.boardMain} ${detectiveFontVariables}`}>
            <div className={styles.pageVignette} aria-hidden="true" />
            <div className={styles.chalkNoise} aria-hidden="true" />
            <div ref={glowRef} className={styles.lampGlow} aria-hidden="true" />

            {/* chalk-written code drifting on the board, purely atmospheric */}
            <div className={styles.codeBg} aria-hidden="true">
                {CODE_BITS.map((bit) => (
                    <span
                        key={bit.text}
                        className={styles.codeBit}
                        style={{ top: bit.top, left: bit.left, "--r": bit.r, animationDelay: bit.delay } as CSSProperties}
                    >
                        {bit.text}
                    </span>
                ))}
            </div>

            <div className={styles.inner}>
                <header className={`${styles.head} ${isTransitioning ? styles.headFading : ""}`}>
                    <h1 className={styles.title}>
                        Start Your <span className={styles.accent}>Journey!</span>
                    </h1>
                    <span className={styles.rule} aria-hidden="true" />
                </header>

                <section className={styles.row} aria-label="Skill levels">
                    {CLEARANCE_CARDS.map((card, i) => {
                        const tier = progress[card.tier]
                        const locked = !tier.unlocked
                        // Every board keeps its own record. A sealed one reads 0 of N
                        // rather than borrowing the tally of the board gating it — that
                        // number belongs on the board where it was earned.
                        const percent = tier.total > 0
                            ? Math.round((tier.completed / tier.total) * 100)
                            : 0
                        // The board that has to be cleared before this one opens.
                        const gate = tier.requires ? progress[tier.requires] : undefined
                        const gateCaption = tier.requires ? CAPTION_BY_TIER[tier.requires] : ""

                        const isSelected = !locked && selectedId === card.id
                        const isFlying = flyingId === card.id
                        const isRattling = rattlingId === card.id

                        return (
                            <article
                                key={card.id}
                                ref={(el) => { cardRefs.current[card.id] = el }}
                                className={[
                                    styles.card,
                                    card.cardClass,
                                    locked ? styles.cardLocked : "",
                                    isRattling ? styles.cardRattling : "",
                                    isSelected ? styles.cardSelected : "",
                                    isFlying ? styles.isFlying : "",
                                    isTransitioning && !isFlying ? styles.isFading : "",
                                ].filter(Boolean).join(" ")}
                                style={{ "--i": i } as CSSProperties}
                                onClick={() => (locked ? rattle(card.id) : setSelectedId(card.id))}
                            >
                                <span className={`${styles.pin} ${styles.pinLeft}`} aria-hidden="true" />
                                <span className={`${styles.pin} ${styles.pinRight}`} aria-hidden="true" />
                                <span className={styles.tab}>{card.level}</span>

                                <div className={styles.frame}>
                                    <div className={styles.polaroid}>
                                        {/* background-image, not next/image: .is-glyph sizes the
                                            print `auto 74%`, which only background-size expresses. */}
                                        <div
                                            className={styles.crop}
                                            style={{ backgroundImage: `url("${card.photo}")` }}
                                            role="img"
                                            aria-label={card.alt}
                                        />
                                        <div className={styles.tint} aria-hidden="true" />
                                        <div className={styles.grain} aria-hidden="true" />

                                        {/* Brass padlock hanging over the sealed dossier. Decorative
                                            only — the button below carries the same news in words. */}
                                        {locked && (
                                            <div className={styles.lockLayer} aria-hidden="true">
                                                {/* Three nested layers, because their animations must be
                                                    able to run at the same time without cancelling each
                                                    other: .lockDrop seals then sways, .lockSvg rattles
                                                    when denied, and the shackle snaps shut inside both. */}
                                                <span className={styles.lockDrop}>
                                                    <svg className={styles.lockSvg} viewBox="0 0 64 78">
                                                        <g className={styles.lockShackleSnap}>
                                                            <path
                                                                className={styles.lockShackle}
                                                                d="M20 37 V23 a12 12 0 0 1 24 0 V37"
                                                            />
                                                        </g>
                                                        <rect className={styles.lockCase} x="9" y="34" width="46" height="38" rx="7" />
                                                        <rect className={styles.lockSheen} x="15" y="38.5" width="34" height="6" rx="3" />
                                                        <circle className={styles.lockHole} cx="32" cy="50" r="5" />
                                                        <path className={styles.lockHole} d="M29.7 53 h4.6 l-1.3 10 h-2 z" />
                                                    </svg>
                                                </span>
                                            </div>
                                        )}

                                        <span className={styles.caption}>{card.caption}</span>
                                    </div>
                                </div>

                                <div className={styles.body}>
                                    <p className={styles.desc}>{card.desc}</p>

                                    <div className={styles.foot}>
                                        {/* This board's own service record. The gauge is
                                            decorative; the count beside it carries the number. */}
                                        <p className={`${styles.record} ${locked ? styles.recordSealed : ""}`}>
                                            <span className={styles.recordLabel}>Clearance record</span>
                                            <span className={styles.gauge} aria-hidden="true">
                                                <span className={styles.gaugeFill} style={{ width: `${percent}%` }} />
                                            </span>
                                            <span className={styles.gaugeCount}>
                                                {tier.completed} / {tier.total} cleared
                                            </span>
                                        </p>

                                        {locked ? (
                                            <button
                                                type="button"
                                                className={`${styles.cta} ${styles.ctaLocked}`}
                                                onClick={() => rattle(card.id)}
                                                aria-label={
                                                    card.level + " clearance locked"
                                                }
                                            >
                                                <span className={styles.ctaLabel}>Locked</span>
                                            </button>
                                        ) : (
                                            <Link
                                                href={card.nextRoute}
                                                className={styles.cta}
                                                aria-label={`Start ${card.level} missions`}
                                                onClick={(e) => handleStartMission(e, card)}
                                                // Keyboard users get the same highlight as a pointer click.
                                                onFocus={() => setSelectedId(card.id)}
                                            >
                                                <span className={styles.ctaLabel}>Start Mission</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </article>
                        )
                    })}
                </section>
            </div>

            <Link
                href="/"
                onClick={handleBack}
                className={`${styles.backBtn} ${isTransitioning ? styles.backBtnFading : ""}`}
                aria-label="Go back"
            >
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                    <path d="M14.5 5 L7.5 12 L14.5 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </Link>

            <CaseTransitionOverlay phase={phase} message={message} />
        </main>
    )
}
