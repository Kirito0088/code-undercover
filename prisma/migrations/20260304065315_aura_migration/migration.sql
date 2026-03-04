-- Rename User columns to preserve existing data safely
ALTER TABLE "User" RENAME COLUMN "xp" TO "auraPoints";
ALTER TABLE "User" RENAME COLUMN "level" TO "auraLevel";
ALTER TABLE "User" ADD COLUMN "missionsCompleted" INTEGER NOT NULL DEFAULT 0;

-- Rename Mission reward columns
ALTER TABLE "Mission" RENAME COLUMN "xpReward" TO "auraReward";
