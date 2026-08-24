"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const [isPending, ] = useTransition()
  const [visible, setVisible] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null)

  useEffect(() => {
    setVisible(true)
    let progress = 0

    const tick = () => {
      if (progress < 90) {
        progress += Math.random() * 20
        if (progress > 90) progress = 90
        if (progressRef.current) progressRef.current.style.width = `${progress}%`
      }
      if (visible) rafRef.current = requestAnimationFrame(tick)
    }

    timerRef.current = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick)
    }, 30)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [pathname, visible])

  useEffect(() => {
    if (!isPending) {
      if (progressRef.current) {
        progressRef.current.style.width = "100%"
        setTimeout(() => {
          if (progressRef.current) {
            progressRef.current.style.width = "0%"
            progressRef.current.style.opacity = "0"
          }
        }, 150)
      }
      setVisible(false)
    }
  }, [isPending])

  return (
    <div
      ref={progressRef}
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-[#5e6ad2] transition-opacity duration-300"
      style={{ width: "0%", opacity: 0 }}
      role="progressbar"
      aria-label="Page loading"
    />
  )
}