-- ============================================================
-- RISE JOURNAL — Supabase Migration
-- Run this in your Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Extend the existing users table with RISE-specific columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS bio  text DEFAULT 'Progress, not perfection.',
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';

-- 2. Journal entries (one unique entry per user per date)
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  date        date        NOT NULL,
  title       text        NOT NULL DEFAULT '',
  content     text        NOT NULL DEFAULT '',
  images      jsonb       NOT NULL DEFAULT '[]',
  links       jsonb       NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER journal_entries_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 3. User settings
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id                uuid        REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme                  text        NOT NULL DEFAULT 'dark',
  daily_reminder_enabled boolean     NOT NULL DEFAULT false,
  daily_reminder_time    text        NOT NULL DEFAULT '09:00'
);

-- 4. Daily tasks
CREATE TABLE IF NOT EXISTS public.daily_tasks (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  text        text        NOT NULL,
  completed   boolean     NOT NULL DEFAULT false,
  date        date        NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 5. Challenges
CREATE TABLE IF NOT EXISTS public.challenges (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name        text        NOT NULL,
  description text        NOT NULL,
  start_date  date        NOT NULL,
  end_date    date        NOT NULL,
  days_completed integer   NOT NULL DEFAULT 0,
  total_days  integer     NOT NULL,
  status      text        NOT NULL DEFAULT 'active', -- active, completed, abandoned
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at timestamp for daily_tasks
DROP TRIGGER IF EXISTS daily_tasks_updated_at ON public.daily_tasks;
CREATE TRIGGER daily_tasks_updated_at
  BEFORE UPDATE ON public.daily_tasks
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Auto-update updated_at timestamp for challenges
DROP TRIGGER IF EXISTS challenges_updated_at ON public.challenges;
CREATE TRIGGER challenges_updated_at
  BEFORE UPDATE ON public.challenges
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6. Row Level Security
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tasks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges     ENABLE ROW LEVEL SECURITY;

-- journal_entries: users can only access their own entries
DROP POLICY IF EXISTS "Users manage own entries" ON public.journal_entries;
CREATE POLICY "Users manage own entries" ON public.journal_entries
  FOR ALL USING (auth.uid() = user_id);

-- user_settings: users can only access their own settings
DROP POLICY IF EXISTS "Users manage own settings" ON public.user_settings;
CREATE POLICY "Users manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- daily_tasks: users can only access their own tasks
DROP POLICY IF EXISTS "Users manage own tasks" ON public.daily_tasks;
CREATE POLICY "Users manage own tasks" ON public.daily_tasks
  FOR ALL USING (auth.uid() = user_id);

-- challenges: users can only access their own challenges
DROP POLICY IF EXISTS "Users manage own challenges" ON public.challenges;
CREATE POLICY "Users manage own challenges" ON public.challenges
  FOR ALL USING (auth.uid() = user_id);

-- 7. Auto-create settings row and default challenge when a new user row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user_rise()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id) VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  -- Create default Winter Challenge
  INSERT INTO public.challenges (
    user_id, name, description, start_date, end_date, days_completed, total_days, status
  ) VALUES (
    NEW.id, 
    'Winter Challenge', 
    'Complete 30 days of consistent journaling to unlock the Winter Warrior badge!',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0,
    30,
    'active'
  )
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_created_rise_settings ON public.users;
CREATE TRIGGER on_user_created_rise_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_rise();

-- 8. Update the existing handle_new_user trigger to also set name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Daily reminder cron job (runs every hour to check for reminders)
-- Note: This requires pg_cron extension to be enabled in Supabase
-- Uncomment the following lines after enabling pg_cron extension:
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- 
-- SELECT cron.schedule(
--   'daily-reminder-check',
--   '0 * * * *', -- Run every hour
--   $$
--   -- This would need to be implemented as a separate function
--   -- that calls the Edge Function to send emails
--   $$
-- );

-- Alternative: Use external cron service to call the Edge Function
-- Example cron job command:
-- curl -X POST https://your-project.supabase.co/functions/v1/send-daily-reminder \
--   -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
--   -H "Content-Type: application/json" \
--   -d '{"email":"user@example.com","name":"User Name","tasks":[...]}'
