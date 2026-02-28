import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hash } from "bcrypt"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email, password, name } = body

        // Validate required fields
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Invalid email format" },
                { status: 400 }
            )
        }

        // Validate password length
        if (password.length < 6) {
            return NextResponse.json(
                { message: "Password must be at least 6 characters" },
                { status: 400 }
            )
        }

        // Check if user exists
        const existingUser = await db.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { message: "User with this email already exists" },
                { status: 409 }
            )
        }

        // Hash password with bcrypt (cost factor 12 for production security)
        const hashedPassword = await hash(password, 12)

        // Create user
        const newUser = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split("@")[0],
            },
        })

        console.log(`[REGISTER] User created successfully: ${newUser.id}`)

        return NextResponse.json(
            {
                user: {
                    id: newUser.id,
                    email: newUser.email,
                    name: newUser.name,
                },
                message: "User created successfully",
            },
            { status: 201 }
        )
    } catch (error) {
        console.error("[REGISTER] Registration failed:", error)
        return NextResponse.json(
            { message: "An error occurred during registration" },
            { status: 500 }
        )
    }
}
