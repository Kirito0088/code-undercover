import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { profileLimiter } from "@/lib/rate-limit"
import { isValidAvatarPath } from "@/lib/avatars"
import { invalidateUser } from "@/lib/cache"

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const rate = await profileLimiter.check(session.user.id)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        const body = await req.json().catch(() => ({}))
        const { name, email, username, image } = body

        // Validation
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length === 0) {
                return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
            }
            if (name.length > 50) {
                return NextResponse.json({ error: "Name must be under 50 characters" }, { status: 400 })
            }
        }

        if (email !== undefined) {
            if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
            }
        }

        // Same rules as registration (app/api/auth/register/route.ts)
        if (username !== undefined) {
            if (typeof username !== "string" || username.length < 3 || username.length > 20) {
                return NextResponse.json({ error: "Codename must be between 3 and 20 characters." }, { status: 400 })
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
                return NextResponse.json({ error: "Codename can only contain letters, numbers, underscores, and hyphens." }, { status: 400 })
            }
        }

        // image is either "" (clear avatar) or one of the known preset paths —
        // never an arbitrary string, since it's rendered as an <img src>.
        if (image !== undefined && image !== "" && !isValidAvatarPath(image)) {
            return NextResponse.json({ error: "Invalid avatar selection." }, { status: 400 })
        }

        // Get current user to check for changes and collisions
        const currentUser = await db.user.findUnique({
            where: { id: session.user.id },
            select: { email: true, username: true }
        })

        if (!currentUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const updateData: { name?: string; email?: string; username?: string; image?: string | null } = {}
        if (name !== undefined) updateData.name = name.trim()
        if (image !== undefined) updateData.image = image === "" ? null : image
        if (email !== undefined) {
            const normalizedEmail = email.trim().toLowerCase()
            if (normalizedEmail !== currentUser.email?.toLowerCase()) {
                // Collision check
                const existingUser = await db.user.findUnique({
                    where: { email: normalizedEmail }
                })
                if (existingUser) {
                    return NextResponse.json({ error: "Email already in use" }, { status: 409 })
                }
                updateData.email = normalizedEmail
            }
        }
        if (username !== undefined && username !== currentUser.username) {
            const existingUsername = await db.user.findUnique({
                where: { username }
            })
            if (existingUsername) {
                return NextResponse.json({ error: "Codename already taken. Choose another." }, { status: 409 })
            }
            updateData.username = username
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: true, message: "No changes requested" })
        }

        const updatedUser = await db.user.update({
            where: { id: session.user.id },
            data: updateData,
            select: { name: true, email: true, username: true, image: true }
        })

        // Name/email feed the profile menu, which the navbar caches.
        if (updatedUser.email) await invalidateUser(updatedUser.email)
        if (session.user.email && session.user.email !== updatedUser.email) {
            await invalidateUser(session.user.email)
        }

        return NextResponse.json({ success: true, user: updatedUser })
    } catch (error: unknown) {
        console.error("[Profile API Error]:", error)
        const err = error as { code?: string }
        if (err.code === 'P2002') {
            return NextResponse.json({ error: "Email or codename already in use" }, { status: 409 })
        }
        return NextResponse.json({ error: "Failed to update profile settings" }, { status: 500 })
    }
}

export async function DELETE(_req: Request) {
    try {
        const session = await getServerSession(authOptions)
        const userId = session?.user?.id

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const rate = await profileLimiter.check(userId)
        if (!rate.success) {
            return NextResponse.json(
                { error: `Too many requests. Try again in ${Math.ceil(rate.retryAfterMs / 1000)}s.` },
                { status: 429 }
            )
        }

        await db.user.delete({
            where: { id: userId }
        })

        const response = NextResponse.json({ 
            success: true, 
            message: "Account deleted successfully." 
        });

        // Server-Side Session Invalidation:
        // Set standard and secure NextAuth cookies to expire immediately (maxAge = 0)
        // to handle client-side signOut failures cleanly.
        const cookieOptions = "path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
        response.headers.append("Set-Cookie", `next-auth.session-token=; ${cookieOptions}`);
        response.headers.append("Set-Cookie", `__Secure-next-auth.session-token=; ${cookieOptions}; Secure`);

        console.log("[DELETE PROFILE API] Returning success response and clearing cookies");
        return response;
    } catch (error: unknown) {
        console.error("[DELETE PROFILE API] Error in DELETE handler:", error);
        
        // Handle Prisma "Record not found" error (P2025)
        const err = error as { code?: string };
        if (err.code === 'P2025') {
            console.warn("[DELETE PROFILE API] Record not found in database (P2025). User might already be deleted.");
            return NextResponse.json({ error: "Account not found or already deleted" }, { status: 404 });
        }

        return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
    }
}
