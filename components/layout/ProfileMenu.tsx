"use client"

import { useState, useRef, useEffect } from "react"
import { LogOut, Terminal, Sparkles, Award, Shield } from "lucide-react"
import Image from "next/image"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import { signOut } from "next-auth/react"

interface ProfileMenuProps {
  user: {
    name: string | null
    email: string | null
    auraPoints: number
    auraLevel: number
  }
  completedMissions: number
}

export function ProfileMenu({ user, completedMissions }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800 hover:border-green-500/50 transition-all group"
      >
        <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 overflow-hidden relative">
          <Shield className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-bold text-white leading-none">{user.name || "Agent"}</div>
          <div className="text-xs text-gray-400 font-mono mt-0.5">Aura Lvl {user.auraLevel}</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-xl bg-gray-950 border border-gray-800 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header ID Card Style */}
          <div className="relative p-5 bg-gradient-to-b from-green-900/40 to-gray-950 border-b border-gray-800">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600"></div>
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 rounded-lg bg-black border border-green-500/30 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-green-500/10 pattern-grid opacity-50"></div>
                <Shield className="h-8 w-8 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-mono text-green-500 mb-1">AGENCY ID CARD</div>
                <div className="text-lg font-bold text-white truncate leading-tight flex items-center gap-2">
                  {user.name || "Agent"}
                  <Award className={`h-4 w-4 shrink-0 ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).colorText} ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).shadow}`} />
                </div>
                <div className="text-xs text-gray-400 truncate font-mono flex items-center gap-2">
                  <span className={`font-bold uppercase tracking-wider ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).colorText} ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).shadow}`}>
                    {calculateAgentRank(user.auraPoints)}
                  </span>
                  <span>•</span>
                  <span>Aura Lvl {user.auraLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3 bg-gray-900/50">
            <div className="bg-black/50 rounded-lg p-3 border border-gray-800/80">
              <div className="text-xs text-gray-500 mb-1 font-mono flex items-center gap-1">
                <Terminal className="h-3 w-3" /> AURA LEVEL
              </div>
              <div className="text-xl font-bold text-white">{user.auraLevel}</div>
            </div>
            <div className="bg-black/50 rounded-lg p-3 border border-gray-800/80">
              <div className="text-xs text-blue-500/70 mb-1 font-mono flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> AURA POINTS
              </div>
              <div className="text-xl font-bold text-blue-400">{user.auraPoints}</div>
            </div>
            <div className="bg-black/50 rounded-lg p-3 border border-gray-800/80 col-span-2 flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500 mb-0.5 font-mono">MISSIONS CLEARED</div>
                <div className="text-lg font-bold text-white">{completedMissions}</div>
              </div>

              {/* Fox Badges Section */}
              <div className="h-10 w-10 relative group/badge">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-md opacity-0 group-hover/badge:opacity-100 transition-opacity"></div>
                <Image src="/characters/fox.png" alt="Innovation" fill className="object-contain drop-shadow-[0_0_5px_rgba(234,179,8,0.3)]" />
                <div className="absolute -bottom-1 -right-1 bg-black text-yellow-500 text-[10px] font-bold font-mono px-1 border border-yellow-500/30 rounded z-10">
                  x0
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-gray-800 bg-gray-950">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-mono text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" /> DISCONNECT
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
