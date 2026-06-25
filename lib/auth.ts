import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

if (!process.env.NEXTAUTH_SECRET) {
    console.warn(
        "[AUTH] NEXTAUTH_SECRET is not set. Using fallback for development only."
    )
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "agent@codeundercover.com",
                },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    console.warn("[AUTH] Missing credentials in login attempt")
                    return null
                }

                try {
                    // Normalize email to prevent case/whitespace mismatches
                    const normalizedEmail = credentials.email.trim().toLowerCase()

                    const user = await db.user.findUnique({
                        where: {
                            email: normalizedEmail,
                        },
                    })

                    if (!user) {
                        console.warn(`[AUTH] No user record found for email: ${normalizedEmail}`)
                        return null
                    }

                    if (!user.password) {
                        console.warn(`[AUTH] User exists but has no password (needs registration): ${normalizedEmail}`)
                        return null
                    }

                    const isPasswordValid = await compare(
                        credentials.password,
                        user.password
                    )

                    if (!isPasswordValid) {
                        console.warn(
                            `[AUTH] Invalid password for email: ${credentials.email}`
                        )
                        return null
                    }

                    console.log(`[AUTH] User authenticated: ${user.id}`)

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        username: user.username,
                    }
                } catch (error) {
                    console.error("[AUTH] Error during authentication:", error)
                    return null
                }
            },
        }),
        // Google OAuth — only enabled when credentials are configured
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    allowDangerousEmailAccountLinking: true,
                }),
            ]
            : []),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === "google") {
                const existingUser = await db.user.findUnique({
                    where: { email: user.email ?? "" }
                });
                if (!existingUser) {
                    return "/login?error=AccountNotExist";
                }
            }
            return true;
        },
        async jwt({ token, user, trigger }) {
            // On first sign-in, embed hasSeenIntro from DB into the JWT
            if (user) {
                token.id = user.id
                token.username = (user as { username?: string | null }).username

                const dbUser = await db.user.findUnique({
                    where: { id: user.id },
                    select: { hasSeenIntro: true, missionsCompleted: true },
                })

                // Auto-mark intro seen for returning users who already have missions
                // (handles Google OAuth on a new device — they never see the intro again)
                token.hasSeenIntro =
                    dbUser?.hasSeenIntro === true ||
                    (dbUser?.missionsCompleted ?? 0) > 0
            }

            // After the intro page calls updateSession(), refresh the flag from DB
            if (trigger === "update" && token.id) {
                const dbUser = await db.user.findUnique({
                    where: { id: token.id as string },
                    select: { hasSeenIntro: true },
                })
                token.hasSeenIntro = dbUser?.hasSeenIntro ?? false
            }

            return token
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
                session.user.username = token.username as string
                session.user.hasSeenIntro = token.hasSeenIntro as boolean
            }
            return session
        },
    },
}
