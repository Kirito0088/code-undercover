package com.example.codeundercover_1.data.repo

import com.example.codeundercover_1.data.model.CheckUserResponse
import com.example.codeundercover_1.data.model.CsrfResponse
import com.example.codeundercover_1.data.model.ForgotPasswordRequest
import com.example.codeundercover_1.data.model.RegisterRequest
import com.example.codeundercover_1.data.model.RegisterResponse
import com.example.codeundercover_1.data.model.RegisteredUser
import com.example.codeundercover_1.data.model.ResetPasswordRequest
import com.example.codeundercover_1.data.model.SessionResponse
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.data.model.SignInResponse
import com.example.codeundercover_1.data.model.SimpleAck
import com.example.codeundercover_1.data.net.ApiClient
import com.example.codeundercover_1.data.net.ApiError
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.ErrorKind
import com.example.codeundercover_1.data.net.decode
import com.example.codeundercover_1.data.net.getJson
import com.example.codeundercover_1.data.net.postJson

/**
 * Speaks NextAuth's credentials flow the same way the browser does.
 *
 * There is no bearer-token endpoint on this backend — the session is an
 * httpOnly cookie issued by `/api/auth/callback/credentials`. So the Android
 * client performs the identical three-step exchange (fetch CSRF, post
 * credentials, read session) and lets [PersistentCookieJar] hold the result.
 * That is why none of this requires a single change to the web app.
 */
class AuthRepository(private val api: ApiClient) {

    private suspend fun csrfToken(): ApiResult<String> =
        when (val result = api.getJson<CsrfResponse>("/api/auth/csrf")) {
            is ApiResult.Success -> ApiResult.Success(result.data.csrfToken)
            is ApiResult.Failure -> result
        }

    suspend fun signIn(email: String, password: String): ApiResult<SessionUser> {
        val csrf = when (val result = csrfToken()) {
            is ApiResult.Success -> result.data
            is ApiResult.Failure -> return result
        }

        val callbackUrl = api.currentBaseUrl()
        val body = api.formBody(
            "csrfToken" to csrf,
            "email" to email.trim().lowercase(),
            "password" to password,
            "callbackUrl" to callbackUrl,
            // Without this NextAuth answers with a 302 to an HTML page; with it
            // we get a JSON body we can actually inspect.
            "json" to "true",
        )

        val raw = when (
            val result = api.send("POST", "/api/auth/callback/credentials", body)
        ) {
            is ApiResult.Success -> result.data
            is ApiResult.Failure -> return result
        }

        val url = when (val decoded = api.decode<SignInResponse>(raw)) {
            is ApiResult.Success -> decoded.data.url.orEmpty()
            is ApiResult.Failure -> return decoded
        }

        // A rejected password still returns HTTP 200. The only signal is the
        // error code carried in the returned URL.
        if (url.contains("error=", ignoreCase = true)) {
            return ApiResult.Failure(
                ApiError(
                    kind = ErrorKind.Unauthorized,
                    message = when {
                        url.contains("CredentialsSignin", ignoreCase = true) ->
                            "Incorrect email or password."
                        else -> "Sign-in was refused. Try again shortly."
                    },
                )
            )
        }

        return when (val session = currentSession()) {
            is ApiResult.Success -> session.data?.let { ApiResult.Success(it) }
                ?: ApiResult.Failure(
                    ApiError(
                        ErrorKind.Unauthorized,
                        "Signed in but no session came back. Check the server clock and NEXTAUTH_URL.",
                    )
                )

            is ApiResult.Failure -> session
        }
    }

    /**
     * Returns null (not a failure) when nobody is signed in — NextAuth answers
     * `{}` with a 200 for an anonymous caller, which is a valid state rather
     * than an error.
     */
    suspend fun currentSession(): ApiResult<SessionUser?> =
        when (val result = api.getJson<SessionResponse>("/api/auth/session")) {
            is ApiResult.Success -> ApiResult.Success(result.data.user)
            is ApiResult.Failure -> result
        }

    suspend fun signOut(): ApiResult<Unit> {
        val csrf = when (val result = csrfToken()) {
            is ApiResult.Success -> result.data
            is ApiResult.Failure -> {
                // Losing the session locally matters more than a clean
                // server-side sign-out; drop the cookies either way.
                api.cookieJar.clear()
                return result
            }
        }

        val body = api.formBody(
            "csrfToken" to csrf,
            "callbackUrl" to api.currentBaseUrl(),
            "json" to "true",
        )
        val result = api.send("POST", "/api/auth/signout", body)
        api.cookieJar.clear()

        return when (result) {
            is ApiResult.Success -> ApiResult.Success(Unit)
            is ApiResult.Failure -> result
        }
    }

    suspend fun register(
        name: String,
        username: String,
        email: String,
        password: String,
        preferredLanguage: String,
    ): ApiResult<RegisteredUser> {
        val payload = api.json.encodeToString(
            RegisterRequest(
                name = name.trim(),
                username = username.trim(),
                email = email.trim().lowercase(),
                password = password,
                preferredLanguage = preferredLanguage,
            )
        )

        return when (
            val result = api.postJson<RegisterResponse>("/api/auth/register", payload)
        ) {
            is ApiResult.Success -> result.data.user
                ?.let { ApiResult.Success(it) }
                ?: ApiResult.Failure(
                    ApiError(ErrorKind.Parse, "Registration succeeded but returned no account.")
                )

            is ApiResult.Failure -> result
        }
    }

    /** Used to tell "no account" apart from "wrong password" on the login form. */
    suspend fun accountExists(email: String): ApiResult<Boolean> {
        val encoded = java.net.URLEncoder.encode(email.trim().lowercase(), "UTF-8")
        return when (
            val result = api.getJson<CheckUserResponse>("/api/auth/check-user?email=$encoded")
        ) {
            is ApiResult.Success -> ApiResult.Success(result.data.exists)
            is ApiResult.Failure -> result
        }
    }

    suspend fun requestPasswordReset(email: String): ApiResult<SimpleAck> {
        val payload = api.json.encodeToString(ForgotPasswordRequest(email.trim().lowercase()))
        return api.postJson("/api/auth/forgot-password", payload)
    }

    suspend fun resetPassword(token: String, password: String): ApiResult<SimpleAck> {
        val payload = api.json.encodeToString(ResetPasswordRequest(token, password))
        return api.postJson("/api/auth/reset-password", payload)
    }

    suspend fun markIntroSeen(): ApiResult<SimpleAck> =
        api.postJson("/api/auth/intro-seen", "{}")
}
