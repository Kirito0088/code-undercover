"use client"

import { useState, useRef, useEffect } from "react"
import { Menu, X } from "lucide-react"
import Link from "next/link"

interface MobileNavProps {
  isAuthenticated: boolean
  children?: React.ReactNode // ProfileMenu if authenticated
}

export function MobileNav({ isAuthenticated, children }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Close on route change (escape key)
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handleEsc)
    return () => document.removeEventListener("keydown", handleEsc)
  }, [])

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-lg text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors flex items-center justify-center"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="size-6" /> : <Menu className="size-6" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[#1C1C24] border border-[#323242] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/daily-tasks"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors"
                >
                  <span>Daily Task</span>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                    NEW
                  </span>
                </Link>
                <Link
                  href="/debug-lab"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors"
                >
                  Debug Lab
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors"
                >
                  Leaderboard
                </Link>
                <Link
                  href="/history"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors"
                >
                  History
                </Link>
                {/* Profile section */}
                <div className="pt-2 mt-2 border-t border-[#323242] flex justify-center">
                  {children}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-[#8B8BA7] hover:text-[#F1F1F5] hover:bg-[#2A2A35] transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-colors text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
