-- Migration: normalize_mission_status
-- Purpose: Normalize any legacy status values to the canonical vocabulary.
-- Safety: Idempotent — safe to run multiple times.

-- Normalize any legacy status values that may exist from older code paths
UPDATE "UserMission"
SET status = 'ACTIVE'
WHERE status IN ('UNLOCKED', 'IN_PROGRESS');

-- NOTE: Difficulty is intentionally NOT normalized here. The curriculum
-- ships 20 EASY / 20 MEDIUM / 20 HARD missions mapped to the ALPHA/BETA/GAMMA
-- tracks in LevelsClient; forcing EASY would break that mapping.
