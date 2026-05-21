-- Run in Supabase → SQL Editor
-- Prefer: backend/supabase/migrations/001_users_siwe.sql (same users table)

-- ── Users (wallet auth — SIWE + JWT) ────────────────────────────────
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  wallet_address text unique not null,
  username text,
  auth_type text default 'wallet',
  created_at timestamptz default now(),
  last_active timestamptz default now(),
  mockusd_balance numeric default 0,
  eth_balance numeric default 0,
  total_transactions integer default 0,
  total_nfts integer default 0
);

create index if not exists users_wallet_address_idx on public.users (wallet_address);

alter table public.users enable row level security;

-- Backend uses service_role key (bypasses RLS). Optional read policy for anon:
-- create policy "Users read own row" on public.users for select using (true);

-- ── Health checks (connection test) ─────────────────────────────────
create table if not exists public.health_checks (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  status text not null default 'ok'
);

insert into public.health_checks (status)
select 'ok'
where not exists (select 1 from public.health_checks limit 1);

alter table public.health_checks enable row level security;

create policy "Allow public read on health_checks"
  on public.health_checks
  for select
  using (true);
