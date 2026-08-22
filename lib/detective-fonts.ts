// Shared "detective corkboard" font set — used by DashboardScene,
// MissionCorkboard, and LevelsHeading. Self-hosted via next/font/google (build-time download,
// served from /_next/static/media), so no CSP changes are needed and no
// runtime request to fonts.googleapis.com ever happens.
import { Kalam, Special_Elite, Courier_Prime } from "next/font/google"

export const kalam = Kalam({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-kalam",
})

export const specialElite = Special_Elite({
    subsets: ["latin"],
    weight: ["400"],
    variable: "--font-special-elite",
})

export const courierPrime = Courier_Prime({
    subsets: ["latin"],
    weight: ["400", "700"],
    variable: "--font-courier",
})

export const detectiveFontVariables = `${kalam.variable} ${specialElite.variable} ${courierPrime.variable}`
