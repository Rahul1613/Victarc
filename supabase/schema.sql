-- ============================================================
-- VICTARC — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text unique not null,
  rank text default 'E' check (rank in ('E','D','C','B','A','S','SS','SSS')),
  xp integer default 0,
  level integer default 1,
  streak integer default 0,
  last_active date,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp default now()
);

create table if not exists public.challenges (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  category text check (category in ('fitness','mindset','discipline','nutrition','social')),
  difficulty text check (difficulty in ('E','D','C','B','A','S')),
  xp_reward integer not null,
  duration_days integer default 1,
  is_boss_challenge boolean default false,
  is_active boolean default true,
  created_at timestamp default now()
);

create table if not exists public.completions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  proof_text text,
  completed_at timestamp default now(),
  xp_earned integer not null
);

-- ============================================================
-- LEADERBOARD VIEW
-- ============================================================

create or replace view public.leaderboard as
  select
    u.id,
    u.username,
    u.rank,
    u.xp,
    u.level,
    u.streak,
    u.avatar_url,
    count(c.id) as total_completions,
    row_number() over (order by u.xp desc) as position
  from public.users u
  left join public.completions c on c.user_id = u.id
  group by u.id
  order by u.xp desc;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.challenges enable row level security;
alter table public.completions enable row level security;

-- Admin authorization helper
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  );
end;
$$ language plpgsql security definer;

-- Users: anyone can read, only owner can update
create policy "Users are publicly readable" on public.users
  for select using (true);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Admins have full access on users" on public.users
  for all using (public.is_admin());

-- Challenges: anyone can read
create policy "Challenges are publicly readable" on public.challenges
  for select using (true);

create policy "Admins have full access on challenges" on public.challenges
  for all using (public.is_admin());

-- Completions: users can read all, insert own
create policy "Completions are publicly readable" on public.completions
  for select using (true);

create policy "Users can insert own completions" on public.completions
  for insert with check (auth.uid() = user_id);

create policy "Admins have full access on completions" on public.completions
  for all using (public.is_admin());

-- ============================================================
-- TRIGGER: Auto-create user row on sign-up
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED DATA: Challenges
-- ============================================================

insert into public.challenges (title, description, category, difficulty, xp_reward, duration_days) values
('100 Pushups', 'Complete 100 pushups in a single day. Rest between sets as needed. Track your sets to stay consistent.', 'fitness', 'D', 150, 1),
('5km Run', 'Run 5 kilometers without stopping. Pace yourself — finish strong.', 'fitness', 'C', 250, 1),
('No Phone Morning', 'Do not touch your phone for the first 2 hours after waking. Start your day intentionally.', 'discipline', 'E', 100, 1),
('Read 20 Pages', 'Read at least 20 pages of a non-fiction book. Knowledge is power.', 'mindset', 'E', 100, 1),
('10 Min Meditation', 'Sit and meditate for 10 minutes uninterrupted. Focus on your breath.', 'mindset', 'E', 120, 1),
('Cold Shower', 'End your shower with 2 minutes of cold water. Embrace the discomfort.', 'discipline', 'D', 150, 1),
('7-Day Workout Streak', 'Work out every day for 7 consecutive days. Consistency is the key to transformation.', 'fitness', 'B', 800, 7),
('Digital Detox Day', 'No social media for an entire day. Reclaim your attention.', 'discipline', 'C', 300, 1),
('Drink 3L Water', 'Drink 3 liters of water in a single day. Hydration is the foundation.', 'nutrition', 'E', 80, 1),
('BOSS: 30-Day Transformation', 'Complete at least one fitness challenge every day for 30 days. This is your final test.', 'fitness', 'S', 5000, 30)
on conflict do nothing;

update public.challenges set is_boss_challenge = true where difficulty = 'S';
