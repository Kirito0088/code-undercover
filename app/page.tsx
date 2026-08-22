import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DetectiveHero } from "@/components/landing/DetectiveHero"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect("/dashboard")
  }

  // index.html is the navbar plus a single <main class="hero">. The navbar is
  // shared chrome from the root layout, so the landing page is just the hero —
  // it carries its own vignette, grain, lamp glow and background gradient.
  return <DetectiveHero />
}
