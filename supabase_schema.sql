-- =======================================================
-- SUPABASE SCHEMA SETUP FOR LOCALPULSE NOTICE BOARD APP
-- =======================================================
-- Run this script in the Supabase SQL Editor dashboard.

-- 1. Create Notices Table
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

-- 2. Enable Row Level Security (RLS)
-- Crucial for Supabase security protocols
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- 3. Create Access Policy Rules for Anonymous / Public connection
-- Allows the offline-first app to pull and push notice changes without email auth login.

-- RULE A: Enable Read Access (SELECT)
CREATE POLICY "Allow public read access for all notices" 
ON public.notices FOR SELECT 
USING (true);

-- RULE B: Enable Insert Access (INSERT)
CREATE POLICY "Allow public insert access for notices" 
ON public.notices FOR INSERT 
WITH CHECK (true);

-- RULE C: Enable Update Access (UPDATE)
CREATE POLICY "Allow public updates for upvotes and edits" 
ON public.notices FOR UPDATE 
USING (true)
WITH CHECK (true);

-- RULE D: Enable Delete Access (DELETE)
CREATE POLICY "Allow public delete access for moderation" 
ON public.notices FOR DELETE 
USING (true);

-- =======================================================
-- SEED TEMPLATES FOR LOCALPULSE NOTICE BOARD
-- =======================================================
-- Optional: Insert initial community notices into Supabase to start with sample data.

INSERT INTO public.notices (
    id, title, description, category, urgency, author, contact, pinned, upvotes, upvoted_by, created_at, expires_at, area, archived
) VALUES 
(
    'sample_cloud_1',
    'Municipal water leakage near Main Road',
    'Large leakage reported in municipal pipe near Block B gate. Pipeline repair work started. Expect low pressure in evening.',
    'water',
    'important',
    'Warden_Hostel',
    '9876500012',
    false,
    6,
    '{}',
    NOW(),
    NOW() + INTERVAL '2 days',
    'Anna Nagar Colony',
    false
),
(
    'sample_cloud_2',
    'Security warning: Lock main doors at night',
    'Reports of suspicious movement in lane 3. All residents are advised to keep security doors and main gates locked after 10PM.',
    'emergency',
    'urgent',
    'RWA_Security',
    '',
    true,
    14,
    '{}',
    NOW() - INTERVAL '4 hours',
    NOW() + INTERVAL '3 days',
    'Anna Nagar Colony',
    false
);
