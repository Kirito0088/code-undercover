-- Migration: normalize_mission_status
-- Purpose: Normalize any legacy status values to the canonical vocabulary
--          and fix mission difficulties for existing DB rows.
-- Safety: Idempotent — safe to run multiple times.

-- Normalize any legacy status values that may exist from older code paths
UPDATE "UserMission"
SET status = 'ACTIVE'
WHERE status IN ('UNLOCKED', 'IN_PROGRESS');

-- Normalize mission difficulties for existing Mission rows
-- All missions should be EASY — they map to BEGINNER_CURRICULUM in LevelsClient.
UPDATE "Mission"
SET difficulty = 'EASY'
WHERE difficulty IN ('MEDIUM', 'HARD');
