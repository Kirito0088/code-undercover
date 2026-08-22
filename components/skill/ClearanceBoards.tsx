"use client"

// Clearance select — a port of the mockup's skill.html / skill.css / skill.js,
// restyled in Tailwind. Three pinned evidence boards on a chalkboard wall; a
// red string runs behind all of them, the pushpins drop in from off-screen and
// the frame takes the hit, and picking a board flies it to centre under the
// blackboard wipe before opening the matching mission board.
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { detectiveFontVariables } from "@/lib/detective-fonts"
import { useCaseTransition } from "@/hooks/useCaseTransition"
import { CaseTransitionOverlay } from "@/components/transition/CaseTransitionOverlay"

type TierKey = "Beginner" | "Intermediate" | "Pro"

interface Tier {
    key: TierKey
    tab: string
    tilt: string
    /** panel + caption colour */
    accent: string
    /** the lighter stop the clearance tab fades from */
    accentBright: string
    photo: string
    caption: string
    alt: string
    desc: string
    /** LevelsClient reads ?path= and only accepts Beginner|Intermediate|Expert */
    href: string
}

const TIERS: Tier[] = [
    {
        key: "Beginner",
        tab: "BEGINNER",
        tilt: "-0.7deg",
        accent: "#7a2e28",
        accentBright: "#a5453a",
        photo: "/characters/dossier/panda.jpeg",
        caption: "AGENT PANDA",
        alt: "Beginner clearance dossier photo — Agent Panda",
        desc: "Learn basic coding concepts and build a strong foundation.",
        href: "/levels?path=Beginner",
    },
    {
        key: "Intermediate",
        tab: "INTERMEDIATE",
        tilt: "0.4deg",
        accent: "#46664a",
        accentBright: "#6d8f6f",
        photo: "/characters/dossier/fox.jpeg",
        caption: "AGENT FOX",
        alt: "Intermediate clearance dossier photo — Agent Fox",
        desc: "Sharpen your debugging and take on more complex challenges.",
        href: "/levels?path=Intermediate",
    },
    {
        key: "Pro",
        tab: "PRO",
        tilt: "-0.4deg",
        accent: "#3d4a6b",
        accentBright: "#6b7a9e",
        photo: "/characters/dossier/platypus.jpeg",
        caption: "AGENT PLATYPUS",
        alt: "Pro clearance dossier photo — Agent Platypus",
        desc: "Solve advanced problems and put your expertise to work.",
        href: "/levels?path=Expert",
    },
]

const CODE_BITS = [
    { text: '<debug mode="on"/>', top: "10%", left: "4%", r: "-5deg", delay: "0s" },
    { text: "if (bug.found) { solve(); }", top: "26%", left: "36%", r: "3deg", delay: "1.2s" },
    { text: "01001000 01001001", top: "8%", left: "72%", r: "-3deg", delay: "1.8s" },
    { text: "for (clue of evidence)", top: "52%", left: "2%", r: "4deg", delay: "2.6s" },
    { text: "console.log('caught you');", top: "86%", left: "64%", r: "-4deg", delay: "0.3s" },
    { text: "return caseClosed;", top: "90%", left: "22%", r: "2deg", delay: "1.5s" },
]

export function ClearanceBoards() {
    const mainRef = useRef<HTMLElement>(null)
    const glowRef = useRef<HTMLDivElement>(null)
    const cardRefs = useRef<Partial<Record<TierKey, HTMLElement | null>>>({})
    const [selected, setSelected] = useState<TierKey | null>(null)

    const { phase, message, launch } = useCaseTransition()
    const isTransitioning = phase !== "idle"

    // Warm lamp glow following the cursor.
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

    const handleStamp = (e: React.MouseEvent<HTMLAnchorElement>, tier: Tier) => {
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        setSelected(tier.key)

        const card = cardRefs.current[tier.key]
        // Drop the resting tilt so the fly starts from a square card.
        if (card) card.style.transform = ""

        launch({ href: tier.href, element: card ?? null, message: "Assigning clearance" })
    }

    return (
        <section
            ref={mainRef}
            className={`${detectiveFontVariables} relative flex min-h-[calc(100dvh-3.5rem)] items-center justify-center overflow-hidden px-8 pb-[clamp(44px,6vh,72px)] pt-[clamp(56px,8vh,90px)] max-[640px]:px-[18px] max-[640px]:pb-14 max-[640px]:pt-11 bg-[radial-gradient(ellipse_900px_500px_at_18%_8%,rgba(232,165,69,0.16),transparent_60%),radial-gradient(ellipse_700px_500px_at_85%_85%,rgba(0,0,0,0.4),transparent_60%),linear-gradient(160deg,#204a3a_0%,#17342a_45%,#0d2118_100%)]`}
        >
            <div className="pointer-events-none absolute inset-0 z-[1] bg-grain opacity-60 mix-blend-overlay" aria-hidden="true" />
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 z-[1] mix-blend-soft-light bg-[radial-gradient(circle_420px_at_var(--mx,20%)_var(--my,20%),rgba(232,165,69,0.18),transparent_68%)]"
                aria-hidden="true"
            />

            <div
                className={`pointer-events-none absolute inset-0 z-[1] overflow-hidden max-[900px]:hidden ${
                    isTransitioning ? "opacity-30 transition-opacity duration-500" : ""
                }`}
                aria-hidden="true"
            >
                {CODE_BITS.map((bit) => (
                    <span
                        key={bit.text}
                        className="absolute whitespace-nowrap font-courier tracking-[0.5px] text-[clamp(0.7rem,1.2vw,0.92rem)] text-chalk/15 animate-codeFloat"
                        style={{ top: bit.top, left: bit.left, ["--r" as string]: bit.r, animationDelay: bit.delay }}
                    >
                        {bit.text}
                    </span>
                ))}
            </div>

            <div className="relative z-[2] mx-auto flex w-full max-w-[1204px] flex-col items-center">
                <header
                    className={`mb-[clamp(26px,4vh,48px)] text-center ${
                        isTransitioning ? "translate-y-3 opacity-0 transition-[opacity,transform] duration-[400ms]" : ""
                    }`}
                >
                    <h1 className="font-chalk text-[clamp(2rem,4.4vw,3.5rem)] font-bold leading-[1.08] text-chalk [text-shadow:0_0_18px_rgba(247,242,231,0.18),0_2px_0_rgba(0,0,0,0.3)]">
                        Start Your <span className="text-brass-bright">Journey!</span>
                    </h1>
                    <span
                        className="mx-auto mb-3 mt-3.5 block h-0.5 w-[clamp(240px,42vw,620px)] bg-[linear-gradient(90deg,transparent,rgba(232,165,69,0.55),transparent)]"
                        aria-hidden="true"
                    />
                </header>

                <div className="relative grid w-full grid-cols-3 items-stretch gap-[clamp(20px,3vw,44px)] max-[900px]:mx-auto max-[900px]:max-w-[420px] max-[900px]:grid-cols-1 max-[900px]:gap-[46px]">
                    {/* the red string running behind all three boards */}
                    <span
                        className="pointer-events-none absolute -left-[3%] -right-[3%] top-[28%] z-0 h-0.5 origin-left -rotate-[0.5deg] animate-stringPull bg-[linear-gradient(90deg,transparent_4%,#7a2e28_14%,#7a2e28_86%,transparent_96%)] opacity-50 max-[900px]:hidden"
                        style={{ animationDelay: ".16s" }}
                        aria-hidden="true"
                    />

                    {TIERS.map((tier, i) => {
                        const isSelected = selected === tier.key
                        const isFlying = isTransitioning && isSelected
                        const dimmed = isTransitioning && !isSelected

                        return (
                            <article
                                key={tier.key}
                                ref={(el) => { cardRefs.current[tier.key] = el }}
                                className={`group relative z-[1] flex h-full flex-col pt-[30px] animate-boardIn transition-transform duration-[280ms] [transform:rotate(var(--tilt))] max-[900px]:[transform:rotate(0deg)] hover:z-[4] hover:[transform:rotate(0deg)_translateY(-10px)] focus-within:z-[4] focus-within:[transform:rotate(0deg)_translateY(-10px)] ${
                                    dimmed ? "opacity-0 transition-opacity duration-[400ms]" : ""
                                } ${isFlying ? "cursor-default" : ""}`}
                                style={{ ["--tilt" as string]: tier.tilt, animationDelay: `${(i * 0.09).toFixed(2)}s` }}
                            >
                                {/* pushpins, dropped in from off-screen */}
                                <span
                                    className="absolute left-[9%] top-[38px] z-[6] size-4 animate-pinDrop rounded-full bg-[radial-gradient(circle_at_34%_28%,#d9736a,#a5453a_55%,#5c1f19_100%)] shadow-[0_4px_6px_rgba(0,0,0,0.55),inset_0_-2px_3px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-[220ms] group-hover:scale-[1.14] group-hover:shadow-[0_0_12px_rgba(217,115,106,0.7),0_4px_6px_rgba(0,0,0,0.55)]"
                                    style={{ animationDelay: `${(0.42 + i * 0.16).toFixed(2)}s` }}
                                    aria-hidden="true"
                                />
                                <span
                                    className="absolute right-[9%] top-[38px] z-[6] size-4 animate-pinDrop rounded-full bg-[radial-gradient(circle_at_34%_28%,#d9736a,#a5453a_55%,#5c1f19_100%)] shadow-[0_4px_6px_rgba(0,0,0,0.55),inset_0_-2px_3px_rgba(0,0,0,0.35)] transition-[transform,box-shadow] duration-[220ms] group-hover:scale-[1.14] group-hover:shadow-[0_0_12px_rgba(217,115,106,0.7),0_4px_6px_rgba(0,0,0,0.55)]"
                                    style={{ animationDelay: `${(0.52 + i * 0.16).toFixed(2)}s` }}
                                    aria-hidden="true"
                                />

                                {/* clearance label pinned over the top edge */}
                                <span
                                    className="absolute left-1/2 top-0 z-[5] -translate-x-1/2 whitespace-nowrap rounded-[3px] border border-chalk/[0.22] px-5 pb-1.5 pt-[7px] font-type text-[clamp(0.7rem,1.05vw,0.88rem)] tracking-[2px] text-chalk transition-shadow duration-[220ms] shadow-[0_5px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.3)] group-hover:shadow-[0_8px_18px_rgba(0,0,0,0.55),0_0_0_2px_rgba(240,207,138,0.35),inset_0_1px_0_rgba(255,255,255,0.35)]"
                                    style={{ background: `linear-gradient(180deg, ${tier.accentBright}, ${tier.accent})` }}
                                >
                                    {tier.tab}
                                    {isSelected && <span className="ml-2 text-brass-bright">✓</span>}
                                </span>

                                {/* the wooden frame the dossier photo is mounted on */}
                                <div
                                    className={`relative animate-frameThud rounded-t-[5px] px-[clamp(14px,1.6vw,22px)] pb-[clamp(14px,1.6vw,22px)] pt-[clamp(16px,1.7vw,24px)] bg-[linear-gradient(180deg,rgba(0,0,0,0.15),rgba(0,0,0,0.35)),repeating-linear-gradient(92deg,#3b2a1c_0px,#3b2a1c_3px,#1c1209_4px,#5a4029_5px,#3b2a1c_7px)] ${
                                        isSelected
                                            ? "shadow-[0_0_0_2px_#f0cf8a,0_20px_34px_rgba(0,0,0,0.55),0_4px_8px_rgba(0,0,0,0.4)]"
                                            : "shadow-[0_20px_34px_rgba(0,0,0,0.55),0_4px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
                                    }`}
                                    style={{ animationDelay: `${(0.78 + i * 0.16).toFixed(2)}s` }}
                                >
                                    {/* the polaroid print */}
                                    <div className="relative -rotate-[0.6deg] rounded-sm px-2.5 pb-[34px] pt-2.5 transition-transform duration-[280ms] group-hover:rotate-0 bg-[linear-gradient(180deg,#f4ecd8,#ecdfc0)] shadow-[0_10px_20px_rgba(0,0,0,0.45),inset_0_2px_0_rgba(255,255,255,0.5)]">
                                        <div
                                            className="relative grid h-[clamp(170px,23vh,250px)] w-full place-items-center rounded-[1px] bg-[#e6dabd] bg-center bg-no-repeat [background-size:auto_74%] shadow-[inset_0_0_0_2px_rgba(59,42,28,0.14),inset_0_2px_10px_rgba(0,0,0,0.10)]"
                                            style={{ backgroundImage: `url("${tier.photo}")` }}
                                            role="img"
                                            aria-label={tier.alt}
                                        >
                                            <span
                                                className="pointer-events-none absolute inset-3.5 rounded-[3px] border-2 border-dashed border-[rgba(59,42,28,0.2)]"
                                                aria-hidden="true"
                                            />
                                        </div>

                                        <div
                                            className="pointer-events-none absolute inset-x-2.5 bottom-[34px] top-2.5 opacity-60 mix-blend-multiply bg-[radial-gradient(ellipse_72%_76%_at_50%_48%,transparent_42%,rgba(59,42,28,0.24)_100%)]"
                                            aria-hidden="true"
                                        />
                                        <div
                                            className="pointer-events-none absolute inset-x-2.5 bottom-[34px] top-2.5 bg-grain opacity-[0.32] mix-blend-overlay"
                                            aria-hidden="true"
                                        />

                                        <span
                                            className="absolute inset-x-2.5 bottom-2 text-center font-type text-[clamp(0.82rem,1.3vw,1.1rem)] tracking-[1.5px]"
                                            style={{ color: tier.accent }}
                                        >
                                            {tier.caption}
                                        </span>
                                    </div>
                                </div>

                                {/* the briefing panel under the frame */}
                                <div
                                    className={`flex flex-1 flex-col items-center gap-4 rounded-b-[5px] border border-t-0 border-black/35 px-[clamp(14px,1.6vw,22px)] pb-[clamp(18px,2.4vh,28px)] pt-[clamp(16px,2vh,24px)] transition-shadow duration-[280ms] ${
                                        isSelected
                                            ? "shadow-[0_0_0_2px_#f0cf8a,0_16px_26px_rgba(0,0,0,0.45)]"
                                            : "shadow-[0_16px_26px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] group-hover:shadow-[0_22px_34px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]"
                                    }`}
                                    style={{ background: `linear-gradient(180deg, rgba(0,0,0,0.46), rgba(0,0,0,0.64)), ${tier.accent}` }}
                                >
                                    <p className="max-w-[34ch] text-center font-courier text-[clamp(0.82rem,1.05vw,0.96rem)] leading-[1.6] text-chalk/90">
                                        {tier.desc}
                                    </p>

                                    <Link
                                        href={tier.href}
                                        onClick={(e) => handleStamp(e, tier)}
                                        aria-label={`Start ${tier.tab} missions`}
                                        className="mt-auto inline-flex -rotate-1 items-center gap-[9px] rounded px-[26px] py-3 font-type text-[0.86rem] tracking-[1px] text-chalkboard-deep transition-[transform,box-shadow] duration-[180ms] bg-[linear-gradient(180deg,#f0cf8a,#c9a24b_60%,#8a6b28)] shadow-[0_5px_0_#8a6b28,0_10px_18px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.5)] hover:rotate-0 hover:-translate-y-[3px] hover:shadow-[0_8px_0_#8a6b28,0_16px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.6)] active:translate-y-0.5 active:scale-[0.97] active:shadow-[0_2px_0_#8a6b28,0_5px_9px_rgba(0,0,0,0.4)]"
                                    >
                                        <span aria-hidden="true">🔍</span>
                                        <span>Start Mission</span>
                                    </Link>
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>

            {/* back to the landing page */}
            <Link
                href="/"
                aria-label="Go back"
                className={`fixed bottom-4 left-4 z-[60] inline-flex items-center gap-1.5 rounded-[3px_3px_8px_8px] px-[11px] pb-[5px] pt-1.5 font-type text-[0.66rem] tracking-[1px] text-walnut-deep transition-[transform,box-shadow,background] duration-150 bg-[linear-gradient(180deg,#e0cf9f,#c9b47f_70%,#b89f6c)] shadow-[0_3px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 hover:bg-[linear-gradient(180deg,#f0cf8a,#c9a24b)] hover:shadow-[0_5px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.5)] active:translate-y-px active:shadow-[0_2px_0_rgba(0,0,0,0.4)] ${
                    isTransitioning ? "opacity-0 transition-opacity duration-[400ms]" : ""
                }`}
            >
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true" className="shrink-0">
                    <path
                        d="M14.5 5 L7.5 12 L14.5 19"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
                Back
            </Link>

            <CaseTransitionOverlay phase={phase} message={message} />
        </section>
    )
}
