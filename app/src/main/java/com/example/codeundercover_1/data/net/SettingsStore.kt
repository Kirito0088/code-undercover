package com.example.codeundercover_1.data.net

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.codeundercover_1.BuildConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "code_undercover_settings"
)

/**
 * Persists the things that must survive a process death: which backend to talk
 * to, and the NextAuth cookies that represent the signed-in session.
 *
 * The base URL is user-editable because there is no fixed production host yet.
 * A dev build points at a laptop running `next dev`; pointing it somewhere else
 * must not require a rebuild.
 */
class SettingsStore(private val context: Context) {

    private val baseUrlKey = stringPreferencesKey("base_url")
    private val cookiesKey = stringPreferencesKey("cookies")

    val baseUrl: Flow<String> = context.dataStore.data.map { prefs ->
        prefs[baseUrlKey]?.takeIf { it.isNotBlank() } ?: BuildConfig.DEFAULT_BASE_URL
    }

    suspend fun currentBaseUrl(): String = baseUrl.first()

    suspend fun setBaseUrl(url: String) {
        context.dataStore.edit { prefs ->
            prefs[baseUrlKey] = normalizeBaseUrl(url)
        }
    }

    suspend fun readCookies(): String? =
        context.dataStore.data.map { it[cookiesKey] }.first()

    suspend fun writeCookies(serialized: String) {
        context.dataStore.edit { prefs -> prefs[cookiesKey] = serialized }
    }

    suspend fun clearCookies() {
        context.dataStore.edit { prefs -> prefs.remove(cookiesKey) }
    }

    companion object {
        /**
         * Accepts what a person would actually type ("192.168.1.5:3000") and
         * turns it into something OkHttp can parse, rather than failing on a
         * missing scheme or a trailing slash.
         */
        fun normalizeBaseUrl(raw: String): String {
            var url = raw.trim().removeSuffix("/")
            if (url.isEmpty()) return BuildConfig.DEFAULT_BASE_URL
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                // Bare hosts default to http, since the only reason to type one
                // is a LAN dev server. A real deployment gets pasted with its
                // scheme included.
                url = "http://$url"
            }
            return url
        }
    }
}
