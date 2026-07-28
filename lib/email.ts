import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Resend's shared onboarding@resend.dev sender works without a verified
// domain, but only delivers to the account owner's own inbox — fine for
// getting started, but a verified domain + EMAIL_FROM is required to send
// password resets to real users.
const FROM_ADDRESS = process.env.EMAIL_FROM || "Code Undercover Agency <onboarding@resend.dev>"

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
    if (!resend) {
        console.warn("[EMAIL] RESEND_API_KEY missing. Cannot send reset link.")
        console.log(`[EMAIL] Reset URL would be: ${resetUrl}`)
        return false
    }

    try {
        const { error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to,
            subject: "TERMINAL ACCESS: Passphrase Reset Signal",
            html: `
                <div style="font-family: monospace; background-color: #050505; color: #4ade80; padding: 30px; border: 1px solid #16a34a; max-width: 600px; margin: 0 auto; border-radius: 8px;">
                    <h2 style="color: #22c55e; border-bottom: 1px solid #16a34a; padding-bottom: 10px; margin-top: 0; letter-spacing: 2px;">INCOMING TRANSMISSION</h2>
                    <p style="color: #a3a3a3;">To: Agent ${to}</p>
                    <p>A request to reset your terminal passphrase has been authorized.</p>
                    <p>Click the secure link below to initiate the reset sequence. This link will self-destruct in 1 hour.</p>
                    
                    <div style="margin: 30px 0; text-align: center;">
                        <a href="${resetUrl}" style="background-color: #16a34a; color: #000; text-decoration: none; padding: 12px 24px; font-weight: bold; border-radius: 4px; display: inline-block; letter-spacing: 1px;">
                            INITIATE RESET SEQUENCE
                        </a>
                    </div>
                    
                    <p style="color: #a3a3a3; font-size: 12px; border-top: 1px dashed #16a34a; padding-top: 15px;">
                        If you did not request this transmission, ignore it. The system will remain secure.
                    </p>
                    <p style="color: #a3a3a3; font-size: 12px; margin-bottom: 0;">
                        Code Undercover Command Center
                    </p>
                </div>
            `,
        })

        if (error) {
            console.error("[EMAIL] Resend rejected the reset email:", error)
            return false
        }

        console.log(`[EMAIL] Password reset sent to ${to}`)
        return true
    } catch (error) {
        console.error("[EMAIL] Failed to send password reset:", error)
        return false
    }
}
