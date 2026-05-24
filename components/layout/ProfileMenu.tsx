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
        className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-[#111118] border border-[#22222E] hover:border-[#2E2E3F] transition-all group"
      >
        <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 overflow-hidden relative">
          <Shield className="h-4 w-4 text-indigo-400" />
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-[#F1F1F5] leading-none">{user.name || "Agent"}</div>
          <div className="text-xs text-[#8B8BA7] mt-0.5">Aura Lvl {user.auraLevel}</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-xl bg-[#111118] border border-[#22222E] shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header ID Card Style */}
          <div className="relative p-5 bg-gradient-to-b from-indigo-900/20 to-[#111118] border-b border-[#22222E]">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 rounded-lg bg-[#0A0A0F] border border-indigo-500/20 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-indigo-500/10 pattern-grid opacity-50"></div>
                <Shield className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[#5C5C7A] mb-1">Profile</div>
                <div className="text-lg font-bold text-[#F1F1F5] truncate leading-tight flex items-center gap-2">
                  {user.name || "Agent"}
                  <Award className={`h-4 w-4 shrink-0 ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).colorText} ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).shadow}`} />
                </div>
                <div className="text-xs text-[#8B8BA7] truncate flex items-center gap-2">
                  <span className={`font-semibold uppercase tracking-wider ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).colorText}`}>
                    {calculateAgentRank(user.auraPoints)}
                  </span>
                  <span>•</span>
                  <span>Lvl {user.auraLevel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="p-4 grid grid-cols-2 gap-3 bg-[#0A0A0F]/50">
            <div className="bg-[#0A0A0F] rounded-lg p-3 border border-[#22222E]">
              <div className="text-xs text-[#5C5C7A] mb-1 flex items-center gap-1">
                <Terminal className="h-3 w-3" /> Aura Level
              </div>
              <div className="text-xl font-semibold text-[#F1F1F5]">{user.auraLevel}</div>
            </div>
            <div className="bg-[#0A0A0F] rounded-lg p-3 border border-[#22222E]">
              <div className="text-xs text-indigo-400 mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Aura Points
              </div>
              <div className="text-xl font-semibold text-indigo-400">{user.auraPoints}</div>
            </div>
            <div className="bg-[#0A0A0F] rounded-lg p-3 border border-[#22222E] col-span-2 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#5C5C7A] mb-0.5">Missions Completed</div>
                <div className="text-lg font-semibold text-[#F1F1F5]">{completedMissions}</div>
              </div>

              {/* Fox Badges Section */}
              <div className="h-10 w-10 relative group/badge">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-md opacity-0 group-hover/badge:opacity-100 transition-opacity"></div>
                <Image src="/characters/fox.png" alt="Innovation" fill className="object-contain" />
                <div className="absolute -bottom-1 -right-1 bg-black text-amber-500 text-[10px] font-bold px-1 border border-amber-500/20 rounded z-10">
                  x0
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-[#22222E] bg-[#0A0A0F]">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-4 w-4" /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
