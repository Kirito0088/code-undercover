import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { BookOpen, Play, Zap } from "lucide-react"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="relative isolate overflow-hidden flex-1 flex flex-col justify-center w-full min-h-[calc(100vh-56px)] bg-[#0A0A0F]">
      
      {/* ─── Hero Section ─── */}
      {/* Desktop layout (side-by-side) */}
      <div className="hidden lg:flex mx-auto max-w-7xl px-8 items-center w-full gap-16 min-h-[calc(100vh-56px-150px)] pt-12">
        {/* Left: copy */}
        <div className="flex-1 max-w-xl">
          {/* Eyebrow */}
          <span className="inline-flex items-center gap-2 bg-[#1C1C28] border border-[#22222E] text-[#8B8BA7] text-xs px-3 py-1 rounded-full mb-8">
            Free · Open Beta
          </span>

          {/* H1 */}
          <h1 className="text-5xl font-semibold text-[#F1F1F5] tracking-tight leading-[1.1]">
            Learn C programming<br />
            by building real programs.
          </h1>

          {/* Sub */}
          <p className="mt-5 text-lg text-[#8B8BA7] leading-relaxed max-w-md">
            Mission-based C curriculum with live code execution, instant feedback, and a structured path from beginner to systems programmer.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white">
                  Continue Learning
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white">
                    Start Learning — Free
                  </Button>
                </Link>
                <Link href="/login" className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors">
                  Sign in →
                </Link>
              </>
            )}
          </div>

          {/* Social proof */}
          <p className="mt-8 text-xs text-[#5C5C7A]">
            Used by learners at IIT, BITS, NIT and 50+ colleges
          </p>
        </div>

        {/* Right: mascot */}
        <div className="flex-1 flex items-center justify-center">
          <img
            src="/mascot-logo.png"
            alt="Code Undercover"
            className="w-full max-w-[460px] h-auto opacity-90 transition-transform duration-700 hover:scale-105"
          />
        </div>
      </div>

      {/* Mobile / Tablet layout (stacked) */}
      <div className="flex flex-col items-center text-center px-6 sm:px-8 py-16 lg:hidden w-full max-w-2xl mx-auto">
        {/* Eyebrow */}
        <span className="inline-flex items-center gap-2 bg-[#1C1C28] border border-[#22222E] text-[#8B8BA7] text-xs px-3 py-1 rounded-full mb-6">
          Free · Open Beta
        </span>

        {/* H1 */}
        <h1 className="text-3xl sm:text-4xl font-semibold text-[#F1F1F5] tracking-tight leading-[1.2]">
          Learn C programming<br />
          by building real programs.
        </h1>

        {/* Mascot for mobile */}
        <div className="relative mt-8 flex items-center justify-center w-full max-w-[250px] sm:max-w-[300px]">
          <img
            src="/mascot-logo.png"
            alt="Code Undercover"
            className="w-full h-auto opacity-95"
          />
        </div>

        {/* Sub */}
        <p className="mt-6 text-sm sm:text-base text-[#8B8BA7] leading-relaxed max-w-md">
          Mission-based C curriculum with live code execution, instant feedback, and a structured path from beginner to systems programmer.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-xs">
          {session ? (
            <Link href="/dashboard" className="w-full">
              <Button size="lg" className="w-full text-sm bg-indigo-600 hover:bg-indigo-500 text-white">
                Continue Learning
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/register" className="w-full">
                <Button size="lg" className="w-full text-sm bg-indigo-600 hover:bg-indigo-500 text-white">
                  Start Learning — Free
                </Button>
              </Link>
              <Link href="/login" className="text-sm text-[#8B8BA7] hover:text-[#F1F1F5] transition-colors py-2">
                Sign in →
              </Link>
            </>
          )}
        </div>

        {/* Social proof */}
        <p className="mt-6 text-xs text-[#5C5C7A]">
          Used by learners at IIT, BITS, NIT and 50+ colleges
        </p>
      </div>

      {/* ─── Feature Grid ─── */}
      <div className="max-w-7xl mx-auto px-8 pb-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-0 lg:-mt-4">
          {[
            { icon: BookOpen, title: "Structured Curriculum", desc: "Sequential missions with prerequisites. Each level unlocks the next." },
            { icon: Play,     title: "Run Real Code",          desc: "Live C compiler in the browser. See actual program output instantly." },
            { icon: Zap,      title: "Earn as You Learn",      desc: "Aura Points, rank progression, combo streaks, and daily challenges." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#111118] border border-[#22222E] rounded-xl p-6 text-left transition-colors hover:border-[#2E2E3F] hover:bg-[#14141C]">
              <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-4 h-4 text-indigo-400" />
              </div>
              <h3 className="text-sm font-medium text-[#F1F1F5]">{title}</h3>
              <p className="text-xs text-[#8B8BA7] mt-1.5 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
