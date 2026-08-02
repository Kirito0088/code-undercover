"use client"

// Tiny external store so the Topbar's hamburger button and the Sidebar's
// off-canvas panel can share "is the mobile nav open" without a wrapper
// component breaking page.tsx's server-component composition.

type Listener = () => void

let isOpen = false
const listeners = new Set<Listener>()

function emit() {
    listeners.forEach((listener) => listener())
}

export function getNavOpenSnapshot() {
    return isOpen
}

export function getNavOpenServerSnapshot() {
    return false
}

export function subscribeNavOpen(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function openNav() {
    isOpen = true
    emit()
}

export function closeNav() {
    isOpen = false
    emit()
}

export function toggleNav() {
    isOpen = !isOpen
    emit()
}
