import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"

if (!process.env.NEXTAUTH_SECRET) {
    console.warn(
        "[AUTH] NEXTAUTH_SECRET is not set. Using fallback for development only."
    )
}

export const authOptions: NextAuthOptions = {
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
            // For OAuth sign-ins, ensure the user exists in our DB
            if (account?.provider === "google" && user.email) {
                try {
                    const existingUser = await db.user.findUnique({
                        where: { email: user.email.trim().toLowerCase() },
                    })

                    if (!existingUser) {
                        // Auto-create a user record for Google sign-ins
                        const newUser = await db.user.create({
                            data: {
                                email: user.email.trim().toLowerCase(),
                                name: user.name || user.email.split("@")[0],
                            },
                        })
                        console.log(`[AUTH] Auto-created user for Google sign-in: ${newUser.id}`)
                        // Update the user object so the JWT gets the correct DB id
                        user.id = newUser.id
                    } else {
                        // Use the existing DB user id
                        user.id = existingUser.id
                    }
                } catch (error) {
                    console.error("[AUTH] Error handling Google sign-in:", error)
                    return false
                }
            }
            return true
        },
        async session({ session, token }) {
            if (token && session.user) {
                // If the token ID is 25 chars, it's a legacy SQLite CUID. Look up their real MongoDB ID by email.
                if (token.id && token.id.toString().length === 25 && session.user.email) {
                    try {
                        const dbUser = await db.user.findUnique({ where: { email: session.user.email } })
                        session.user.id = dbUser?.id || token.id as string
                    } catch {
                        session.user.id = token.id as string
                    }
                } else {
                    session.user.id = token.id as string
                }
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
    },
}
