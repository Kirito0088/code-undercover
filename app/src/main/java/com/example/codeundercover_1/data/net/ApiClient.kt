package com.example.codeundercover_1.data.net

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.FormBody
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import java.util.concurrent.TimeUnit

/**
 * Thin HTTP layer over the existing Next.js API. Deliberately not a Retrofit
 * interface: NextAuth's sign-in endpoint is form-encoded and returns its result
 * in a JSON body with a 200 even on failure, so hand-rolling the few calls is
 * clearer than bending a typed client around it.
 */
class ApiClient(
    private val settings: SettingsStore,
    val cookieJar: PersistentCookieJar,
) {
    val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        coerceInputValues = true
        explicitNulls = false
    }

    private val client = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .connectTimeout(15, TimeUnit.SECONDS)
        // Judge0 compiles and runs the submission inside this request, so the
        // read timeout has to tolerate a cold sandbox rather than the usual
        // sub-second API response.
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .followRedirects(true)
        .build()

    /** Shared with Coil so image loads reuse the same session cookies. */
    fun okHttp(): OkHttpClient = client

    suspend fun currentBaseUrl(): String = settings.currentBaseUrl()

    suspend fun send(
        method: String,
        path: String,
        body: RequestBody? = null,
        headers: Map<String, String> = emptyMap(),
    ): ApiResult<String> = withContext(Dispatchers.IO) {
        val base = settings.currentBaseUrl()
        val url = (base + path).toHttpUrlOrNull()
            ?: return@withContext ApiResult.Failure(
                ApiError(ErrorKind.Network, "Server address is not a valid URL: $base")
            )

        val request = Request.Builder()
            .url(url)
            .apply {
                headers.forEach { (name, value) -> header(name, value) }
                header("Accept", "application/json")
                method(method, body)
            }
            .build()

        try {
            client.newCall(request).execute().use { response ->
                val text = response.body?.string() ?: ""
                if (response.isSuccessful) {
                    ApiResult.Success(text)
                } else {
                    ApiResult.Failure(
                        ApiError.fromStatus(response.code, extractMessage(text))
                    )
                }
            }
        } catch (e: IOException) {
            ApiResult.Failure(ApiError.network(e))
        }
    }

    fun jsonBody(text: String): RequestBody =
        text.toRequestBody("application/json; charset=utf-8".toMediaType())

    fun formBody(vararg pairs: Pair<String, String>): RequestBody =
        FormBody.Builder().apply {
            pairs.forEach { (name, value) -> add(name, value) }
        }.build()

    /**
     * The API is not uniform about its error field: `register` returns both
     * `error` and `message`, `missions/accept` returns only `message`, most
     * others only `error`. Check both before falling back to the status code.
     */
    private fun extractMessage(text: String): String? = runCatching {
        val obj = json.parseToJsonElement(text).jsonObject
        (obj["error"] ?: obj["message"])?.jsonPrimitive?.content
    }.getOrNull()
}

inline fun <reified T> ApiClient.decode(text: String): ApiResult<T> = try {
    ApiResult.Success(json.decodeFromString<T>(text))
} catch (e: Exception) {
    ApiResult.Failure(
        ApiError(ErrorKind.Parse, "The server sent a response the app could not read.")
    )
}

suspend inline fun <reified T> ApiClient.getJson(path: String): ApiResult<T> =
    when (val result = send("GET", path)) {
        is ApiResult.Success -> decode(result.data)
        is ApiResult.Failure -> result
    }

suspend inline fun <reified T> ApiClient.postJson(
    path: String,
    bodyJson: String,
): ApiResult<T> =
    when (val result = send("POST", path, jsonBody(bodyJson))) {
        is ApiResult.Success -> decode(result.data)
        is ApiResult.Failure -> result
    }

suspend inline fun <reified T> ApiClient.patchJson(
    path: String,
    bodyJson: String,
): ApiResult<T> =
    when (val result = send("PATCH", path, jsonBody(bodyJson))) {
        is ApiResult.Success -> decode(result.data)
        is ApiResult.Failure -> result
    }
