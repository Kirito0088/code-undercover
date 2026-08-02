import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google"

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    weight: ["600", "700"],
    variable: "--font-display",
    display: "swap",
})

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-body",
    display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ["latin"],
    weight: ["400", "500", "600"],
    variable: "--font-dash-mono",
    display: "swap",
})

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={`dash-theme ${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} font-[family-name:var(--font-body)] text-dash-text`}>
            {children}
        </div>
    )
}
