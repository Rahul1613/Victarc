-- ============================================================
-- VICTARC — Monetization System Schema Migration
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add payment columns to the public.users table
alter table public.users add column if not exists plan text default 'demo' not null;
alter table public.users add column if not exists payment_id text;
alter table public.users add column if not exists paid_at timestamptz;

-- 2. Add constraint to enforce plan values
alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check check (plan in ('demo', 'basic', 'premium'));

-- 3. Row Level Security policies check
-- By default, "Users can update own profile" is active, which is fine.
-- The service role key used in backend API routes automatically bypasses RLS policies to update plans.
