-- ============================================================
-- VICTARC — Penalty System Tables & Policies
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Table for tracking daily commitments to challenges
create table if not exists public.committed_quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  challenge_id uuid references public.challenges(id) on delete cascade not null,
  committed_at timestamp default now() not null,
  expires_at timestamp not null,
  status text check (status in ('active', 'completed', 'failed')) default 'active' not null
);

-- Table for tracking active penalties
create table if not exists public.penalty_quests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  issued_at timestamp default now() not null,
  deadline timestamp not null,
  challenge_text text not null,
  xp_loss integer not null,
  status text check (status in ('active', 'completed', 'failed')) default 'active' not null
);

-- Enable Row Level Security (RLS)
alter table public.committed_quests enable row level security;
alter table public.penalty_quests enable row level security;

-- Policies for committed_quests
drop policy if exists "Users can view own committed quests" on public.committed_quests;
create policy "Users can view own committed quests" on public.committed_quests
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own committed quests" on public.committed_quests;
create policy "Users can insert own committed quests" on public.committed_quests
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own committed quests" on public.committed_quests;
create policy "Users can update own committed quests" on public.committed_quests
  for update using (auth.uid() = user_id);

-- Policies for penalty_quests
drop policy if exists "Users can view own penalty quests" on public.penalty_quests;
create policy "Users can view own penalty quests" on public.penalty_quests
  for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own penalty quests" on public.penalty_quests;
create policy "Users can insert own penalty quests" on public.penalty_quests
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own penalty quests" on public.penalty_quests;
create policy "Users can update own penalty quests" on public.penalty_quests
  for update using (auth.uid() = user_id);
