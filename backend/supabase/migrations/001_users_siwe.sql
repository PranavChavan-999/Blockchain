-- UGF Badge — wallet auth (SIWE + JWT)
-- Run in Supabase → SQL Editor (safe to re-run)

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

-- Backend uses service role key (bypasses RLS).
