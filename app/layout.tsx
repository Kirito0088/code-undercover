import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import Navbar from "@/components/Navbar";
import { NetworkProvider } from "@/components/common/NetworkProvider";
import { NavigationProgress } from "@/components/NavigationProgress";
import { ThemeProvider } from "@/components/theme-provider";

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
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `
          try {
            var t = localStorage.getItem('cu-theme');
            document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
          } catch(e) {}
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
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
