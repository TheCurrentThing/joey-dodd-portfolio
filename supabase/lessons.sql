create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  is_admin boolean not null default false,
  has_lessons_access boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

create table if not exists public.lesson_modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  cover_image_url text,
  is_free boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  category text,
  level text,
  age_range text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lesson_resources (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lesson_modules(id) on delete cascade,
  label text not null,
  url text,
  storage_path text,
  file_kind text,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.lesson_module_blocks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lesson_modules(id) on delete cascade,
  block_type text not null,
  layout_type text not null,
  title text,
  body text,
  media_kind text,
  media_url text,
  storage_path text,
  poster_image_url text,
  caption text,
  alt_text text,
  resource_id uuid references public.lesson_resources(id) on delete set null,
  settings jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists lesson_modules_sort_order_idx
  on public.lesson_modules(sort_order);

create index if not exists lesson_modules_published_sort_idx
  on public.lesson_modules(is_published, sort_order);

create index if not exists lesson_modules_slug_idx
  on public.lesson_modules(slug);

create index if not exists lesson_module_blocks_module_sort_idx
  on public.lesson_module_blocks(module_id, sort_order);

create index if not exists lesson_resources_module_sort_idx
  on public.lesson_resources(module_id, sort_order);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_lesson_modules_updated_at on public.lesson_modules;
create trigger set_lesson_modules_updated_at
  before update on public.lesson_modules
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_lesson_resources_updated_at on public.lesson_resources;
create trigger set_lesson_resources_updated_at
  before update on public.lesson_resources
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_lesson_module_blocks_updated_at on public.lesson_module_blocks;
create trigger set_lesson_module_blocks_updated_at
  before update on public.lesson_module_blocks
  for each row execute procedure public.set_current_timestamp_updated_at();

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

create or replace function public.has_lessons_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and has_lessons_access = true
  );
$$;

alter table public.profiles enable row level security;
alter table public.lesson_modules enable row level security;
alter table public.lesson_module_blocks enable row level security;
alter table public.lesson_resources enable row level security;

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

drop policy if exists "lesson modules public read" on public.lesson_modules;
create policy "lesson modules public read"
  on public.lesson_modules
  for select
  using (is_published = true or public.is_admin());

drop policy if exists "lesson modules admin write" on public.lesson_modules;
create policy "lesson modules admin write"
  on public.lesson_modules
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "lesson blocks gated read" on public.lesson_module_blocks;
create policy "lesson blocks gated read"
  on public.lesson_module_blocks
  for select
  using (
    exists (
      select 1
      from public.lesson_modules modules
      where modules.id = lesson_module_blocks.module_id
      and modules.is_published = true
      and (
        modules.is_free = true
        or public.has_lessons_access()
        or public.is_admin()
      )
    )
  );

drop policy if exists "lesson blocks admin write" on public.lesson_module_blocks;
create policy "lesson blocks admin write"
  on public.lesson_module_blocks
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "lesson resources gated read" on public.lesson_resources;
create policy "lesson resources gated read"
  on public.lesson_resources
  for select
  using (
    exists (
      select 1
      from public.lesson_modules modules
      where modules.id = lesson_resources.module_id
      and modules.is_published = true
      and (
        modules.is_free = true
        or public.has_lessons_access()
        or public.is_admin()
      )
    )
  );

drop policy if exists "lesson resources admin write" on public.lesson_resources;
create policy "lesson resources admin write"
  on public.lesson_resources
  for all
  using (public.is_admin())
  with check (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('lesson-covers', 'lesson-covers', true),
  ('lesson-public-media', 'lesson-public-media', true),
  ('lesson-private-media', 'lesson-private-media', false),
  ('lesson-private-resources', 'lesson-private-resources', false)
on conflict (id) do nothing;

drop policy if exists "public lesson asset read" on storage.objects;
create policy "public lesson asset read"
  on storage.objects
  for select
  using (bucket_id in ('lesson-covers', 'lesson-public-media'));

drop policy if exists "private lesson asset read" on storage.objects;
create policy "private lesson asset read"
  on storage.objects
  for select
  using (
    bucket_id in ('lesson-private-media', 'lesson-private-resources')
    and (public.is_admin() or public.has_lessons_access())
  );

drop policy if exists "admin lesson asset write" on storage.objects;
create policy "admin lesson asset write"
  on storage.objects
  for all
  using (
    bucket_id in (
      'lesson-covers',
      'lesson-public-media',
      'lesson-private-media',
      'lesson-private-resources'
    )
    and public.is_admin()
  )
  with check (
    bucket_id in (
      'lesson-covers',
      'lesson-public-media',
      'lesson-private-media',
      'lesson-private-resources'
    )
    and public.is_admin()
  );
