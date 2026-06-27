-- ============================================================
-- VICTARC — Instagram Monarch Feature Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add instagram_handle column to public.users table
alter table public.users add column if not exists instagram_handle text;

-- 2. Drop the existing leaderboard view (so we can change column structure)
drop view if exists public.leaderboard cascade;

-- 3. Recreate the leaderboard view to include the instagram_handle column (enforcing security invoker RLS policies)
create view public.leaderboard with (security_invoker = true) as
  select
    u.id,
    u.username,
    u.rank,
    u.xp,
    u.level,
    u.streak,
    u.avatar_url,
    u.instagram_handle,
    count(c.id) filter (where c.status = 'approved') as total_completions,
    row_number() over (order by u.xp desc) as position
  from public.users u
  left join public.completions c on c.user_id = u.id
  group by u.id, u.instagram_handle
  order by u.xp desc;

-- 3. Reload Supabase PostgREST API schema cache
notify pgrst, 'reload schema';
