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
    <div className="md:hidden" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-gray-400 hover:text-green-400 hover:bg-gray-800/50 transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-950/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-4 space-y-1">
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-mono text-gray-300 hover:text-green-400 hover:bg-gray-800/50 transition-colors"
                >
                  DASHBOARD
                </Link>
                <Link
                  href="/debug-lab"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-mono text-gray-300 hover:text-red-400 hover:bg-gray-800/50 transition-colors"
                >
                  DEBUG LAB
                </Link>
                <Link
                  href="/leaderboard"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-mono text-gray-300 hover:text-green-400 hover:bg-gray-800/50 transition-colors"
                >
                  LEADERBOARD
                </Link>
                <Link
                  href="/history"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-mono text-gray-300 hover:text-cyan-400 hover:bg-gray-800/50 transition-colors"
                >
                  HISTORY
                </Link>
                {/* Profile section */}
                <div className="pt-3 mt-3 border-t border-gray-800">
                  {children}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors text-center shadow-[0_0_15px_rgba(22,163,74,0.5)]"
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
