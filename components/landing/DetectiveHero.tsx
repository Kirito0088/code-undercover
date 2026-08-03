"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Big_Shoulders, Karla, Courier_Prime } from "next/font/google"
import styles from "./DetectiveHero.module.css"

const bigShoulders = Big_Shoulders({
    subsets: ["latin"],
    weight: ["500", "700", "800"],
    variable: "--font-display",
})
const karla = Karla({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-karla",
})
const courierPrime = Courier_Prime({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-courier",
})

const EYEBROW_TEXT = "CLASSIFIED // BRIEFING 001"
const ZOOM = 2.4

export function DetectiveHero() {
    const [eyebrowText, setEyebrowText] = useState("")
    const frameRef = useRef<HTMLDivElement>(null)
    const badgeRef = useRef<HTMLImageElement>(null)
    const magnifierRef = useRef<HTMLDivElement>(null)
    const zoomLayerRef = useRef<HTMLSpanElement>(null)

    // Eyebrow types itself out, matching the original mockup's timing.
    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        if (reduceMotion) {
            setEyebrowText(EYEBROW_TEXT)
            return
        }
        let i = 0
        const id = setInterval(() => {
            i++
            setEyebrowText(EYEBROW_TEXT.slice(0, i))
            if (i >= EYEBROW_TEXT.length) clearInterval(id)
        }, 45)
        return () => clearInterval(id)
    }, [])

    // Magnifying-glass hover effect over the case-file badge photo.
    // Uses refs + direct style writes (not React state) so pointermove
    // doesn't trigger a re-render on every frame.
    useEffect(() => {
        const frame = frameRef.current
        const badge = badgeRef.current
        const magnifier = magnifierRef.current
        const zoomLayer = zoomLayerRef.current
        if (!frame || !badge || !magnifier || !zoomLayer) return
        if (!window.matchMedia("(hover: hover)").matches) return

        const setLensBackground = () => {
            zoomLayer.style.backgroundImage = `url("${badge.src}")`
            zoomLayer.style.backgroundSize = `${badge.clientWidth * ZOOM}px ${badge.clientHeight * ZOOM}px`
        }

        if (badge.complete) setLensBackground()
        badge.addEventListener("load", setLensBackground)
        window.addEventListener("resize", setLensBackground)

        const handleMove = (e: PointerEvent) => {
            const rect = badge.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top

            if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
                magnifier.classList.remove(styles.magnifierActive)
                return
            }

            const lensSize = magnifier.clientWidth
            magnifier.style.left = `${x}px`
            magnifier.style.top = `${y}px`
            zoomLayer.style.backgroundPosition = `${-(x * ZOOM - lensSize / 2)}px ${-(y * ZOOM - lensSize / 2)}px`
            magnifier.classList.add(styles.magnifierActive)
        }
        const handleLeave = () => magnifier.classList.remove(styles.magnifierActive)

        frame.addEventListener("pointermove", handleMove)
        frame.addEventListener("pointerleave", handleLeave)

        return () => {
            badge.removeEventListener("load", setLensBackground)
            window.removeEventListener("resize", setLensBackground)
            frame.removeEventListener("pointermove", handleMove)
            frame.removeEventListener("pointerleave", handleLeave)
        }
    }, [])

    return (
        <section
            className={`${styles.section} ${bigShoulders.variable} ${karla.variable} ${courierPrime.variable}`}
        >
            {/* Chalk ruling + code-mark glyphs, contained to this section */}
            <div className={styles.codeBg} aria-hidden="true">
                <div className={styles.codeBgChecks}></div>
                <div className={styles.codeBgTokens}>
                    <span className={`${styles.glyph} ${styles.g1}`}>{"{ }"}</span>
                    <span className={`${styles.glyph} ${styles.g2}`}>{"</>"}</span>
                    <span className={`${styles.glyph} ${styles.g3}`}>{"( ) =>"}</span>
                    <span className={`${styles.glyph} ${styles.g4}`}>{";"}</span>
                    <span className={`${styles.glyph} ${styles.g5}`}>{"0 1 0 1"}</span>
                    <span className={`${styles.glyph} ${styles.g6}`}>{"<- return"}</span>
                </div>
            </div>

            <div className={styles.heroInner}>
                {/* Left: copy */}
                <div>
                    <p className={styles.eyebrow}>{eyebrowText}</p>

                    <h1 className={styles.headline}>
                        <span className={styles.headlineSmall}>Welcome to</span>
                        <span className={styles.headlineBig}>
                            <em>Code-</em>Undercover
                        </span>
                    </h1>

                    <p className={styles.lede}>
                        Code Undercover is a mission-based learning platform where you solve real
                        engineering challenges, build production-ready code, and level up your
                        problem-solving skills in an immersive gamified environment.
                    </p>

                    <div className={styles.ctaRow}>
                        <Link href="/register" className={styles.btnPrimary}>
                            <span>Start Your Mission</span>
                            <span aria-hidden="true">&rarr;</span>
                        </Link>
                        <Link href="/register" className={styles.btnSecondary}>
                            Read the Brief
                        </Link>
                    </div>
                </div>

                {/* Right: case-file badge photo */}
                <figure className={styles.dossier}>
                    <span className={`${styles.tape} ${styles.tapeLeft}`} aria-hidden="true"></span>
                    <span className={`${styles.tape} ${styles.tapeRight}`} aria-hidden="true"></span>
                    <span className={styles.stamp} aria-hidden="true">Classified</span>

                    <div className={styles.dossierFrame} ref={frameRef}>
                        <Image
                            ref={badgeRef}
                            src="/mascot-logo.png"
                            alt="Code Undercover badge with three detective agents: a platypus, a fox, and a panda holding magnifying glasses."
                            width={440}
                            height={293}
                            sizes="(max-width: 1000px) 90vw, 440px"
                            priority
                        />

                        <div className={styles.magnifier} ref={magnifierRef} aria-hidden="true">
                            <span className={styles.magnifierLens}>
                                <span className={styles.magnifierZoom} ref={zoomLayerRef}></span>
                            </span>
                            <span className={styles.magnifierHandle}></span>
                        </div>
                    </div>

                    <figcaption className={styles.caption}>
                        Fig. 01 — Field agents: Platypus · Fox · Panda
                    </figcaption>
                </figure>
            </div>
        </section>
    )
}
