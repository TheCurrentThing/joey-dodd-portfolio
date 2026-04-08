create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  has_lessons_access boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

alter table public.profiles
  add column if not exists has_lessons_access boolean not null default false;

alter table public.profiles
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.profiles
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

insert into public.profiles (id)
select users.id
from auth.users as users
on conflict (id) do nothing;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

create table if not exists public.member_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancel_at timestamptz,
  canceled_at timestamptz,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint member_subscriptions_status_check check (
    status in (
      'inactive',
      'trialing',
      'active',
      'past_due',
      'unpaid',
      'canceled',
      'incomplete',
      'incomplete_expired',
      'paused'
    )
  )
);

alter table public.member_subscriptions
  add column if not exists stripe_customer_id text;

alter table public.member_subscriptions
  add column if not exists stripe_subscription_id text;

alter table public.member_subscriptions
  add column if not exists stripe_price_id text;

alter table public.member_subscriptions
  add column if not exists status text not null default 'inactive';

alter table public.member_subscriptions
  add column if not exists current_period_end timestamptz;

alter table public.member_subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

alter table public.member_subscriptions
  add column if not exists cancel_at timestamptz;

alter table public.member_subscriptions
  add column if not exists canceled_at timestamptz;

alter table public.member_subscriptions
  add column if not exists metadata jsonb;

alter table public.member_subscriptions
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.member_subscriptions
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists member_subscriptions_status_idx
  on public.member_subscriptions(status);

create index if not exists member_subscriptions_period_end_idx
  on public.member_subscriptions(current_period_end);

create unique index if not exists member_subscriptions_customer_id_idx
  on public.member_subscriptions(stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists member_subscriptions_subscription_id_idx
  on public.member_subscriptions(stripe_subscription_id)
  where stripe_subscription_id is not null;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_member_subscriptions_updated_at on public.member_subscriptions;
create trigger set_member_subscriptions_updated_at
  before update on public.member_subscriptions
  for each row execute procedure public.set_current_timestamp_updated_at();

create or replace function public.subscription_grants_lessons_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.member_subscriptions subscriptions
    where subscriptions.user_id = target_user_id
      and subscriptions.status in ('active', 'trialing')
      and (
        subscriptions.current_period_end is null
        or subscriptions.current_period_end > timezone('utc', now())
      )
  );
$$;

create or replace function public.refresh_profile_lessons_access(target_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  next_access boolean;
begin
  next_access := public.subscription_grants_lessons_access(target_user_id);

  update public.profiles
  set has_lessons_access = next_access
  where id = target_user_id;

  return next_access;
end;
$$;

alter table public.profiles enable row level security;
alter table public.member_subscriptions enable row level security;

drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read"
  on public.profiles
  for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update"
  on public.profiles
  for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert"
  on public.profiles
  for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "member subscriptions self read" on public.member_subscriptions;
create policy "member subscriptions self read"
  on public.member_subscriptions
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "member subscriptions admin write" on public.member_subscriptions;
create policy "member subscriptions admin write"
  on public.member_subscriptions
  for all
  using (public.is_admin())
  with check (public.is_admin());
