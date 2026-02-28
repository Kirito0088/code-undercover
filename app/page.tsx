import { Button } from "@/components/ui/Button"
import { Terminal, Shield, Cpu } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="relative isolate overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#16a34a] to-[#047857] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-semibold leading-6 text-green-400 ring-1 ring-inset ring-green-500/20">
              Agent initialization sequence complete
            </span>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-white sm:text-6xl">
            Accept your next <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">Coding Mission</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Welcome to Code Undercover. Solve real-world architectural problems, write production-ready C code, and level up your engineering skills in a secure, gamified environment.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <Link href="/register">
              <Button size="lg" className="text-base">
                Join the Agency
              </Button>
            </Link>
            <Link href="/login" className="text-sm font-semibold leading-6 text-white hover:text-green-400 transition-colors">
              Access Terminal <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Decorative UI elements */}
        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mt-0 lg:mr-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="rounded-xl bg-gray-900/50 p-2 ring-1 ring-white/10 lg:rounded-2xl backdrop-blur-sm relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 opacity-20 blur group-hover:opacity-30 transition duration-1000"></div>
              <div className="relative rounded-lg bg-gray-950 px-6 py-8 ring-1 ring-white/10 flex flex-col items-start gap-4 shadow-2xl">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-gray-500 text-xs font-mono ml-2">secure-shell — root@code-undercover:~</span>
                </div>
                <div className="text-sm font-mono text-green-400">
                  <p className="mb-2">$ ./connect --target &quot;agency-mainframe&quot;</p>
                  <p className="text-gray-400 mb-2">Establishing secure connection...</p>
                  <p className="text-gray-400 mb-2">Decrypting payloads...</p>
                  <p className="text-white mb-4">ACCESS GRANTED. Welcome, Agent.</p>
                  <p className="mb-1 text-blue-400">Available Missions:</p>
                  <ul className="text-gray-300 mt-2 list-none space-y-2">
                    <li className="flex items-center gap-2"><Terminal className="h-4 w-4 text-gray-500" /> [EASY] The Pointer Breach</li>
                    <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-gray-500" /> [MED] Memory Leak Protocol</li>
                    <li className="flex items-center gap-2"><Cpu className="h-4 w-4 text-gray-500" /> [HARD] Kernel Exploit Neutralization</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
