import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"
import { registerLimiter, getIpFromHeaders } from "@/lib/rate-limit"
import { validatePassword } from "@/lib/passwordPolicy"

const VALID_LANGUAGES = ["C", "Java", "Python", "DBMS"]

export async function POST(req: Request) {
    const ip = getIpFromHeaders(req.headers)
    const rate = registerLimiter.check(ip)

    if (!rate.success) {
        return NextResponse.json(
            {
                error: `Too many registration attempts. Try again in ${Math.ceil(
                    rate.retryAfterMs / 1000
                )}s.`,
                message: `Too many registration attempts. Try again in ${Math.ceil(
                    rate.retryAfterMs / 1000
                )}s.`,
            },
            { status: 429 }
        )
    }

    let body: Record<string, unknown>
    try {
        body = await req.json()
    } catch {
        return NextResponse.json(
            { error: "Invalid request body.", message: "Invalid request body." },
            { status: 400 }
        )
    }

    const name = typeof body.name === "string" ? body.name.trim() : ""
    const username = typeof body.username === "string" ? body.username.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
    const password = typeof body.password === "string" ? body.password : ""
    const preferredLanguageRaw = typeof body.preferredLanguage === "string" ? body.preferredLanguage : "C"
    const preferredLanguage = VALID_LANGUAGES.includes(preferredLanguageRaw) ? preferredLanguageRaw : "C"

    // --- Validation (400) ---
    const errors: string[] = []
    if (!name || name.length < 2) errors.push("Name must be at least 2 characters.")
    if (!username || username.length < 3 || username.length > 20) {
        errors.push("Codename must be between 3 and 20 characters.")
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        errors.push("Codename can only contain letters, numbers, underscores, and hyphens.")
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("A valid email format is required.")
    }
    const passwordError = validatePassword(password)
    if (passwordError) errors.push(passwordError)

    if (errors.length > 0) {
        const errorMsg = errors.join(" ")
        return NextResponse.json({ error: errorMsg, message: errorMsg }, { status: 400 })
    }

    try {
        // --- Existing user / Conflict check (409) ---
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        const existingUsername = await db.user.findUnique({
            where: { username },
        })

        if (existingUsername && (!existingUser || existingUser.id !== existingUsername.id)) {
            return NextResponse.json(
                { error: "Codename already taken. Choose another.", message: "Codename already taken. Choose another." },
                { status: 409 }
            )
        }

        const hashedPassword = await hash(password, 12)
        let newUser

        if (existingUser) {
            if (existingUser.password) {
                return NextResponse.json(
                    { error: "User with this email already exists", message: "User with this email already exists" },
                    { status: 409 }
                )
            }

            newUser = await db.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    name: name || existingUser.name || email.split("@")[0],
                    username,
                    preferredLanguage,
                },
            })
            console.log("[REGISTER] Password initialized for existing user")
        } else {
            newUser = await db.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name || email.split("@")[0],
                    username,
                    preferredLanguage,
                },
            })
            console.log("[REGISTER] New user created")
        }

        console.log("[REGISTER] User created successfully")

        return NextResponse.json(
            {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                    username: newUser.username,
                },
                message: "User created successfully",
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("[REGISTER] Registration failed:", error)
        return NextResponse.json(
            { error: "An error occurred during registration", message: "An error occurred during registration" },
            { status: 500 }
        )
    }
}
