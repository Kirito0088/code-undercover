-- Enable Row Level Security (RLS) on all live Prisma-managed tables
-- Since all app access goes through Prisma's direct Postgres connection server-side (which bypasses RLS),
-- enabling RLS with no policies blocks unauthorized public access via Supabase's PostgREST/anon-key API.

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Mission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserMission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DailyQuestion" ENABLE ROW LEVEL SECURITY;

-- Enable RLS on legacy/unused tables created by migration.sql
-- to prevent potential data exposure via PostgREST.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
