-- ============================================================
-- VICTARC — Admin Actions Logger Table Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create admin_actions table
create table if not exists public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  action text not null check (action in ('approve', 'reject')),
  request_id uuid references public.payment_requests(id) on delete cascade,
  performed_via text not null check (performed_via in ('email_link', 'dashboard')),
  performed_at timestamptz default now() not null
);

-- Enable RLS on admin_actions
alter table public.admin_actions enable row level security;

-- Drop existing policy if it exists
drop policy if exists "Admins can view admin actions" on public.admin_actions;
create policy "Admins can view admin actions"
on public.admin_actions for select
to authenticated
using (
  exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  )
);

-- Drop existing policy if it exists
drop policy if exists "Admins can insert admin actions" on public.admin_actions;
create policy "Admins can insert admin actions"
on public.admin_actions for insert
to authenticated
with check (
  exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  )
);
