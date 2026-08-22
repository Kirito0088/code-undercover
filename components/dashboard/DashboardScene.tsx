"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import Image from "next/image"
import { AdaptiveLink as Link } from "@/components/common/AdaptiveLink"
import { detectiveFontVariables } from "@/lib/detective-fonts"
import { useCaseTransition } from "@/hooks/useCaseTransition"
import { CaseTransitionOverlay } from "@/components/transition/CaseTransitionOverlay"
import styles from "./DashboardScene.module.css"

const CLEARANCES = [
    {
        key: "Beginner",
        href: "/levels?path=Beginner",
        cardClass: styles.cardBeginner,
        tab: "BEGINNER",
        photo: "/characters/dossier/panda.jpeg",
        alt: "Beginner clearance, marked with the letter B",
        caption: "AGENT PANDA",
        desc: "Learn basic coding concepts and build a strong foundation.",
    },
    {
        key: "Intermediate",
        href: "/levels?path=Intermediate",
        cardClass: styles.cardIntermediate,
        tab: "INTERMEDIATE",
        photo: "/characters/dossier/fox.jpeg",
        alt: "Intermediate clearance, marked with the letter I",
        caption: "AGENT FOX",
        desc: "Sharpen your debugging and take on more complex challenges.",
    },
    {
        key: "Expert",
        href: "/levels?path=Expert",
        cardClass: styles.cardPro,
        tab: "PRO",
        photo: "/characters/dossier/platypus.jpeg",
        alt: "Expert clearance, marked with the letter E",
        caption: "AGENT PLATYPUS",
        desc: "Solve advanced problems and put your expertise to work.",
    },
] as const

const CODE_BITS = [
    { text: '<debug mode="on"/>', top: "10%", left: "4%", rot: "-5deg", delay: "0s" },
    { text: "if (bug.found) { solve(); }", top: "26%", left: "36%", rot: "3deg", delay: "1.2s" },
    { text: "01001000 01001001", top: "8%", left: "72%", rot: "-3deg", delay: "1.8s" },
    { text: "for (clue of evidence)", top: "52%", left: "2%", rot: "4deg", delay: "2.6s" },
    { text: "console.log('caught you');", top: "86%", left: "64%", rot: "-4deg", delay: "0.3s" },
    { text: "return caseClosed;", top: "90%", left: "22%", rot: "2deg", delay: "1.5s" },
]

export function DashboardScene() {
    const mainRef = useRef<HTMLDivElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<(HTMLAnchorElement | null)[]>([])
    const [flyingIndex, setFlyingIndex] = useState<number | null>(null)
    const { phase, message, launch } = useCaseTransition()
    const isTransitioning = phase !== "idle"

    // Same "Assigning clearance" chalk message as the mockup's skill.js —
    // it's the same text regardless of which board was picked.
    const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>, index: number, href: string) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        setFlyingIndex(index)
        launch({ href, element: cardRefs.current[index], message: "Assigning clearance" })
    }

    // warm lamp glow following the cursor across the board
    useEffect(() => {
        const main = mainRef.current
        const glow = glowRef.current
        if (!main || !glow) return

        const onMove = (e: MouseEvent) => {
            const r = main.getBoundingClientRect()
            glow.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`)
            glow.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`)
        }
        main.addEventListener("mousemove", onMove)
        return () => main.removeEventListener("mousemove", onMove)
    }, [])

    return (
        <div
            ref={mainRef}
            className={`${styles.boardMain} ${detectiveFontVariables}`}
        >
            <div className={styles.chalkNoise} aria-hidden="true" />
            <div ref={glowRef} className={styles.lampGlow} aria-hidden="true" />

            {/* chalk-written code drifting on the board, purely atmospheric */}
            <div className={styles.codeBg} aria-hidden="true">
                {CODE_BITS.map((b, i) => (
                    <span
                        key={i}
                        className={styles.codeBit}
                        style={{ top: b.top, left: b.left, "--r": b.rot, animationDelay: b.delay } as CSSProperties}
                    >
                        {b.text}
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
                    {CLEARANCES.map((c, i) => (
                        <Link
                            key={c.key}
                            ref={(el) => { cardRefs.current[i] = el }}
                            href={c.href}
                            onClick={(e) => handleCardClick(e, i, c.href)}
                            className={[
                                styles.card,
                                c.cardClass,
                                flyingIndex === i ? styles.isFlying : "",
                                isTransitioning && flyingIndex !== i ? styles.isFading : "",
                            ].filter(Boolean).join(" ")}
                            style={{ "--i": i } as CSSProperties}
                        >
                            <span className={`${styles.pin} ${styles.pinLeft}`} aria-hidden="true" />
                            <span className={`${styles.pin} ${styles.pinRight}`} aria-hidden="true" />
                            <span className={styles.tab}>{c.tab}</span>

                            <div className={styles.frame}>
                                <div className={styles.polaroid}>
                                    <div className={styles.crop}>
                                        <Image src={c.photo} alt={c.alt} width={3840} height={2160} style={{objectFit: "cover"}} />
                                        <span className={styles.grain} aria-hidden="true" />
                                    </div>
                                    <span className={styles.caption}>{c.caption}</span>
                                </div>
                            </div>

                            <div className={styles.body}>
                                <p className={styles.desc}>{c.desc}</p>
                                <span className={styles.cta}>
                                    <span className={styles.ctaLabel}>Start Mission</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </section>
            </div>

            <Link href="/" className={styles.backBtn} aria-label="Go back">
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                    <path d="M14.5 5 L7.5 12 L14.5 19" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Back
            </Link>

            <CaseTransitionOverlay phase={phase} message={message} />
        </div>
    )
}