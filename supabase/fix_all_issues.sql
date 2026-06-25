-- ============================================================
-- VICTARC — FULL FIX MIGRATION SCRIPT
-- Run this entire script in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- FIX 1: Add missing columns (safe, won't error if they exist)
-- ============================================================
alter table public.completions 
  add column if not exists proof_image_url text,
  add column if not exists status text default 'pending';

-- Add check constraint if not exists
do $$ 
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'completions_status_check'
  ) then
    alter table public.completions 
      add constraint completions_status_check 
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- ============================================================
-- FIX 2: Update existing completions that have null status
-- (old completions before the update should be approved)
-- ============================================================
update public.completions 
set status = 'approved' 
where status is null;

-- ============================================================
-- FIX 3: Fix leaderboard view to only count approved completions
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
    count(c.id) filter (where c.status = 'approved') as total_completions,
    row_number() over (order by u.xp desc) as position
  from public.users u
  left join public.completions c on c.user_id = u.id
  group by u.id
  order by u.xp desc;

-- ============================================================
-- FIX 4: Drop and recreate all RLS policies cleanly
-- ============================================================

-- USERS table policies
drop policy if exists "Users are publicly readable" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Admins can insert users" on public.users;
drop policy if exists "Admins can update users" on public.users;
drop policy if exists "Admins can delete users" on public.users;
drop policy if exists "Admins have full access on users" on public.users;

create policy "Users are publicly readable" on public.users
  for select using (true);

create policy "Users can insert own profile" on public.users
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.users
  for update using (auth.uid() = id);

create policy "Admins can update any user" on public.users
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete any user" on public.users
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- CHALLENGES table policies
drop policy if exists "Challenges are publicly readable" on public.challenges;
drop policy if exists "Admins have full access on challenges" on public.challenges;
drop policy if exists "Admins can insert challenges" on public.challenges;
drop policy if exists "Admins can update challenges" on public.challenges;
drop policy if exists "Admins can delete challenges" on public.challenges;

create policy "Challenges are publicly readable" on public.challenges
  for select using (true);

create policy "Admins can insert challenges" on public.challenges
  for insert with check (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Admins can update challenges" on public.challenges
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete challenges" on public.challenges
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- COMPLETIONS table policies
drop policy if exists "Completions are publicly readable" on public.completions;
drop policy if exists "Users can insert own completions" on public.completions;
drop policy if exists "Admins have full access on completions" on public.completions;
drop policy if exists "Admins have access on completions" on public.completions;
drop policy if exists "Users can update own completions" on public.completions;

create policy "Completions are publicly readable" on public.completions
  for select using (true);

create policy "Users can insert own completions" on public.completions
  for insert with check (auth.uid() = user_id);

create policy "Admins can update completions" on public.completions
  for update using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

create policy "Admins can delete completions" on public.completions
  for delete using (
    exists (select 1 from public.users where id = auth.uid() and is_admin = true)
  );

-- ============================================================
-- FIX 5: Recreate the XP approval trigger (fixes XP not awarded)
-- ============================================================
create or replace function public.handle_completion_approval()
returns trigger as $$
declare
  v_old_xp integer;
  v_new_xp integer;
  v_new_rank text;
  v_new_level integer;
  v_new_streak integer;
  v_last_active date;
  v_today date;
  v_yesterday date;
begin
  -- Only fire when status changes from 'pending' to 'approved'
  if (TG_OP = 'UPDATE' and old.status = 'pending' and new.status = 'approved') then
    
    -- Get current user stats
    select xp, last_active, streak
    into v_old_xp, v_last_active, v_new_streak
    from public.users
    where id = new.user_id;

    -- Calculate new XP
    v_new_xp := coalesce(v_old_xp, 0) + new.xp_earned;
    
    -- Calculate new level (1 level per 100 XP)
    v_new_level := floor(v_new_xp / 100) + 1;
    
    -- Calculate new rank based on XP thresholds
    if v_new_xp >= 50000 then v_new_rank := 'SSS';
    elsif v_new_xp >= 20000 then v_new_rank := 'SS';
    elsif v_new_xp >= 10000 then v_new_rank := 'S';
    elsif v_new_xp >= 5000 then v_new_rank := 'A';
    elsif v_new_xp >= 2500 then v_new_rank := 'B';
    elsif v_new_xp >= 1200 then v_new_rank := 'C';
    elsif v_new_xp >= 500 then v_new_rank := 'D';
    else v_new_rank := 'E';
    end if;

    -- Streak logic
    v_today := current_date;
    v_yesterday := current_date - 1;

    if v_last_active = v_today then
      -- Already active today, streak unchanged
      null;
    elsif v_last_active = v_yesterday then
      -- Active yesterday, increment streak
      v_new_streak := coalesce(v_new_streak, 0) + 1;
    else
      -- Streak broken, restart at 1
      v_new_streak := 1;
    end if;

    -- Update user profile with new stats
    update public.users
    set 
      xp = v_new_xp,
      rank = v_new_rank,
      level = v_new_level,
      streak = v_new_streak,
      last_active = v_today
    where id = new.user_id;

  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate the trigger
drop trigger if exists on_completion_approved on public.completions;

create trigger on_completion_approved
  after update on public.completions
  for each row execute procedure public.handle_completion_approval();

-- ============================================================
-- FIX 6: Reload Supabase API schema cache
-- ============================================================
notify pgrst, 'reload schema';

-- ============================================================
-- DONE! All fixes applied successfully.
-- ============================================================
