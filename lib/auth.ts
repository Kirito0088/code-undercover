import { NextAuthOptions } from "next-auth"

// Sanitize env variables (strips literal quotes if passed by Docker --env-file)
if (process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = process.env.NEXTAUTH_URL.replace(/^["']|["']$/g, "").trim()
}
if (process.env.NEXTAUTH_SECRET) {
    process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET.replace(/^["']|["']$/g, "").trim()
}
if (process.env.GOOGLE_CLIENT_ID) {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID.replace(/^["']|["']$/g, "").trim()
}
if (process.env.GOOGLE_CLIENT_SECRET) {
    process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET.replace(/^["']|["']$/g, "").trim()
}
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { db } from "@/lib/db"
import { compare } from "bcryptjs"
import { loginFailedLimiter, getIpFromHeaders } from "./rate-limit"

/**
 * Derive a base username from a name or email, then guarantee uniqueness
 * by appending a numeric suffix if the base is already taken.
 */
async function generateUniqueUsername(seed: string): Promise<string> {
    const base = seed
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .slice(0, 20) || "agent";

    let candidate = base;
    let suffix = 0;

    // Loop until we find a codename that isn't taken.
    while (suffix < 1000) {
        const existing = await db.user.findUnique({ where: { username: candidate } });
        if (!existing) return candidate;
        suffix += 1;
        candidate = `${base}${suffix}`;
    }

    // Fallback: timestamp-based, essentially guaranteed unique.
    return `${base}${Date.now()}`;
}

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(db),
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: (() => {
        const secret = process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
        if (secret) return secret;
        if (process.env.NEXT_PHASE === "phase-production-build") {
            // `next build` imports this module for static analysis but never
            // serves requests, so no real secret is needed at build time.
            return "unused-build-time-placeholder";
        }
        throw new Error("NEXTAUTH_SECRET (or AUTH_SECRET) must be set.");
    })(),
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
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    console.warn("[AUTH] Missing credentials in login attempt")
                    return null
                }

                const ip = getIpFromHeaders(req?.headers)
                const normalizedEmail = credentials.email.trim().toLowerCase()
                const rateLimitKey = `${ip}:${normalizedEmail}`

                if (await loginFailedLimiter.isRateLimited(rateLimitKey)) {
                    console.warn("[AUTH] Login attempt blocked by rate limit")
                    return null
                }

                try {
                    const user = await db.user.findUnique({
                        where: {
                            email: normalizedEmail,
                        },
                    })

                    if (!user) {
                        console.warn("[AUTH] No user record found")
                        await loginFailedLimiter.increment(rateLimitKey)
                        return null
                    }

                    if (!user.password) {
                        console.warn("[AUTH] User exists but has no password (needs registration)")
                        await loginFailedLimiter.increment(rateLimitKey)
                        return null
                    }

                    const isPasswordValid = await compare(
                        credentials.password,
                        user.password
                    )

                    if (!isPasswordValid) {
                        console.warn("[AUTH] Invalid password")
                        await loginFailedLimiter.increment(rateLimitKey)
                        return null
                    }
                    console.log("[AUTH] User authenticated successfully")

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
            if (account?.provider === "google" && user.email) {
                try {
                    const emailStr = user.email as string;
                    const existingUser = await db.user.findUnique({
                        where: { email: emailStr },
                    });

                    if (existingUser && !existingUser.username) {
                        // Never seed from the email — this is just a starting
                        // point until the user picks their own in Profile settings.
                        const username = await generateUniqueUsername(
                            existingUser.name || "agent"
                        );
                        await db.user.update({
                            where: { id: existingUser.id },
                            data: { username },
                        });
                    }
                } catch (e) {
                    console.error("[AUTH] Error during Google signIn username backfill:", e);
                }
            }
            return true;
        },

        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.username =
                    (user as { username?: string | null }).username ||
                    (user.email ? user.email.split("@")[0] : "agent");

                try {
                    const dbUser = await db.user.findUnique({
                        where: { id: user.id },
                        select: { hasSeenIntro: true, missionsCompleted: true },
                    });

                    token.hasSeenIntro =
                        dbUser?.hasSeenIntro === true ||
                        (dbUser?.missionsCompleted ?? 0) > 0;
                } catch (e) {
                    console.error("[AUTH] Database offline during sign-in jwt query:", e);
                    token.hasSeenIntro = false;
                }
            }

            if (!token.username && token.email) {
                try {
                    const emailStr = token.email as string;
                    const dbUser = await db.user.findUnique({
                        where: { email: emailStr },
                        select: { username: true, hasSeenIntro: true },
                    });
                    token.username = dbUser?.username || emailStr.split("@")[0];
                    token.hasSeenIntro = token.hasSeenIntro ?? (dbUser?.hasSeenIntro ?? false);
                } catch (e) {
                    console.error("[AUTH] Error fetching dbUser for username in jwt:", e);
                    token.username = token.username || (token.email as string).split("@")[0];
                }
            }

            if (trigger === "update" && token.id) {
                try {
                    const dbUser = await db.user.findUnique({
                        where: { id: token.id as string },
                        select: { hasSeenIntro: true },
                    });
                    token.hasSeenIntro = dbUser?.hasSeenIntro ?? false;
                } catch (e) {
                    console.error("[AUTH] Database offline during trigger update jwt query:", e);
                    token.hasSeenIntro = token.hasSeenIntro ?? false;
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.username = (token.username as string) || "agent";
                session.user.hasSeenIntro = (token.hasSeenIntro as boolean) ?? false;
            }
            return session;
        },
    },
}
