package com.example.codeundercover_1

import android.app.Application
import android.content.Context
import com.example.codeundercover_1.data.net.ApiClient
import com.example.codeundercover_1.data.net.PersistentCookieJar
import com.example.codeundercover_1.data.net.SettingsStore
import com.example.codeundercover_1.data.repo.AuthRepository
import com.example.codeundercover_1.data.repo.CompilerRepository
import com.example.codeundercover_1.data.repo.DailyChallengeRepository
import com.example.codeundercover_1.data.repo.MissionRepository
import com.example.codeundercover_1.data.repo.ProfileRepository
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async

class CodeUndercoverApp : Application() {
    override fun onCreate() {
        super.onCreate()
        ServiceLocator.init(this)
    }
}

/**
 * Hand-rolled dependency graph.
 *
 * The app has exactly one object graph and no build-time codegen, so a service
 * locator keeps the wiring readable without adding Hilt's annotation processor
 * and its build cost.
 */
object ServiceLocator {

    lateinit var appScope: CoroutineScope
        private set
    lateinit var settings: SettingsStore
        private set
    lateinit var cookieJar: PersistentCookieJar
        private set
    lateinit var api: ApiClient
        private set

    lateinit var auth: AuthRepository
        private set
    lateinit var missions: MissionRepository
        private set
    lateinit var compiler: CompilerRepository
        private set
    lateinit var daily: DailyChallengeRepository
        private set
    lateinit var profile: ProfileRepository
        private set

    private lateinit var warmUp: Deferred<Unit>

    fun init(context: Context) {
        if (::api.isInitialized) return

        appScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        settings = SettingsStore(context.applicationContext)
        cookieJar = PersistentCookieJar(settings, appScope)
        api = ApiClient(settings, cookieJar)

        auth = AuthRepository(api)
        missions = MissionRepository(api)
        compiler = CompilerRepository(api)
        daily = DailyChallengeRepository(api)
        profile = ProfileRepository(api)

        // Cookies live on disk; until they are back in memory the app would
        // look signed out even with a perfectly valid session. The splash
        // screen awaits this before deciding where to send the user.
        warmUp = appScope.async { cookieJar.warmUp() }
    }

    /** Suspends until persisted cookies have been restored. */
    suspend fun awaitReady() {
        warmUp.await()
    }
}
