import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "@/styles/case-map.tokens.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { NetworkProvider } from "@/components/common/NetworkProvider";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ThemeProvider } from "@/components/theme-provider";
import { detectiveFontVariables } from "@/lib/detective-fonts";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// Runs before first paint so the saved theme is on <html> prior to any styled
// content rendering. Kept minimal and self-contained — it must not depend on
// anything the bundler hasn't shipped yet. Inline execution relies on the
// 'unsafe-inline' script-src in next.config.mjs.
const THEME_INIT = `
try {
  var t = localStorage.getItem('cu-theme');
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
} catch (e) {}
`

export const metadata: Metadata = {
  title: "Code Undercover | Gamified Coding Missions",
  description: "A secure, gamified platform for completing programming missions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Kalam / Special Elite / Courier Prime are declared on <body> rather
          than per-scene so shared chrome (the navbar) can use font-type too. */}
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${detectiveFontVariables} font-sans antialiased`}
      >
        {/* Anti-FOUC theme init. This is a plain <script> rather than
            next/script on purpose: next/script is a Client Component, so React
            met this tag again during the client render — where scripts never
            execute — and warned about it. A raw tag in this Server Component is
            emitted straight into the SSR HTML and run by the browser during
            parse, before anything paints, which is what beforeInteractive was
            being asked to approximate. That strategy is meant for external
            third-party scripts anyway, not a two-line localStorage read. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />

        <ThemeProvider>
          <AuthProvider>
            <NetworkProvider>
              <div className="relative flex min-h-screen flex-col">
                <Navbar />
                <NavigationProgress />
                <main className="flex-1 flex flex-col">{children}</main>
              </div>
            </NetworkProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
