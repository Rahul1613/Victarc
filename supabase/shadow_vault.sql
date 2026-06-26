-- ============================================================
-- VICTARC — Shadow Vault DB Columns and Trigger Update
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add coins and cosmetics columns to public.users table if they do not exist
alter table public.users add column if not exists coins integer default 0 not null;
alter table public.users add column if not exists unlocked_items text[] default '{}'::text[] not null;
alter table public.users add column if not exists unlocked_badges text[] default '{}'::text[] not null;

-- 2. Re-define handle_completion_approval to award Victarc Coins dynamically
create or replace function public.handle_completion_approval()
returns trigger as $$
declare
  old_xp integer;
  new_xp integer;
  old_rank text;
  new_rank text;
  new_level integer;
  new_streak integer;
  last_active_date date;
  today_date date;
  yesterday_date date;
  coins_earned integer;
begin
  -- Only execute if status changed from 'pending' to 'approved'
  if (old.status = 'pending' and new.status = 'approved') then
    -- Get current user stats
    select xp, rank, last_active, streak
    into old_xp, old_rank, last_active_date, new_streak
    from public.users
    where id = new.user_id;

    -- Calculate new XP
    new_xp := old_xp + new.xp_earned;
    
    -- Calculate new level (1 level per 100 XP)
    new_level := floor(new_xp / 100) + 1;
    
    -- Calculate new rank
    if new_xp >= 50000 then new_rank := 'SSS';
    elsif new_xp >= 20000 then new_rank := 'SS';
    elsif new_xp >= 10000 then new_rank := 'S';
    elsif new_xp >= 5000 then new_rank := 'A';
    elsif new_xp >= 2500 then new_rank := 'B';
    elsif new_xp >= 1200 then new_rank := 'C';
    elsif new_xp >= 500 then new_rank := 'D';
    else new_rank := 'E';
    end if;

    -- Streak logic
    today_date := current_date;
    yesterday_date := current_date - 1;

    if last_active_date = today_date then
      -- Streak remains unchanged
      null;
    elsif last_active_date = yesterday_date then
      -- Increment streak
      new_streak := new_streak + 1;
    else
      -- Streak broken / restart at 1
      new_streak := 1;
    end if;

    -- Calculate coins earned based on XP reward
    if new.xp_earned < 100 then
      coins_earned := 50;
    elsif new.xp_earned < 200 then
      coins_earned := 150;
    elsif new.xp_earned < 300 then
      coins_earned := 300;
    else
      coins_earned := 500;
    end if;

    -- Update the user profile
    update public.users
    set 
      xp = new_xp,
      rank = new_rank,
      level = new_level,
      streak = new_streak,
      last_active = today_date,
      coins = coins + coins_earned
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;
