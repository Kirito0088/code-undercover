import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return (
    <div className="relative isolate overflow-hidden flex-1 flex flex-col justify-center w-full min-h-[calc(100vh-80px)] xl:min-h-0 py-8 lg:py-0">
      {/* Background Gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#16a34a] to-[#047857] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:flex lg:items-center lg:px-8 w-full gap-12">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl">
          <div>
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold leading-6 text-green-400 ring-1 ring-inset ring-green-500/20">
              Agent initialization sequence complete
            </span>
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Welcome to <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Code-Undercover</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Code Undercover is a mission-based learning platform where you solve real engineering challenges, build production-ready code, and level up your problem-solving skills in an immersive gamified environment.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="text-base bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  Start your Mission
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="text-base">
                    Join the Agency
                  </Button>
                </Link>
                <Link href="/login" className="text-sm font-semibold leading-6 text-white hover:text-green-400 transition-colors">
                  Access Terminal <span aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Decorative UI elements */}
        <div className="mx-auto mt-12 flex max-w-2xl sm:mt-16 lg:mt-0 lg:max-w-none lg:flex-1 items-center justify-center w-full">
          <div className="relative flex items-center justify-center w-full max-w-[500px] xl:max-w-[600px]">
            {/* Green glow behind logo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-green-500/30 blur-[100px] rounded-full z-0 pointer-events-none"></div>

            <img
              src="/mascot-logo.png"
              alt="Code Undercover Mascot Logo"
              className="relative z-10 w-full h-auto drop-shadow-[0_0_30px_rgba(74,222,128,0.3)] hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
