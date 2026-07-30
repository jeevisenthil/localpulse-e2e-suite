-- =======================================================
-- FULL SUPABASE SCHEMA FOR LOCALPULSE APP
-- =======================================================
-- Run this ENTIRE script in the Supabase SQL Editor.
-- Your 'notices' table already exists, so we use IF NOT EXISTS.

-- 1. Notices Table (already exists - safe to re-run)
CREATE TABLE IF NOT EXISTS public.notices (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    urgency TEXT NOT NULL,
    author TEXT NOT NULL,
    contact TEXT DEFAULT '',
    pinned BOOLEAN DEFAULT FALSE,
    upvotes INTEGER DEFAULT 0,
    upvoted_by TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    area TEXT NOT NULL,
    archived BOOLEAN DEFAULT FALSE
);

-- 2. Users Table (NEW - for login/registration)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Resident',
    verified BOOLEAN DEFAULT FALSE,
    email_otp TEXT,
    phone_otp TEXT,
    reset_otp TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Profile Table (NEW - for user profile settings)
CREATE TABLE IF NOT EXISTS public.profile (
    id SERIAL PRIMARY KEY,
    nickname TEXT NOT NULL DEFAULT 'Resident_101',
    area TEXT NOT NULL DEFAULT 'Anna Nagar Colony',
    role TEXT NOT NULL DEFAULT 'Resident',
    family_size INTEGER DEFAULT 4,
    notification_sound BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT TRUE,
    muted_categories TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN DEFAULT TRUE
);

-- 4. Activities Table (NEW - for activity logs)
CREATE TABLE IF NOT EXISTS public.activities (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL DEFAULT 'profile'
);

-- =======================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =======================================================

ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- =======================================================
-- PUBLIC ACCESS POLICIES (for anonymous app access)
-- =======================================================

-- Notices Policies (may already exist - DROP first to avoid duplicates)
DROP POLICY IF EXISTS "Allow public read access for all notices" ON public.notices;
DROP POLICY IF EXISTS "Allow public insert access for notices" ON public.notices;
DROP POLICY IF EXISTS "Allow public updates for upvotes and edits" ON public.notices;
DROP POLICY IF EXISTS "Allow public delete access for moderation" ON public.notices;

CREATE POLICY "Allow public read access for all notices" ON public.notices FOR SELECT USING (true);
CREATE POLICY "Allow public insert access for notices" ON public.notices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public updates for upvotes and edits" ON public.notices FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access for moderation" ON public.notices FOR DELETE USING (true);

-- Users Policies
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public insert users" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update users" ON public.users FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete users" ON public.users FOR DELETE USING (true);

-- Profile Policies
CREATE POLICY "Allow public read profile" ON public.profile FOR SELECT USING (true);
CREATE POLICY "Allow public insert profile" ON public.profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profile" ON public.profile FOR UPDATE USING (true) WITH CHECK (true);

-- Activities Policies
CREATE POLICY "Allow public read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert activities" ON public.activities FOR INSERT WITH CHECK (true);

-- =======================================================
-- SEED DATA
-- =======================================================

-- Seed default admin and resident users
INSERT INTO public.users (id, username, email, phone, password, role, verified)
VALUES
  ('ADM-1111', 'admin', 'admin@localpulse.com', '9876543210', '123', 'Admin', true),
  ('RES-2222', 'resident', 'resident@localpulse.com', '9876543211', '1234', 'Resident', true)
ON CONFLICT (id) DO NOTHING;

-- Seed default profile
INSERT INTO public.profile (id, nickname, area, role, family_size, notification_sound, daily_digest, onboarding_completed)
VALUES (1, 'Resident_101', 'Anna Nagar Colony', 'Resident', 4, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Seed default activity
INSERT INTO public.activities (id, action, timestamp, type)
VALUES ('act_init', 'LocalPulse Supabase backend initialized. Colony notice board loaded.', NOW(), 'profile')
ON CONFLICT (id) DO NOTHING;

-- Seed additional notices (safe - skips if already exist)
INSERT INTO public.notices (id, title, description, category, urgency, author, contact, pinned, upvotes, created_at, expires_at, area, archived)
VALUES
  ('sample_1', 'Power cut scheduled tomorrow 9AM to 2PM', 'EB maintenance work on the main feeder line. Entire Block C affected.', 'power', 'urgent', 'Admin_RWA', '98765xxxxx', true, 16, NOW() - INTERVAL '2 hours', NOW() + INTERVAL '2 days', 'Anna Nagar Colony', false),
  ('sample_2', 'Water supply disruption 6AM to 10AM', 'Metro Water board pipeline repair. Store enough water tonight.', 'water', 'important', 'Block_Secretary', '', false, 11, NOW() - INTERVAL '5 hours', NOW() + INTERVAL '1 day', 'Anna Nagar Colony', false),
  ('sample_3', 'Community Cleanup Drive Sunday 7AM', 'Join hands for making Anna Nagar cleaner and greener.', 'event', 'normal', 'GreenTeam_Colony', '', false, 7, NOW() - INTERVAL '12 hours', NOW() + INTERVAL '5 days', 'Anna Nagar Colony', false),
  ('sample_4', 'Lost: Black labrador near park Reward Rs.500', 'Lost near park yesterday. Name is Bruno, wearing a brown collar.', 'lost', 'important', 'Flat_4A_Sharma', '9876500000', false, 19, NOW() - INTERVAL '8 hours', NOW() + INTERVAL '3 days', 'Anna Nagar Colony', false),
  ('sample_5', 'Security guard vacancy night shift', 'RWA is looking for an experienced security guard for night shift.', 'jobs', 'normal', 'RWA_Secretary', '', false, 4, NOW() - INTERVAL '24 hours', NOW() + INTERVAL '14 days', 'Anna Nagar Colony', false),
  ('sample_6', 'HP Gas cylinder group booking Friday', 'Doing a bulk booking for the lane to ensure fast delivery.', 'general', 'normal', 'Resident_2B', '', false, 8, NOW() - INTERVAL '18 hours', NOW() + INTERVAL '4 days', 'Anna Nagar Colony', false),
  ('sample_7', 'Streetlight out near Gate 2', 'Streetlight near Gate 2 is flickering and completely off after 10PM.', 'emergency', 'urgent', 'Night_Watchman', '', false, 13, NOW() - INTERVAL '14 hours', NOW() + INTERVAL '3 days', 'Anna Nagar Colony', false)
ON CONFLICT (id) DO NOTHING;
