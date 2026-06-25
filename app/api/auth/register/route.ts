import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcryptjs"

const VALID_LANGUAGES = ["C", "Java", "Python", "DBMS"]

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name, username, preferredLanguage } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required", message: "Email and password are required" },
                { status: 400 }
            )
        }

        // Validate username (codename) presence
        if (!username || typeof username !== "string" || username.trim() === "") {
            return NextResponse.json(
                { error: "Codename is required", message: "Codename is required" },
                { status: 400 }
            )
        }

        // Validate username length (3-20 chars)
        const trimmedUsername = username.trim()
        if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
            return NextResponse.json(
                { error: "Codename must be between 3 and 20 characters", message: "Codename must be between 3 and 20 characters" },
                { status: 400 }
            )
        }

        // Validate username pattern (/^[a-zA-Z0-9_-]+$/)
        const usernameRegex = /^[a-zA-Z0-9_-]+$/
        if (!usernameRegex.test(trimmedUsername)) {
            return NextResponse.json(
                { error: "Codename can only contain letters, numbers, underscores, and hyphens", message: "Codename can only contain letters, numbers, underscores, and hyphens" },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format", message: "Invalid email format" },
                { status: 400 }
            )
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters", message: "Password must be at least 6 characters" },
                { status: 400 }
            )
        }

        // Validate preferred language (default to "C" if invalid/missing)
        const language = VALID_LANGUAGES.includes(preferredLanguage) ? preferredLanguage : "C"

        // Normalize email
        const normalizedEmail = email.trim().toLowerCase()

        // Check if user exists by email
        const existingUser = await db.user.findUnique({
            where: { email: normalizedEmail },
        })

        // Check if username is already taken
        const existingUsername = await db.user.findUnique({
            where: { username: trimmedUsername },
        })
        if (existingUsername && (!existingUser || existingUser.id !== existingUsername.id)) {
            return NextResponse.json(
                { error: "Codename already taken. Choose another.", message: "Codename already taken. Choose another." },
                { status: 409 }
            )
        }

        // Hash password with bcrypt (cost factor 12 for production security)
        const hashedPassword = await hash(password, 12)

        let newUser

        if (existingUser) {
            // If user exists but has NO password (auto-created by Navbar/session),
            // allow them to "register" by setting a password
            if (existingUser.password) {
                return NextResponse.json(
                    { error: "User with this email already exists", message: "User with this email already exists" },
                    { status: 409 }
                )
            }

            // Initialize password for existing password-less user
            newUser = await db.user.update({
                where: { id: existingUser.id },
                data: {
                    password: hashedPassword,
                    name: name || existingUser.name || normalizedEmail.split("@")[0],
                    username: trimmedUsername,
                    preferredLanguage: language,
                },
            })
            console.log(`[REGISTER] Password initialized for existing user: ${newUser.id}`)
        } else {
            // Create brand new user
            newUser = await db.user.create({
                data: {
                    email: normalizedEmail,
                    password: hashedPassword,
                    name: name || normalizedEmail.split("@")[0],
                    username: trimmedUsername,
                    preferredLanguage: language,
                },
            })
            console.log(`[REGISTER] New user created: ${newUser.id}`)
        }

        console.log(`[REGISTER] User created successfully: ${newUser.id}`)

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
