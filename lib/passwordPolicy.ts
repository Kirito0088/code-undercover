/**
 * Shared password policy for registration and password reset — kept in one
 * place so the two flows can't silently drift out of sync (reset-password
 * previously enforced no minimum at all; register enforced 6 chars server-side
 * while its own form already required 8). Mirrors the 8-char minimum the
 * register form already displays to users in app/(auth)/register/page.tsx.
 */
export function validatePassword(password: string): string | null {
    if (!password || password.length < 8) {
        return "Password must be at least 8 characters long."
    }
    return null
}
