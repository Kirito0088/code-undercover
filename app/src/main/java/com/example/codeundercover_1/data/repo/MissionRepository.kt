package com.example.codeundercover_1.data.repo

import com.example.codeundercover_1.data.model.AcceptMissionRequest
import com.example.codeundercover_1.data.model.AcceptMissionResponse
import com.example.codeundercover_1.data.model.HintRequest
import com.example.codeundercover_1.data.model.HintResponse
import com.example.codeundercover_1.data.model.HistoryEntry
import com.example.codeundercover_1.data.model.HistoryResponse
import com.example.codeundercover_1.data.model.McqQuestion
import com.example.codeundercover_1.data.model.MissionDetail
import com.example.codeundercover_1.data.model.MissionSummary
import com.example.codeundercover_1.data.model.PhaseRequest
import com.example.codeundercover_1.data.model.PhaseResponse
import com.example.codeundercover_1.data.model.TeachingSlide
import com.example.codeundercover_1.data.model.ValidateRequest
import com.example.codeundercover_1.data.model.ValidateResponse
import com.example.codeundercover_1.data.net.ApiClient
import com.example.codeundercover_1.data.net.ApiResult
import com.example.codeundercover_1.data.net.getJson
import com.example.codeundercover_1.data.net.map
import com.example.codeundercover_1.data.net.postJson

/** The three stages a mission moves through, mirroring `UserMission.phase`. */
enum class MissionPhase { TEACHING, MCQ, CODING;

    companion object {
        fun from(raw: String?): MissionPhase =
            entries.firstOrNull { it.name == raw?.uppercase() } ?: TEACHING
    }
}

/** Mirrors the status computed by `getDashboardMissions`. */
enum class MissionStatus { LOCKED, ACTIVE, COMPLETED;

    companion object {
        fun from(raw: String?): MissionStatus =
            entries.firstOrNull { it.name == raw?.uppercase() } ?: LOCKED
    }
}

class MissionRepository(private val api: ApiClient) {

    // ─── Reads ───────────────────────────────────────────────────────────────
    //
    // NOTE: the two calls below target endpoints that do not exist on `main`
    // yet. The web app renders the levels board and mission detail from React
    // Server Components that query Prisma directly, so there is no REST route
    // to reuse. See task #7 — these are additive, read-only routes.

    suspend fun missions(): ApiResult<List<MissionSummary>> =
        api.getJson<List<MissionSummary>>("/api/missions")

    suspend fun mission(missionId: String): ApiResult<MissionDetail> =
        api.getJson("/api/missions/$missionId")

    // ─── Existing endpoints ──────────────────────────────────────────────────

    suspend fun accept(missionId: String): ApiResult<AcceptMissionResponse> {
        val payload = api.json.encodeToString(AcceptMissionRequest(missionId))
        return api.postJson("/api/missions/accept", payload)
    }

    suspend fun setPhase(missionId: String, phase: MissionPhase): ApiResult<MissionPhase> {
        val payload = api.json.encodeToString(PhaseRequest(missionId, phase.name))
        return api.postJson<PhaseResponse>("/api/missions/phase", payload)
            .map { MissionPhase.from(it.phase) }
    }

    /**
     * Hints are capped at five server-side and each one costs aura, so the UI
     * must surface `hintsUsed` rather than let someone tap blindly.
     */
    suspend fun requestHint(missionId: String): ApiResult<HintResponse> {
        val payload = api.json.encodeToString(HintRequest(missionId))
        return api.postJson("/api/missions/hint", payload)
    }

    suspend fun submit(
        missionId: String,
        code: String,
        input: String = "",
    ): ApiResult<ValidateResponse> {
        val payload = api.json.encodeToString(ValidateRequest(missionId, code, input))
        return api.postJson("/api/missions/validate", payload)
    }

    suspend fun history(): ApiResult<List<HistoryEntry>> =
        api.getJson<HistoryResponse>("/api/missions/history").map { it.history }

    // ─── Embedded JSON payloads ──────────────────────────────────────────────
    //
    // `teachingContent` and `mcqContent` are stored as JSON *strings* inside
    // the Mission row rather than as structured columns, so they need a second
    // decode pass. Malformed content degrades to an empty list instead of
    // taking the whole mission screen down.

    fun teachingSlides(detail: MissionDetail): List<TeachingSlide> =
        detail.teachingContent
            ?.let { runCatching { api.json.decodeFromString<List<TeachingSlide>>(it) }.getOrNull() }
            ?: emptyList()

    fun mcqQuestions(detail: MissionDetail): List<McqQuestion> =
        detail.mcqContent
            ?.let { runCatching { api.json.decodeFromString<List<McqQuestion>>(it) }.getOrNull() }
            ?: emptyList()
}
