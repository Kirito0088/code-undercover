import type { Metadata } from "next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ClearanceScene } from "@/components/skill/ClearanceScene"
import { getClearanceProgress } from "@/lib/clearance"

export const metadata: Metadata = {
    title: "Choose Your Clearance | Code Undercover",
    description: "Pick a clearance level — Beginner, Intermediate or Pro — and start your first mission.",
}

// Public on purpose: visitors pick a clearance before signing in. The board
// links through to /levels, which is the page that enforces the session.
// A visitor has cleared nothing, so they see the same padlocks a brand-new
// agent does — Fox and Platypus sealed behind Panda's twenty cases.
export default async function SkillPage() {
    const session = await getServerSession(authOptions)
    const progress = await getClearanceProgress(session?.user?.id)

    return <ClearanceScene progress={progress} />
}
