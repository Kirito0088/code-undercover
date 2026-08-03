"use client"

import { useState, useRef, useEffect } from "react"
import { LogOut, Terminal, Sparkles, Award, Shield } from "lucide-react"
import Image from "next/image"
import { calculateAgentRank, getRankBadgeStyles } from "@/lib/aura"
import { signOut } from "next-auth/react"
import Link from "next/link"

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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#0D0E12] border border-[#1F261F] hover:border-[#2A3A2A] transition-all group"
      >
        <Link
          href="/profile"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
          }}
          className="size-8 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30 overflow-hidden relative hover:bg-emerald-500/20 hover:scale-105 transition-all"
          title="View Settings"
        >
          <Shield className="size-4 text-emerald-400" />
        </Link>
        <div className="text-left hidden sm:block">
          <div className="text-sm font-medium text-[#E2E8F0] leading-none">{user.name || "Agent"}</div>
          <div className="text-xs text-[#8F9F8F] mt-0.5 font-mono">Aura Lvl {user.auraLevel}</div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-72 rounded-xl bg-[#0D0E12] border border-[#1F261F] shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header ID Card Style */}
          <div className="relative p-5 bg-gradient-to-b from-emerald-900/20 to-[#0D0E12] border-b border-[#1F261F]">
            <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500"></div>
            <div className="flex gap-4 items-center">
              <div className="size-16 rounded-lg bg-[#07080A] border border-emerald-500/20 flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 bg-emerald-500/10 opacity-50"></div>
                <Shield className="size-8 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[#4A5D4A] mb-1 font-mono">PROFILE // AGENT FILE</div>
                <div className="text-lg font-bold text-[#E2E8F0] truncate leading-tight flex items-center gap-2">
                  {user.name || "Agent"}
                  <Award className={`size-4 shrink-0 ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).colorText} ${getRankBadgeStyles(calculateAgentRank(user.auraPoints)).shadow}`} />
                </div>
                <div className="text-xs text-[#8F9F8F] truncate flex items-center gap-2">
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
          <div className="p-4 grid grid-cols-2 gap-3 bg-[#07080A]/50">
            <div className="bg-[#07080A] rounded-lg p-3 border border-[#1F261F]">
              <div className="text-xs text-[#4A5D4A] mb-1 flex items-center gap-1">
                <Terminal className="size-3" /> Aura Level
              </div>
              <div className="text-xl font-semibold text-[#E2E8F0]">{user.auraLevel}</div>
            </div>
            <div className="bg-[#07080A] rounded-lg p-3 border border-[#1F261F]">
              <div className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                <Sparkles className="size-3" /> Aura Points
              </div>
              <div className="text-xl font-semibold text-emerald-400">{user.auraPoints}</div>
            </div>
            <div className="bg-[#07080A] rounded-lg p-3 border border-[#1F261F] col-span-2 flex items-center justify-between">
              <div>
                <div className="text-xs text-[#4A5D4A] mb-0.5">Missions Completed</div>
                <div className="text-lg font-semibold text-[#E2E8F0]">{completedMissions}</div>
              </div>

              {/* Fox Badges Section */}
              <div className="size-10 relative group/badge">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-md opacity-0 group-hover/badge:opacity-100 transition-opacity"></div>
                <Image src="/characters/fox.png" alt="Innovation" fill sizes="40px" className="object-contain" />
                <div className="absolute -bottom-1 -right-1 bg-[#07080A] text-amber-500 text-[10px] font-bold px-1 border border-amber-500/20 rounded z-10">
                  x0
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-3 border-t border-[#1F261F] bg-[#07080A] flex flex-col gap-1.5">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-[#8F9F8F] hover:text-[#E2E8F0] hover:bg-[#181C18] border border-[#1F261F] transition-all"
            >
              <Shield className="size-4 text-emerald-400" /> View Settings
            </Link>
            <div className="border-t border-[#1F261F] my-0.5"></div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm text-[#8F9F8F] hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="size-4" /> Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
