create extension if not exists pgcrypto;

create table if not exists public.community_messages (
  id uuid primary key default gen_random_uuid(),
  channel_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  author_role text not null default 'student',
  body text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint community_messages_channel_slug_check
    check (channel_slug in ('introductions', 'studio-chat', 'hall-of-fame')),
  constraint community_messages_author_role_check
    check (author_role in ('instructor', 'student')),
  constraint community_messages_body_length_check
    check (char_length(trim(body)) between 1 and 2000)
);

alter table public.community_messages
  add column if not exists channel_slug text;

alter table public.community_messages
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.community_messages
  add column if not exists author_name text;

alter table public.community_messages
  add column if not exists author_role text not null default 'student';

alter table public.community_messages
  add column if not exists body text;

alter table public.community_messages
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.community_messages
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create index if not exists community_messages_channel_created_idx
  on public.community_messages(channel_slug, created_at);

alter table public.community_messages replica identity full;

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

drop trigger if exists set_community_messages_updated_at on public.community_messages;
create trigger set_community_messages_updated_at
  before update on public.community_messages
  for each row execute procedure public.set_current_timestamp_updated_at();

alter table public.community_messages enable row level security;

drop policy if exists "community messages member read" on public.community_messages;
create policy "community messages member read"
  on public.community_messages
  for select
  using (public.is_admin() or public.has_lessons_access());

drop policy if exists "community messages member insert" on public.community_messages;
create policy "community messages member insert"
  on public.community_messages
  for insert
  with check (
    auth.uid() = user_id
    and (public.is_admin() or public.has_lessons_access())
    and (
      public.is_admin()
      or channel_slug in ('introductions', 'studio-chat')
    )
    and (
      public.is_admin()
      or author_role = 'student'
    )
  );

drop policy if exists "community messages admin delete" on public.community_messages;
create policy "community messages admin delete"
  on public.community_messages
  for delete
  using (public.is_admin());
