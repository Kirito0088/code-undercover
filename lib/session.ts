import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const STALE_SESSION_CODE = "STALE_SESSION"

/**
 * Builds the 401 sent when a cookie names an account that is no longer there.
 * The `code` lets the client tell this apart from "never signed in" and force a
 * fresh sign-in instead of retrying a request that can only keep failing.
 */
export function staleSessionResponse() {
    return NextResponse.json(
        {
            error: "Your session refers to an account that no longer exists. Please sign in again.",
            code: STALE_SESSION_CODE,
        },
        { status: 401 }
    )
}

/**
 * Answers `false` only when the lookup succeeded and found nothing. A database
 * failure answers `true`, so a transient outage never signs anyone out — that
 * request will fail on its own terms rather than by discarding a good session.
 */
export async function sessionUserStillExists(userId: string): Promise<boolean> {
    try {
        const account = await db.user.findUnique({
            where: { id: userId },
            select: { id: true },
        })
        return account !== null
    } catch (e) {
        console.error("[SESSION] Could not verify the account exists; assuming it does:", e)
        return true
    }
}

type SessionUserResult =
    | { userId: string; error?: undefined }
    | { userId?: undefined; error: NextResponse }

/**
 * Resolves the caller's user id and confirms the account still exists.
 *
 * Sessions are JWTs, so `token.id` is stamped once at sign-in and never
 * revalidated — a cookie outlives the row it names whenever an account is
 * deleted or the database is reseeded. Every write keyed on `User.id` then
 * trips its foreign key (`UserMission_userId_fkey`) and surfaces as a 500 the
 * agent cannot clear by retrying. Checking here turns that into the 401 it
 * actually is.
 */
export async function requireSessionUser(): Promise<SessionUserResult> {
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id

    if (!userId) {
        return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
    }

    if (!(await sessionUserStillExists(userId))) {
        return { error: staleSessionResponse() }
    }

    return { userId }
}
