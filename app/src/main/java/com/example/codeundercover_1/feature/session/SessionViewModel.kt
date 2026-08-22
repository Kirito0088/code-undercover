package com.example.codeundercover_1.feature.session

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.codeundercover_1.ServiceLocator
import com.example.codeundercover_1.data.model.SessionUser
import com.example.codeundercover_1.data.net.ApiError
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.ErrorKind
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed interface SessionState {
    data object Loading : SessionState
    data object SignedOut : SessionState
    data class SignedIn(val user: SessionUser) : SessionState

    /**
     * Distinct from [SignedOut]: the backend could not be reached at all, so we
     * must not wipe the session or dump the user on a login form they cannot
     * complete. The UI offers the server-settings screen instead.
     */
    data class Unreachable(val error: ApiError) : SessionState
}

/**
 * Single source of truth for "who is signed in", hoisted to the activity so
 * every screen observes the same session rather than each re-querying it.
 */
class SessionViewModel : ViewModel() {

    private val auth = ServiceLocator.auth

    private val _state = MutableStateFlow<SessionState>(SessionState.Loading)
    val state: StateFlow<SessionState> = _state.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _state.value = SessionState.Loading
            // Cookies are restored from disk asynchronously at startup; asking
            // the server before that lands would report a signed-in user as
            // anonymous.
            ServiceLocator.awaitReady()

            _state.value = when (val result = auth.currentSession()) {
                is ApiResult.Success -> result.data
                    ?.let { SessionState.SignedIn(it) }
                    ?: SessionState.SignedOut

                is ApiResult.Failure -> when (result.error.kind) {
                    ErrorKind.Network, ErrorKind.Server ->
                        SessionState.Unreachable(result.error)

                    else -> SessionState.SignedOut
                }
            }
        }
    }

    fun onAuthenticated(user: SessionUser) {
        _state.value = SessionState.SignedIn(user)
    }

    /** Reflects a locally-known change (e.g. intro completed) without a refetch. */
    fun updateUser(transform: (SessionUser) -> SessionUser) {
        val current = _state.value
        if (current is SessionState.SignedIn) {
            _state.value = SessionState.SignedIn(transform(current.user))
        }
    }

    fun signOut() {
        viewModelScope.launch {
            auth.signOut()
            _state.value = SessionState.SignedOut
        }
    }
}
