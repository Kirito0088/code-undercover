package com.example.codeundercover_1.domain

/**
 * Client-side mirror of the server's validation rules, taken verbatim from
 * `app/api/auth/register/route.ts`, `app/api/profile/route.ts` and
 * `lib/passwordPolicy.ts`.
 *
 * This is a UX affordance, not a security boundary — the server still rejects
 * bad input. Checking locally just means the form can say what is wrong the
 * moment it is typed rather than after a round-trip, and the wording matches
 * what the API would have returned so the two never appear to disagree.
 */
object Validation {

    private val EMAIL = Regex("""^[^\s@]+@[^\s@]+\.[^\s@]+$""")
    private val CODENAME = Regex("""^[a-zA-Z0-9_\-]+$""")

    const val MIN_PASSWORD_LENGTH = 8
    const val MIN_CODENAME_LENGTH = 3
    const val MAX_CODENAME_LENGTH = 20
    const val MAX_NAME_LENGTH = 50

    val LANGUAGES = listOf("C", "Java", "Python", "DBMS")

    fun name(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < 2 -> "Name must be at least 2 characters."
            trimmed.length > MAX_NAME_LENGTH -> "Name must be under 50 characters."
            else -> null
        }
    }

    fun codename(value: String): String? {
        val trimmed = value.trim()
        return when {
            trimmed.length < MIN_CODENAME_LENGTH || trimmed.length > MAX_CODENAME_LENGTH ->
                "Codename must be between 3 and 20 characters."

            !CODENAME.matches(trimmed) ->
                "Codename can only contain letters, numbers, underscores, and hyphens."

            else -> null
        }
    }

    fun email(value: String): String? {
        val trimmed = value.trim()
        return if (!EMAIL.matches(trimmed)) "A valid email format is required." else null
    }

    fun password(value: String): String? =
        if (value.length < MIN_PASSWORD_LENGTH) {
            "Password must be at least 8 characters long."
        } else {
            null
        }

    fun confirmPassword(password: String, confirmation: String): String? =
        if (password != confirmation) "Passwords do not match." else null
}
