"use client"

import dynamic from "next/dynamic"
import type { DailyChallengeQuestion } from "./DailyChallengeModal"

// Code-split from the dashboard's initial JS bundle: this modal (framer-motion
// + confetti-on-success logic) is closed on most page loads — its own
// useEffect decides whether to auto-open it — so its JS is only needed once
// that decision is made, not as part of the dashboard's initial render.
const DailyChallengeModalImpl = dynamic(
    () => import("./DailyChallengeModal").then((mod) => mod.DailyChallengeModal),
    { ssr: false }
)

export function DailyChallengeModal(props: { initialQuestion: DailyChallengeQuestion | null }) {
    return <DailyChallengeModalImpl {...props} />
}
