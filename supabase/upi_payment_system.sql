-- ============================================================
-- VICTARC — UPI & AI Payment Verification Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create payment_requests table
create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  user_email text not null,
  user_name text not null,
  plan text not null check (plan in ('basic', 'premium', 'coins')),
  amount integer not null,
  upi_transaction_id text,
  screenshot_url text not null,
  status text default 'pending' check (status in ('pending', 'pending_manual', 'approved', 'rejected')),
  admin_note text,
  submitted_at timestamptz default now() not null,
  reviewed_at timestamptz,
  verified_by text default 'pending' check (verified_by in ('pending', 'ai', 'ai_flagged', 'manual')) not null,
  ai_confidence integer,
  ai_reason text,
  ai_extracted_txn_id text,
  screenshot_hash text,
  is_flagged_fraud boolean default false not null,
  fraud_reason text,
  coins_amount integer
);

-- 2. Alter public.users table to support payment fields (if not already added)
alter table public.users add column if not exists plan text default 'demo' not null;
alter table public.users add column if not exists payment_id text;
alter table public.users add column if not exists paid_at timestamptz;

-- Add constraint to users plan
alter table public.users drop constraint if exists users_plan_check;
alter table public.users add constraint users_plan_check check (plan in ('demo', 'basic', 'premium'));

-- Enable Row Level Security (RLS) on payment_requests
alter table public.payment_requests enable row level security;

-- 3. Row Level Security policies for payment_requests table
drop policy if exists "Users can insert their own payment requests" on public.payment_requests;
create policy "Users can insert their own payment requests"
on public.payment_requests for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can select their own payment requests" on public.payment_requests;
create policy "Users can select their own payment requests"
on public.payment_requests for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can view all payment requests" on public.payment_requests;
create policy "Admins can view all payment requests"
on public.payment_requests for select
to authenticated
using (
  exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  )
);

drop policy if exists "Admins can update payment requests" on public.payment_requests;
create policy "Admins can update payment requests"
on public.payment_requests for update
to authenticated
using (
  exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  )
);

-- 4. Create public.approve_payment SQL Function
create or replace function public.approve_payment(p_request_id uuid, p_admin_note text)
returns void
language plpgsql
security definer
as $$
declare
  v_plan text;
  v_user_id uuid;
  v_coins_amount integer;
begin
  -- Secure check: only allow execution by admins or the service role
  if auth.role() <> 'service_role' and not exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized: Only administrators can approve payments';
  end if;

  -- Get plan, user_id, and coins_amount from payment_requests
  select plan, user_id, coins_amount 
  into v_plan, v_user_id, v_coins_amount
  from public.payment_requests 
  where id = p_request_id;

  if not found then
    raise exception 'Payment request not found';
  end if;

  -- Update payment_requests status
  update public.payment_requests 
  set 
    status = 'approved',
    admin_note = p_admin_note,
    reviewed_at = now()
  where id = p_request_id;

  -- Update user table
  if v_coins_amount is not null and v_coins_amount > 0 then
    -- It is a coin purchase request: update user's coins balance
    update public.users 
    set coins = coalesce(coins, 0) + v_coins_amount
    where id = v_user_id;
  else
    -- It is a plan upgrade request: update user's plan status
    update public.users 
    set 
      plan = v_plan,
      payment_id = p_request_id::text,
      paid_at = now()
    where id = v_user_id;
  end if;
end;
$$;

-- 5. Create public.reject_payment SQL Function
create or replace function public.reject_payment(p_request_id uuid, p_admin_note text)
returns void
language plpgsql
security definer
as $$
begin
  -- Secure check: only allow execution by admins or the service role
  if auth.role() <> 'service_role' and not exists (
    select 1 from public.users
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Unauthorized: Only administrators can reject payments';
  end if;

  update public.payment_requests 
  set 
    status = 'rejected',
    admin_note = p_admin_note,
    reviewed_at = now()
  where id = p_request_id;
end;
$$;

-- 6. Setup private storage bucket 'payment-proofs'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, '{"image/jpeg", "image/png", "image/webp"}')
on conflict (id) do nothing;

-- Create policies for bucket uploads and downloads
drop policy if exists "Allow authenticated users to upload payment proofs" on storage.objects;
create policy "Allow authenticated users to upload payment proofs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs' 
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Allow users to view their own payment proofs" on storage.objects;
create policy "Allow users to view their own payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs' 
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "Allow admins to view all payment proofs" on storage.objects;
create policy "Allow admins to view all payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs'
  and (
    exists (
      select 1 from public.users
      where id = auth.uid() and is_admin = true
    )
  )
);
