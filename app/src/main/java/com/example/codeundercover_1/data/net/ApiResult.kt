package com.example.codeundercover_1.data.net

/**
 * Every failure the backend can hand us, named. The API is consistent about
 * status codes (401 unauthenticated, 403 locked mission, 409 taken codename,
 * 429 rate limit), so screens can branch on [ErrorKind] instead of matching
 * message strings.
 */
enum class ErrorKind {
    /** No route to the server — wrong base URL, dev server down, no Wi-Fi. */
    Network,

    /** 401 — session missing or expired; send the user back to sign-in. */
    Unauthorized,

    /** 403 — authenticated but not allowed, e.g. a LOCKED mission. */
    Forbidden,

    /** 429 — one of the server's rate limiters tripped. */
    RateLimited,

    NotFound,

    /** 409 — email or codename already taken. */
    Conflict,

    /** 400 — the server rejected the payload. */
    Validation,

    Server,
    Parse,
    Unknown,
}

data class ApiError(
    val kind: ErrorKind,
    val message: String,
    val status: Int? = null,
    val retryAfterSeconds: Int? = null,
) {
    companion object {
        fun network(cause: Throwable) = ApiError(
            kind = ErrorKind.Network,
            message = cause.message ?: "Could not reach the server.",
        )

        fun fromStatus(status: Int, message: String?): ApiError {
            val kind = when (status) {
                400 -> ErrorKind.Validation
                401 -> ErrorKind.Unauthorized
                403 -> ErrorKind.Forbidden
                404 -> ErrorKind.NotFound
                409 -> ErrorKind.Conflict
                429 -> ErrorKind.RateLimited
                in 500..599 -> ErrorKind.Server
                else -> ErrorKind.Unknown
            }
            return ApiError(
                kind = kind,
                message = message?.takeIf { it.isNotBlank() } ?: defaultMessage(kind),
                status = status,
                retryAfterSeconds = message?.let { parseRetrySeconds(it) },
            )
        }

        private fun defaultMessage(kind: ErrorKind) = when (kind) {
            ErrorKind.Unauthorized -> "Your session expired. Sign in again."
            ErrorKind.Forbidden -> "You do not have access to this."
            ErrorKind.RateLimited -> "Too many requests. Try again shortly."
            ErrorKind.NotFound -> "Not found."
            ErrorKind.Conflict -> "That is already taken."
            ErrorKind.Server -> "The server hit an error."
            else -> "Something went wrong."
        }

        /**
         * The rate limiters phrase their responses as "Try again in 42s.";
         * pulling the number out lets the UI show a live countdown instead of
         * a static sentence.
         */
        private fun parseRetrySeconds(message: String): Int? =
            Regex("""(\d+)\s*s""").find(message)?.groupValues?.get(1)?.toIntOrNull()
    }
}

sealed interface ApiResult<out T> {
    data class Success<out T>(val data: T) : ApiResult<T>
    data class Failure(val error: ApiError) : ApiResult<Nothing>
}

inline fun <T, R> ApiResult<T>.map(transform: (T) -> R): ApiResult<R> = when (this) {
    is ApiResult.Success -> ApiResult.Success(transform(data))
    is ApiResult.Failure -> this
}

fun <T> ApiResult<T>.getOrNull(): T? = (this as? ApiResult.Success)?.data

fun <T> ApiResult<T>.errorOrNull(): ApiError? = (this as? ApiResult.Failure)?.error
