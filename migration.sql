-- ============================================================
-- Code Undercover — Supabase PostgreSQL Migration
-- Paste this entire file into: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ── 1. PROFILES (mirrors auth.users — created automatically via trigger) ─────

CREATE TABLE IF NOT EXISTS public.profiles (
    id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name                TEXT,
    image               TEXT,
    aura_points         INTEGER     NOT NULL DEFAULT 0,
    aura_level          INTEGER     NOT NULL DEFAULT 1,
    missions_completed  INTEGER     NOT NULL DEFAULT 0,
    fox_badges          INTEGER     NOT NULL DEFAULT 0,
    preferred_language  TEXT        NOT NULL DEFAULT 'C',
    combo_streak        INTEGER     NOT NULL DEFAULT 0,
    max_combo           INTEGER     NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-create a profile row whenever a new Supabase Auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, name, preferred_language)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'C')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── 2. MISSIONS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.missions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "order"             INTEGER     UNIQUE NOT NULL,
    title               TEXT        NOT NULL,
    description         TEXT        NOT NULL DEFAULT '',
    briefing            TEXT        NOT NULL DEFAULT '',
    difficulty          TEXT        NOT NULL DEFAULT 'EASY',
    language            TEXT        NOT NULL DEFAULT 'C',
    type                TEXT        NOT NULL DEFAULT 'standard',
    goal                TEXT,
    starting_code       TEXT,
    aura_reward         INTEGER     NOT NULL DEFAULT 100,
    teaching_content    TEXT,       -- JSON string of teaching slides
    mcq_content         TEXT,       -- JSON string of MCQ questions
    validation_rules    TEXT,       -- JSON: { requiredKeywords, forbiddenPatterns, ... }
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. USER_MISSIONS (progress tracking per user per mission) ─────────────────

CREATE TABLE IF NOT EXISTS public.user_missions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mission_id          UUID        NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    status              TEXT        NOT NULL DEFAULT 'LOCKED',    -- LOCKED | ACTIVE | COMPLETED
    phase               TEXT        NOT NULL DEFAULT 'TEACHING',  -- TEACHING | MCQ | CODING
    hints_used          INTEGER     NOT NULL DEFAULT 0,
    attempt_count       INTEGER     NOT NULL DEFAULT 0,
    innovation_unlocked BOOLEAN     NOT NULL DEFAULT FALSE,
    submitted_code      TEXT,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_missions_user_id    ON public.user_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON public.user_missions(mission_id);

-- ── 4. DAILY_QUESTIONS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_questions (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    question        TEXT        NOT NULL,
    options         TEXT        NOT NULL,   -- JSON array of strings
    correct_answer  TEXT        NOT NULL,
    explanation     TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. ROW LEVEL SECURITY ─────────────────────────────────────────────────────

ALTER TABLE public.profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;

-- Profiles: authenticated users can read all rows (prevents PII exposure to anonymous callers)
DROP POLICY IF EXISTS "Profiles: public read"          ON public.profiles;
DROP POLICY IF EXISTS "Profiles: user update own"      ON public.profiles;

-- react-doctor-disable-next-line supabase-rls-policy-risk
CREATE POLICY "Profiles: auth read"
    ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Profiles: user update own"
    ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Missions: publicly readable
DROP POLICY IF EXISTS "Missions: public read" ON public.missions;
-- react-doctor-disable-next-line supabase-rls-policy-risk
CREATE POLICY "Missions: public read"
    ON public.missions FOR SELECT USING (TRUE);

-- User missions: users can manage only their own rows
DROP POLICY IF EXISTS "UserMissions: read own"   ON public.user_missions;
DROP POLICY IF EXISTS "UserMissions: insert own" ON public.user_missions;
DROP POLICY IF EXISTS "UserMissions: update own" ON public.user_missions;

CREATE POLICY "UserMissions: read own"
    ON public.user_missions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "UserMissions: insert own"
    ON public.user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "UserMissions: update own"
    ON public.user_missions FOR UPDATE USING (auth.uid() = user_id);

-- Daily questions: readable by authenticated users
DROP POLICY IF EXISTS "DailyQ: auth read" ON public.daily_questions;
CREATE POLICY "DailyQ: auth read"
    ON public.daily_questions FOR SELECT USING (auth.role() = 'authenticated');

-- ── 6. updated_at TRIGGERS ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at      ON public.profiles;
DROP TRIGGER IF EXISTS trg_missions_updated_at      ON public.missions;
DROP TRIGGER IF EXISTS trg_user_missions_updated_at ON public.user_missions;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_missions_updated_at
    BEFORE UPDATE ON public.missions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_user_missions_updated_at
    BEFORE UPDATE ON public.user_missions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
