"use client"

import { useEffect, useLayoutEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { detectiveFontVariables } from "@/lib/detective-fonts"
import { useCaseTransition } from "@/hooks/useCaseTransition"
import { CaseTransitionOverlay } from "@/components/transition/CaseTransitionOverlay"
import styles from "./DetectiveHero.module.css"

const ZOOM = 2.2 // magnification factor
const MAX_TILT = 6 // degrees

// The hero only ever renders for signed-out visitors — app/page.tsx sends a
// logged-in user to /dashboard, which is the clearance board itself. So the
// CTA is the sign-in gate: authenticate, then land straight on the mission
// board rather than being dropped back here.
const CTA_HREF = "/login?callbackUrl=%2Flevels"

// index.html: the floating chalk-written code inside .code-bg
const CODE_BITS = [
    { text: '<debug mode="on"/>', top: "12%", left: "6%", r: "-6deg", delay: "0s" },
    { text: "if (bug.found) { solve(); }", top: "22%", left: "38%", r: "4deg", delay: "1.2s" },
    { text: "for (clue of evidence)", top: "68%", left: "4%", r: "-3deg", delay: "2.1s" },
    { text: "return caseClosed;", top: "80%", left: "32%", r: "5deg", delay: "0.6s" },
    { text: "01001000 01001001", top: "6%", left: "70%", r: "-4deg", delay: "1.8s" },
    { text: 'git commit -m "gotcha"', top: "46%", left: "2%", r: "3deg", delay: "2.6s" },
    { text: "console.log('caught you');", top: "88%", left: "66%", r: "-5deg", delay: "0.3s" },
    { text: "try { trust(); } catch(e) {}", top: "34%", left: "80%", r: "2deg", delay: "1.5s" },
]

export function DetectiveHero() {
    const heroRef = useRef<HTMLElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)
    const boardWrapRef = useRef<HTMLElement>(null)
    const corkboardRef = useRef<HTMLDivElement>(null)
    const photoRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const lensRef = useRef<HTMLDivElement>(null)
    const glassRef = useRef<HTMLDivElement>(null)
    const ctaRef = useRef<HTMLAnchorElement>(null)

    const { phase, message, launch } = useCaseTransition()
    const isTransitioning = phase !== "idle"

    // script.js holds this in a module-level `inTransition` flag so the tilt
    // handler stops fighting the fly-to-centre transform.
    const transitioningRef = useRef(false)
    useLayoutEffect(() => {
        transitioningRef.current = isTransitioning
    }, [isTransitioning])

    // ─── Magnifying glass that tracks the cursor over the photo ───
    useEffect(() => {
        const wrap = photoRef.current
        const img = imgRef.current
        const lens = lensRef.current
        const glass = glassRef.current
        if (!wrap || !img || !lens || !glass) return

        const setLensBackground = () => {
            glass.style.backgroundImage = `url("${img.currentSrc || img.src}")`
            glass.style.backgroundSize = `${wrap.clientWidth * ZOOM}px ${wrap.clientHeight * ZOOM}px`
        }

        const moveLens = (clientX: number, clientY: number) => {
            const rect = wrap.getBoundingClientRect()
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
            const y = Math.max(0, Math.min(clientY - rect.top, rect.height))
            const lensSize = lens.offsetWidth

            lens.style.transform = `translate(${x - lensSize / 2}px, ${y - lensSize / 2}px)`
            glass.style.backgroundPosition = `${-(x * ZOOM - lensSize / 2)}px ${-(y * ZOOM - lensSize / 2)}px`
        }

        const activate = () => {
            setLensBackground()
            lens.classList.add(styles.lensIsActive)
        }
        const deactivate = () => lens.classList.remove(styles.lensIsActive)

        const onMove = (e: MouseEvent) => moveLens(e.clientX, e.clientY)
        const onTouchStart = (e: TouchEvent) => {
            activate()
            moveLens(e.touches[0].clientX, e.touches[0].clientY)
        }
        const onTouchMove = (e: TouchEvent) => moveLens(e.touches[0].clientX, e.touches[0].clientY)
        const onResize = () => {
            if (lens.classList.contains(styles.lensIsActive)) setLensBackground()
        }

        wrap.addEventListener("mouseenter", activate)
        wrap.addEventListener("mouseleave", deactivate)
        wrap.addEventListener("mousemove", onMove)
        wrap.addEventListener("touchstart", onTouchStart, { passive: true })
        wrap.addEventListener("touchmove", onTouchMove, { passive: true })
        wrap.addEventListener("touchend", deactivate)
        window.addEventListener("resize", onResize)

        return () => {
            wrap.removeEventListener("mouseenter", activate)
            wrap.removeEventListener("mouseleave", deactivate)
            wrap.removeEventListener("mousemove", onMove)
            wrap.removeEventListener("touchstart", onTouchStart)
            wrap.removeEventListener("touchmove", onTouchMove)
            wrap.removeEventListener("touchend", deactivate)
            window.removeEventListener("resize", onResize)
        }
    }, [])

    // ─── Warm lamp glow following the cursor ───
    useEffect(() => {
        const hero = heroRef.current
        const glow = glowRef.current
        if (!hero || !glow) return

        const onMove = (e: MouseEvent) => {
            const rect = hero.getBoundingClientRect()
            glow.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`)
            glow.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`)
        }

        hero.addEventListener("mousemove", onMove)
        return () => hero.removeEventListener("mousemove", onMove)
    }, [])

    // ─── Subtle 3D tilt on the corkboard ───
    useEffect(() => {
        const board = corkboardRef.current
        if (!board) return

        const onMove = (e: MouseEvent) => {
            if (transitioningRef.current) return
            const rect = board.getBoundingClientRect()
            const px = (e.clientX - rect.left) / rect.width - 0.5
            const py = (e.clientY - rect.top) / rect.height - 0.5
            board.style.transform = `perspective(900px) rotateX(${-py * MAX_TILT * 2}deg) rotateY(${px * MAX_TILT * 2}deg)`
        }
        const onLeave = () => {
            if (transitioningRef.current) return
            board.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)"
        }

        board.addEventListener("mousemove", onMove)
        board.addEventListener("mouseleave", onLeave)
        return () => {
            board.removeEventListener("mousemove", onMove)
            board.removeEventListener("mouseleave", onLeave)
        }
    }, [])

    // ─── "Start Your Mission": stamp thud, then fly the board to centre ───
    const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()

        const cta = ctaRef.current
        if (cta) {
            cta.classList.add(styles.stampHit)
            window.setTimeout(() => cta.classList.remove(styles.stampHit), 160)
        }

        // The perspective on the wrapper would trap the fixed corkboard, and the
        // hover tilt would fight the fly-to-centre transform — drop both first.
        if (boardWrapRef.current) boardWrapRef.current.style.perspective = "none"
        if (corkboardRef.current) corkboardRef.current.style.transform = ""

        launch({ href: CTA_HREF, element: corkboardRef.current, message: "Verifying credentials" })
    }

    return (
        <section ref={heroRef} className={`${styles.heroSection} ${detectiveFontVariables}`}>
            {/* ambient page vignette, purely atmospheric */}
            <div className={styles.pageVignette} aria-hidden="true" />

            <div className={styles.heroChalkTexture} aria-hidden="true" />
            <div ref={glowRef} className={styles.lampGlow} aria-hidden="true" />

            {/* floating chalk-written code, purely decorative */}
            <div
                className={`${styles.codeBg} ${isTransitioning ? styles.isFading : ""}`}
                aria-hidden="true"
            >
                {CODE_BITS.map((bit) => (
                    <span
                        key={bit.text}
                        className={styles.codeBit}
                        style={{
                            top: bit.top,
                            left: bit.left,
                            ["--r" as string]: bit.r,
                            animationDelay: bit.delay,
                        }}
                    >
                        {bit.text}
                    </span>
                ))}
            </div>

            <div className={styles.heroInner}>
                {/* LEFT: copy */}
                <div className={`${styles.heroCopy} ${isTransitioning ? styles.isFading : ""}`}>
                    <p className={styles.caseTag}>
                        JOIN NOW
                        <span className={styles.blinkCursor}>|</span>
                    </p>

                    <h1 className={styles.heroTitle}>
                        Welcome to
                        <br />
                        <span className={styles.heroTitleAccent}>
                            <span className={styles.chalkHighlight} aria-hidden="true" />
                            Code&#8209;Undercover
                        </span>
                    </h1>

                    <p className={styles.heroParagraph}>
                        Code Undercover is a mission-based learning platform where you solve real
                        engineering challenges, build production-ready code, and level up your problem solving.
                    </p>

                    <Link ref={ctaRef} href={CTA_HREF} onClick={handleCtaClick} className={styles.ctaStamp}>
                        <span>Start Your Mission</span>
                    </Link>
                </div>

                {/* RIGHT: investigation board with mascot photo + magnifier */}
                <section ref={boardWrapRef} className={styles.heroBoard} aria-label="Case evidence board">
                    <div ref={corkboardRef} className={styles.corkboard}>
                        <div className={styles.corkboardGrain} aria-hidden="true" />
                        <div className={styles.corkboardPin} aria-hidden="true" />

                        <div ref={photoRef} className={styles.evidencePhoto}>
                            <Image
                                ref={imgRef}
                                src="/characters/dossier/detectives.jpeg"
                                alt="Three detective mascots — a platypus, a fox, and a panda — holding magnifying glasses, the Code Undercover agents"
                                width={880}
                                height={880}
                                sizes="(max-width: 980px) 90vw, 460px"
                                priority
                                draggable={false}
                                className={styles.evidencePhotoImg}
                            />

                            <div className={styles.evidencePhotoTint} aria-hidden="true" />
                            <div className={styles.evidencePhotoGrain} aria-hidden="true" />

                            {/* lens that tracks the cursor: ring + glass + handle,
                                true magnifying-glass geometry */}
                            <div ref={lensRef} className={styles.lens} aria-hidden="true">
                                <div ref={glassRef} className={styles.lensGlass} />
                            </div>

                            <span className={styles.evidencePhotoLabel}>EXHIBIT A — FIELD AGENTS</span>
                        </div>

                        <div className={`${styles.thread} ${styles.threadOne}`} aria-hidden="true" />
                        <div className={`${styles.thread} ${styles.threadTwo}`} aria-hidden="true" />

                        <div className={styles.stickyNote}>
                            <p>
                                Hover to inspect the clues,
                                <br />
                                Agent.
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <CaseTransitionOverlay phase={phase} message={message} />
        </section>
    )
}
