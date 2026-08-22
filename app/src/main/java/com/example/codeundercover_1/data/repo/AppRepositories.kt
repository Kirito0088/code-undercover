package com.example.codeundercover_1.data.repo

import com.example.codeundercover_1.data.model.AgentStats
import com.example.codeundercover_1.data.model.CompileRequest
import com.example.codeundercover_1.data.model.CompileResponse
import com.example.codeundercover_1.data.model.DailyAnswerRequest
import com.example.codeundercover_1.data.model.DailyAnswerResponse
import com.example.codeundercover_1.data.model.DailyQuestion
import com.example.codeundercover_1.data.model.DailyQuestionResponse
import com.example.codeundercover_1.data.model.LeaderboardPlayer
import com.example.codeundercover_1.data.model.LeaderboardResponse
import com.example.codeundercover_1.data.model.ProfileUpdateRequest
import com.example.codeundercover_1.data.model.ProfileUpdateResponse
import com.example.codeundercover_1.data.net.ApiClient
import com.example.codeundercover_1.data.net.ApiError
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.ErrorKind
import com.example.codeundercover_1.data.net.getJson
import com.example.codeundercover_1.data.net.map
import com.example.codeundercover_1.data.net.patchJson
import com.example.codeundercover_1.data.net.postJson

/**
 * The scratchpad compiler behind the Debug Lab screen.
 *
 * Server-side limits are mirrored here so the app rejects an oversized payload
 * before spending a round-trip on a guaranteed 400.
 */
class CompilerRepository(private val api: ApiClient) {

    suspend fun run(code: String, input: String = ""): ApiResult<CompileResponse> {
        if (code.isBlank()) {
            return ApiResult.Failure(
                ApiError(ErrorKind.Validation, "There is no code to run.")
            )
        }
        if (code.length > MAX_CODE_LENGTH) {
            return ApiResult.Failure(
                ApiError(ErrorKind.Validation, "Code exceeds the ${MAX_CODE_LENGTH}-character limit.")
            )
        }
        if (input.length > MAX_INPUT_LENGTH) {
            return ApiResult.Failure(
                ApiError(ErrorKind.Validation, "Input exceeds the ${MAX_INPUT_LENGTH}-character limit.")
            )
        }

        val payload = api.json.encodeToString(CompileRequest(code, input))
        return api.postJson("/api/compiler/run", payload)
    }

    companion object {
        const val MAX_CODE_LENGTH = 10_000
        const val MAX_INPUT_LENGTH = 5_000
    }
}

class DailyChallengeRepository(private val api: ApiClient) {

    suspend fun question(): ApiResult<DailyQuestion?> =
        api.getJson<DailyQuestionResponse>("/api/daily-challenge").map { it.question }

    suspend fun answer(questionId: String, answer: String): ApiResult<DailyAnswerResponse> {
        val payload = api.json.encodeToString(DailyAnswerRequest(questionId, answer))
        return api.postJson("/api/daily-challenge", payload)
    }
}

class ProfileRepository(private val api: ApiClient) {

    /**
     * NOTE: `/api/profile` currently exposes only PATCH and DELETE, and the
     * dashboard/leaderboard pages read Prisma directly from server components.
     * The two GETs below need the additive read routes tracked in task #7.
     */
    suspend fun stats(): ApiResult<AgentStats> = api.getJson("/api/dashboard")

    suspend fun leaderboard(): ApiResult<List<LeaderboardPlayer>> =
        api.getJson<LeaderboardResponse>("/api/leaderboard").map { it.players }

    suspend fun update(
        name: String? = null,
        email: String? = null,
        username: String? = null,
        image: String? = null,
    ): ApiResult<ProfileUpdateResponse> {
        val payload = api.json.encodeToString(
            ProfileUpdateRequest(
                name = name,
                email = email,
                username = username,
                image = image,
            )
        )
        return api.patchJson("/api/profile", payload)
    }

    /** Irreversible: deletes the account and clears the session server-side. */
    suspend fun deleteAccount(): ApiResult<Unit> =
        when (val result = api.send("DELETE", "/api/profile")) {
            is ApiResult.Success -> {
                api.cookieJar.clear()
                ApiResult.Success(Unit)
            }

            is ApiResult.Failure -> result
        }
}
