-- ============================================================
-- VICTARC — Member Ban & Manual Throne Override Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add is_banned, ban_reason, and throne_override columns to public.users table
alter table public.users add column if not exists is_banned boolean default false;
alter table public.users add column if not exists ban_reason text;
alter table public.users add column if not exists throne_override boolean default false;

-- 2. Drop the existing leaderboard view
drop view if exists public.leaderboard cascade;

-- 3. Recreate the leaderboard view with security invoker, filtering out banned users, and ordering by override first
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
    u.throne_override,
    u.is_banned,
    count(c.id) filter (where c.status = 'approved') as total_completions,
    row_number() over (order by u.throne_override desc, u.xp desc) as position
  from public.users u
  left join public.completions c on c.user_id = u.id
  where u.is_banned = false
  group by u.id, u.instagram_handle, u.throne_override, u.is_banned
  order by position asc;

-- 4. Reload PostgREST API schema cache
notify pgrst, 'reload schema';
