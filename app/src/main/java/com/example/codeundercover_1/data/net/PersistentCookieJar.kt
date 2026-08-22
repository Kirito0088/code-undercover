package com.example.codeundercover_1.data.net

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import java.util.concurrent.ConcurrentHashMap

@Serializable
private data class StoredCookie(val origin: String, val setCookie: String)

/**
 * NextAuth authenticates with an httpOnly cookie, not a bearer token, so the
 * session *is* the cookie jar. Persisting it is what keeps a user signed in
 * across app restarts.
 *
 * OkHttp's [CookieJar] is synchronous while DataStore is suspending, so reads
 * are served from an in-memory map and writes are mirrored to disk on a
 * background scope. [warmUp] must run before the first request or the app will
 * come up signed out despite having a valid session on disk.
 */
class PersistentCookieJar(
    private val settings: SettingsStore,
    private val scope: CoroutineScope,
) : CookieJar {

    /** host -> cookies for that host. */
    private val cache = ConcurrentHashMap<String, MutableList<Cookie>>()

    private val json = Json { ignoreUnknownKeys = true }

    suspend fun warmUp() {
        val raw = settings.readCookies() ?: return
        val stored = runCatching {
            json.decodeFromString<List<StoredCookie>>(raw)
        }.getOrNull() ?: return

        for (entry in stored) {
            val url = entry.origin.toHttpUrlOrNull() ?: continue
            val cookie = Cookie.parse(url, entry.setCookie) ?: continue
            if (cookie.hasExpired()) continue
            cache.getOrPut(url.host) { mutableListOf() }.addCookie(cookie)
        }
    }

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        if (cookies.isEmpty()) return
        val bucket = cache.getOrPut(url.host) { mutableListOf() }
        synchronized(bucket) {
            cookies.forEach { bucket.addCookie(it) }
        }
        persist()
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val bucket = cache[url.host] ?: return emptyList()
        val valid: List<Cookie>
        synchronized(bucket) {
            bucket.removeAll { it.hasExpired() }
            valid = bucket.filter { it.matches(url) }
        }
        return valid
    }

    /** Drops every cookie — used on sign-out and on backend switch. */
    fun clear() {
        cache.clear()
        scope.launch { settings.clearCookies() }
    }

    /**
     * True when a NextAuth session cookie is present. Lets the splash screen
     * skip a network round-trip when the user was never signed in.
     */
    fun hasSessionCookie(): Boolean = cache.values.any { bucket ->
        synchronized(bucket) {
            bucket.any { it.name.endsWith("next-auth.session-token") && !it.hasExpired() }
        }
    }

    private fun persist() {
        val snapshot = buildList {
            cache.forEach { (host, bucket) ->
                val copy = synchronized(bucket) { bucket.toList() }
                copy.forEach { cookie ->
                    val scheme = if (cookie.secure) "https" else "http"
                    add(StoredCookie("$scheme://$host/", cookie.toString()))
                }
            }
        }
        scope.launch {
            runCatching { settings.writeCookies(json.encodeToString(snapshot)) }
        }
    }

    private fun MutableList<Cookie>.addCookie(cookie: Cookie) {
        // A cookie is identified by name+domain+path; a new value replaces the
        // old one rather than stacking up duplicates that OkHttp would then
        // send together.
        removeAll { it.name == cookie.name && it.domain == cookie.domain && it.path == cookie.path }
        if (!cookie.hasExpired()) add(cookie)
    }

    private fun Cookie.hasExpired(): Boolean = expiresAt < System.currentTimeMillis()
}
