import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DetectiveHero } from "@/components/landing/DetectiveHero"

const CLEARANCE_LADDER = [
    "Recruit",
    "Junior Agent",
    "Field Agent",
    "Detective",
    "Senior Investigator",
    "Elite Spy",
    "Master Agent",
]

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="relative isolate flex-1 flex flex-col w-full min-h-[calc(100vh-56px)] bg-bg text-text overflow-hidden">
      {/* Scanline grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(183,135,66,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(183,135,66,0.04)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(183,135,66,0.03),transparent_60%)] pointer-events-none"></div>

      {/* ─── Hero Section ─── */}
      <DetectiveHero />

      {/* ─── Clearance Ladder ─── */}
      <div className="hidden lg:block max-w-7xl mx-auto px-8 w-full relative pb-12">
        <div className="bg-surface border border-border rounded-xl px-8 py-6 flex items-center gap-10">
          <span className="text-[11px] font-mono font-bold tracking-widest text-muted uppercase shrink-0">
            Clearance Ladder
          </span>

          <div className="flex-1 flex items-center">
            {CLEARANCE_LADDER.map((stage, i) => (
              <div key={stage} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <span
                    className={
                      i === 0
                        ? "size-3 rounded-full bg-accent ring-4 ring-accent/20"
                        : "size-2.5 rounded-full border-2 border-border"
                    }
                  />
                  <span className={`text-[10px] font-mono tracking-wider whitespace-nowrap ${i === 0 ? "text-accent font-bold" : "text-muted"}`}>
                    {stage.toUpperCase()}
                  </span>
                </div>
                {i < CLEARANCE_LADDER.length - 1 && (
                  <span className="flex-1 h-px border-t border-dashed border-border mx-2 -translate-y-3"></span>
                )}
              </div>
            ))}
          </div>

          <div className="shrink-0 w-40">
            <div className="h-1.5 rounded-full bg-bg overflow-hidden">
              <div className="h-full w-[12%] bg-accent rounded-full"></div>
            </div>
            <p className="mt-1.5 text-[10px] font-mono text-muted whitespace-nowrap">120 / 1000 XP to Junior Agent</p>
          </div>
        </div>
      </div>

    </div>
  )
}
