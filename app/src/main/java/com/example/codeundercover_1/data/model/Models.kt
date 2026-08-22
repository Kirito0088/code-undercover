package com.example.codeundercover_1.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/*
 * Wire models mirroring the Next.js API exactly. Field names match the JSON the
 * server already sends — nothing here asks the backend to change.
 *
 * Nearly every field is nullable with a default. The API omits keys rather than
 * sending nulls (`explicitNulls = false` on the server side too), and several
 * routes return different subsets of the same object depending on the branch
 * taken, so tolerating absence is the correct posture rather than sloppiness.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

@Serializable
data class CsrfResponse(val csrfToken: String)

/**
 * NextAuth answers the credentials callback with 200 and a URL even when the
 * password was wrong — the failure is encoded as `?error=CredentialsSignin` in
 * that URL, not as a status code.
 */
@Serializable
data class SignInResponse(val url: String? = null)

@Serializable
data class SessionUser(
    val id: String? = null,
    val name: String? = null,
    val email: String? = null,
    val username: String? = null,
    val image: String? = null,
    val hasSeenIntro: Boolean = false,
)

@Serializable
data class SessionResponse(
    val user: SessionUser? = null,
    val expires: String? = null,
)

@Serializable
data class RegisterRequest(
    val name: String,
    val username: String,
    val email: String,
    val password: String,
    val preferredLanguage: String = "C",
)

@Serializable
data class RegisteredUser(
    val id: String? = null,
    val email: String? = null,
    val name: String? = null,
    val username: String? = null,
)

@Serializable
data class RegisterResponse(
    val user: RegisteredUser? = null,
    val message: String? = null,
)

@Serializable
data class CheckUserResponse(val exists: Boolean = false)

@Serializable
data class ForgotPasswordRequest(val email: String)

@Serializable
data class ResetPasswordRequest(val token: String, val password: String)

@Serializable
data class SimpleAck(
    val ok: Boolean = false,
    val success: Boolean = false,
    val message: String? = null,
    val error: String? = null,
)

// ─── Missions ────────────────────────────────────────────────────────────────

/** Matches `DashboardMission` produced by `getDashboardMissions`. */
@Serializable
data class MissionSummary(
    val id: String,
    val order: Int = 0,
    val title: String = "",
    val description: String = "",
    val difficulty: String = "EASY",
    val language: String = "C",
    val type: String = "standard",
    val goal: String? = null,
    val auraReward: Int = 100,
    /** LOCKED | ACTIVE | COMPLETED */
    val status: String = "LOCKED",
)

@Serializable
data class MissionDetail(
    val id: String,
    val order: Int = 0,
    val title: String = "",
    val description: String = "",
    val briefing: String = "",
    val difficulty: String = "EASY",
    val language: String = "C",
    val type: String = "standard",
    val goal: String? = null,
    val startingCode: String? = null,
    val auraReward: Int = 100,
    /** JSON string of [TeachingSlide]; parsed lazily, see MissionContent. */
    val teachingContent: String? = null,
    /** JSON string of [McqQuestion]. */
    val mcqContent: String? = null,
    /** The user's own progress, when the endpoint includes it. */
    val phase: String? = null,
    val status: String? = null,
    val hintsUsed: Int = 0,
    val submittedCode: String? = null,
)

/** Decoded from `MissionDetail.teachingContent`. */
@Serializable
data class TeachingSlide(
    val title: String = "",
    val content: List<String> = emptyList(),
)

/**
 * Decoded from `MissionDetail.mcqContent`. `correctIndex` really is sent to the
 * client — the web app grades the quiz locally too, so this is parity, not a
 * leak the Android app introduces.
 */
@Serializable
data class McqQuestion(
    val id: Int = 0,
    val question: String = "",
    val options: List<String> = emptyList(),
    val correctIndex: Int = 0,
)

@Serializable
data class AcceptMissionRequest(val missionId: String)

@Serializable
data class AcceptMissionResponse(
    val message: String? = null,
    val redirect: String? = null,
)

@Serializable
data class PhaseRequest(val missionId: String, val phase: String)

@Serializable
data class PhaseResponse(
    val success: Boolean = false,
    val phase: String? = null,
)

@Serializable
data class HintRequest(val missionId: String)

@Serializable
data class HintResponse(
    val success: Boolean = false,
    val hintsUsed: Int = 0,
    val hint: String? = null,
)

@Serializable
data class HistoryEntry(
    val id: String = "",
    val missionId: String = "",
    val missionOrder: Int = 0,
    val missionTitle: String = "",
    val difficulty: String = "EASY",
    val language: String = "C",
    val auraReward: Int = 0,
    val submittedCode: String? = null,
    val attemptCount: Int = 0,
    val hintsUsed: Int = 0,
    val innovationUnlocked: Boolean = false,
    val completedAt: String? = null,
)

@Serializable
data class HistoryResponse(val history: List<HistoryEntry> = emptyList())

// ─── Compiler ────────────────────────────────────────────────────────────────

@Serializable
data class CompilerDiagnostic(
    val line: Int? = null,
    val column: Int? = null,
    /** error | warning | note */
    val type: String? = null,
    val message: String? = null,
)

@Serializable
data class CompileRequest(val code: String, val input: String = "")

/** Mirrors `CompileExecutionResult` in `lib/compiler.ts`. */
@Serializable
data class CompileResponse(
    val success: Boolean = false,
    val output: String? = null,
    val compilerError: String? = null,
    val diagnostics: List<CompilerDiagnostic> = emptyList(),
    val errors: String? = null,
    val explanation: String? = null,
    val exitCode: Int? = null,
    val executionTimeMs: Long = 0,
    /**
     * Judge0 itself failed. Kept distinct so the UI never tells someone to fix
     * code that was never compiled.
     */
    val serviceUnavailable: Boolean = false,
    val error: String? = null,
)

// ─── Mission validation (submit) ─────────────────────────────────────────────

@Serializable
data class ValidateRequest(
    val missionId: String,
    val code: String,
    val input: String = "",
)

@Serializable
data class ValidateResponse(
    val success: Boolean = false,
    val stdout: String = "",
    val stderr: String = "",
    val warnings: List<CompilerDiagnostic> = emptyList(),
    val diagnostics: List<CompilerDiagnostic> = emptyList(),
    val explanation: String? = null,
    val validationErrors: List<String> = emptyList(),
    val ruleDescription: String? = null,
    val earnedAura: Int = 0,
    val innovationUnlocked: Boolean = false,
    val innovationReason: String? = null,
    val comboBonus: Int = 0,
    val comboStreak: Int = 0,
    val executionTimeMs: Long = 0,
    val isReplay: Boolean = false,
    val wouldHaveEarnedAura: Int? = null,
    val serviceUnavailable: Boolean = false,
)

// ─── Daily challenge ─────────────────────────────────────────────────────────

@Serializable
data class DailyQuestion(
    val id: String = "",
    val question: String = "",
    val options: List<String> = emptyList(),
)

@Serializable
data class DailyQuestionResponse(
    val success: Boolean = false,
    val question: DailyQuestion? = null,
    val error: String? = null,
)

@Serializable
data class DailyAnswerRequest(val questionId: String, val answer: String)

@Serializable
data class DailyAnswerResponse(
    val success: Boolean = false,
    val isCorrect: Boolean = false,
    val explanation: String = "",
    val correctAnswer: String = "",
    val earnedAura: Int = 0,
)

// ─── Profile & progression ───────────────────────────────────────────────────

@Serializable
data class ProfileUpdateRequest(
    val name: String? = null,
    val email: String? = null,
    val username: String? = null,
    val image: String? = null,
)

@Serializable
data class ProfileUser(
    val name: String? = null,
    val email: String? = null,
    val username: String? = null,
    val image: String? = null,
)

@Serializable
data class ProfileUpdateResponse(
    val success: Boolean = false,
    val user: ProfileUser? = null,
    val message: String? = null,
)

/**
 * The agent's progression record. Backed by the `User` row — aura, level,
 * streak and badge counts all live there.
 */
@Serializable
data class AgentStats(
    val id: String = "",
    val name: String? = null,
    val username: String? = null,
    val email: String? = null,
    val image: String? = null,
    val auraPoints: Int = 0,
    val auraLevel: Int = 1,
    val missionsCompleted: Int = 0,
    val foxBadges: Int = 0,
    val comboStreak: Int = 0,
    val maxCombo: Int = 0,
    val preferredLanguage: String = "C",
    val hasSeenIntro: Boolean = false,
    /** Total missions in the catalogue, for percent-complete. */
    val totalMissions: Int = 0,
)

@Serializable
data class LeaderboardPlayer(
    val id: String = "",
    val name: String = "",
    val username: String = "",
    val auraPoints: Int = 0,
    val auraLevel: Int = 1,
    val foxBadges: Int = 0,
    val missionsCompleted: Int = 0,
    val completionPercent: Int = 0,
    val rankTier: String = "Panda",
    val image: String? = null,
)

@Serializable
data class LeaderboardResponse(
    val players: List<LeaderboardPlayer> = emptyList(),
    @SerialName("currentUserId") val currentUserId: String? = null,
)
