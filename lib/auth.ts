import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
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
    ],
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string
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
