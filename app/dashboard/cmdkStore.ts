"use client"

// Shared "is the command palette open" state — the Topbar's search button, the
// global ⌘K/Ctrl+K listener (in CommandPalette.tsx), and the overlay itself all
// need to agree on this without a wrapper component.

type Listener = () => void

let isOpen = false
const listeners = new Set<Listener>()

function emit() {
    listeners.forEach((listener) => listener())
}

export function getCmdkOpenSnapshot() {
    return isOpen
}

export function getCmdkOpenServerSnapshot() {
    return false
}

export function subscribeCmdkOpen(listener: Listener) {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function openCmdk() {
    isOpen = true
    emit()
}

export function closeCmdk() {
    isOpen = false
    emit()
}

export function toggleCmdk() {
    isOpen = !isOpen
    emit()
}
