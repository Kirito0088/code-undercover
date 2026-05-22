import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"
import { sendPasswordResetEmail } from "@/lib/email"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { email } = body

        if (!email) {
            return NextResponse.json(
                { message: "Email is required" },
                { status: 400 }
            )
        }

        const normalizedEmail = email.trim().toLowerCase()

        const user = await db.user.findUnique({
            where: { email: normalizedEmail },
        })

        // Always return success even if user doesn't exist (prevents email enumeration)
        if (!user) {
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 500))
            return NextResponse.json({ message: "If the email exists, a reset link was sent." }, { status: 200 })
        }

        // Generate random token
        const rawToken = crypto.randomBytes(32).toString("hex")
        
        // Hash it for DB storage (security best practice)
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex")

        // Expiry: 1 hour from now
        const expires = new Date(Date.now() + 3600000)

        await db.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: hashedToken,
                passwordResetExpires: expires,
            },
        })

        // Send email
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(normalizedEmail)}`
        const emailSent = await sendPasswordResetEmail(normalizedEmail, resetUrl)

        if (!emailSent) {
            console.error("[FORGOT_PASSWORD] Failed to send email via Nodemailer.")
            // Don't fail the request entirely, but log it
        }

        return NextResponse.json(
            { message: "If the email exists, a reset link was sent." },
            { status: 200 }
        )
    } catch (error) {
        console.error("[FORGOT_PASSWORD] Error:", error)
        return NextResponse.json(
            { message: "System malfunction during transmission." },
            { status: 500 }
        )
    }
}
