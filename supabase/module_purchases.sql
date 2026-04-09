create extension if not exists pgcrypto;

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

alter table public.lesson_modules
  add column if not exists stripe_price_id text;

alter table public.lesson_modules
  add column if not exists price_cents integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesson_modules_price_cents_check'
  ) then
    alter table public.lesson_modules
      add constraint lesson_modules_price_cents_check
      check (price_cents >= 0);
  end if;
end;
$$;

create table if not exists public.lesson_module_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.lesson_modules(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  stripe_price_id text,
  amount_total integer,
  currency text,
  payment_status text not null default 'pending',
  source text not null default 'stripe',
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lesson_module_purchases_payment_status_check check (
    payment_status in ('pending', 'paid', 'refunded', 'failed', 'expired')
  ),
  constraint lesson_module_purchases_source_check check (
    source in ('stripe', 'admin')
  )
);

alter table public.lesson_module_purchases
  add column if not exists stripe_checkout_session_id text;

alter table public.lesson_module_purchases
  add column if not exists stripe_payment_intent_id text;

alter table public.lesson_module_purchases
  add column if not exists stripe_customer_id text;

alter table public.lesson_module_purchases
  add column if not exists stripe_price_id text;

alter table public.lesson_module_purchases
  add column if not exists amount_total integer;

alter table public.lesson_module_purchases
  add column if not exists currency text;

alter table public.lesson_module_purchases
  add column if not exists payment_status text not null default 'pending';

alter table public.lesson_module_purchases
  add column if not exists source text not null default 'stripe';

alter table public.lesson_module_purchases
  add column if not exists metadata jsonb;

alter table public.lesson_module_purchases
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.lesson_module_purchases
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.user_lesson_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.lesson_modules(id) on delete cascade,
  purchase_id uuid references public.lesson_module_purchases(id) on delete set null,
  source text not null default 'purchase',
  granted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, module_id),
  constraint user_lesson_access_source_check check (
    source in ('purchase', 'admin_grant')
  )
);

alter table public.user_lesson_access
  add column if not exists purchase_id uuid references public.lesson_module_purchases(id) on delete set null;

alter table public.user_lesson_access
  add column if not exists source text not null default 'purchase';

alter table public.user_lesson_access
  add column if not exists granted_at timestamptz not null default timezone('utc', now());

alter table public.user_lesson_access
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.user_lesson_access
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.student_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  badge_label text not null,
  metadata jsonb,
  awarded_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, badge_key)
);

alter table public.student_badges
  add column if not exists metadata jsonb;

alter table public.student_badges
  add column if not exists awarded_at timestamptz not null default timezone('utc', now());

alter table public.student_badges
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.lesson_submissions
  add column if not exists star_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'lesson_submissions_star_count_check'
  ) then
    alter table public.lesson_submissions
      add constraint lesson_submissions_star_count_check
      check (star_count between 0 and 3);
  end if;
end;
$$;

create index if not exists lesson_modules_price_idx
  on public.lesson_modules(is_free, price_cents);

create unique index if not exists lesson_modules_stripe_price_idx
  on public.lesson_modules(stripe_price_id)
  where stripe_price_id is not null;

create index if not exists lesson_module_purchases_user_created_idx
  on public.lesson_module_purchases(user_id, created_at desc);

create index if not exists lesson_module_purchases_module_created_idx
  on public.lesson_module_purchases(module_id, created_at desc);

create index if not exists lesson_module_purchases_status_idx
  on public.lesson_module_purchases(payment_status);

create index if not exists user_lesson_access_module_user_idx
  on public.user_lesson_access(module_id, user_id);

create index if not exists student_badges_user_awarded_idx
  on public.student_badges(user_id, awarded_at desc);

drop trigger if exists set_lesson_module_purchases_updated_at on public.lesson_module_purchases;
create trigger set_lesson_module_purchases_updated_at
  before update on public.lesson_module_purchases
  for each row execute procedure public.set_current_timestamp_updated_at();

drop trigger if exists set_user_lesson_access_updated_at on public.user_lesson_access;
create trigger set_user_lesson_access_updated_at
  before update on public.user_lesson_access
  for each row execute procedure public.set_current_timestamp_updated_at();

create or replace function public.user_has_module_access(target_user_id uuid, target_module_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profiles
    where profiles.id = target_user_id
      and profiles.has_lessons_access = true
  )
  or exists (
    select 1
    from public.user_lesson_access lesson_access
    where lesson_access.user_id = target_user_id
      and lesson_access.module_id = target_module_id
  );
$$;

create or replace function public.user_has_any_lesson_access(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_lesson_access lesson_access
    where lesson_access.user_id = target_user_id
  );
$$;

create or replace function public.refresh_profile_lessons_access(target_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_user_id
      and has_lessons_access = true
  );
$$;

create or replace function public.sync_student_badges(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total_stars integer;
  completed_lessons integer;
begin
  if not public.is_admin() then
    raise exception 'Only admins can sync student badges.';
  end if;

  delete from public.student_badges
  where user_id = target_user_id
    and (
      badge_key like 'lesson:%:complete'
      or badge_key in ('shape-master', 'stars:1', 'stars:5', 'stars:10', 'stars:20')
    );

  insert into public.student_badges (user_id, badge_key, badge_label, metadata)
  select
    target_user_id,
    'lesson:' || modules.slug || ':complete',
    'Lesson Complete: ' || modules.title,
    jsonb_build_object(
      'module_id', modules.id,
      'module_slug', modules.slug
    )
  from (
    select distinct on (submissions.module_id)
      submissions.module_id
    from public.lesson_submissions submissions
    where submissions.user_id = target_user_id
      and submissions.status = 'reviewed'
    order by submissions.module_id, submissions.updated_at desc
  ) reviewed
  join public.lesson_modules modules on modules.id = reviewed.module_id;

  select coalesce(sum(submissions.star_count), 0)
  into total_stars
  from public.lesson_submissions submissions
  where submissions.user_id = target_user_id;

  if total_stars >= 1 then
    insert into public.student_badges (user_id, badge_key, badge_label, metadata)
    values (target_user_id, 'stars:1', 'First Star', jsonb_build_object('threshold', 1));
  end if;

  if total_stars >= 5 then
    insert into public.student_badges (user_id, badge_key, badge_label, metadata)
    values (target_user_id, 'stars:5', '5 Stars', jsonb_build_object('threshold', 5));
  end if;

  if total_stars >= 10 then
    insert into public.student_badges (user_id, badge_key, badge_label, metadata)
    values (target_user_id, 'stars:10', '10 Stars', jsonb_build_object('threshold', 10));
  end if;

  if total_stars >= 20 then
    insert into public.student_badges (user_id, badge_key, badge_label, metadata)
    values (target_user_id, 'stars:20', '20 Stars', jsonb_build_object('threshold', 20));
  end if;

  select count(distinct submissions.module_id)
  into completed_lessons
  from public.lesson_submissions submissions
  where submissions.user_id = target_user_id
    and submissions.status = 'reviewed';

  if completed_lessons >= 5 then
    insert into public.student_badges (user_id, badge_key, badge_label, metadata)
    values (
      target_user_id,
      'shape-master',
      'Shape Master',
      jsonb_build_object('completed_lessons', completed_lessons)
    );
  end if;
end;
$$;

grant execute on function public.sync_student_badges(uuid) to authenticated;

alter table public.lesson_module_purchases enable row level security;
alter table public.user_lesson_access enable row level security;
alter table public.student_badges enable row level security;

drop policy if exists "lesson module purchases self read" on public.lesson_module_purchases;
create policy "lesson module purchases self read"
  on public.lesson_module_purchases
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "lesson module purchases admin write" on public.lesson_module_purchases;
create policy "lesson module purchases admin write"
  on public.lesson_module_purchases
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "user lesson access self read" on public.user_lesson_access;
create policy "user lesson access self read"
  on public.user_lesson_access
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "user lesson access admin write" on public.user_lesson_access;
create policy "user lesson access admin write"
  on public.user_lesson_access
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "student badges self read" on public.student_badges;
create policy "student badges self read"
  on public.student_badges
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "student badges admin write" on public.student_badges;
create policy "student badges admin write"
  on public.student_badges
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
          or public.user_has_module_access(auth.uid(), modules.id)
          or public.is_admin()
        )
    )
  );

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
          or public.user_has_module_access(auth.uid(), modules.id)
          or public.is_admin()
        )
    )
  );

drop policy if exists "private lesson asset read" on storage.objects;
create policy "private lesson asset read"
  on storage.objects
  for select
  using (
    (
      bucket_id = 'lesson-private-media'
      and exists (
        select 1
        from public.lesson_module_blocks blocks
        join public.lesson_modules modules on modules.id = blocks.module_id
        where blocks.storage_path = storage.objects.name
          and modules.is_published = true
          and (
            modules.is_free = true
            or public.user_has_module_access(auth.uid(), modules.id)
            or public.is_admin()
          )
      )
    )
    or (
      bucket_id = 'lesson-private-resources'
      and exists (
        select 1
        from public.lesson_resources resources
        join public.lesson_modules modules on modules.id = resources.module_id
        where resources.storage_path = storage.objects.name
          and modules.is_published = true
          and (
            modules.is_free = true
            or public.user_has_module_access(auth.uid(), modules.id)
            or public.is_admin()
          )
      )
    )
  );

drop policy if exists "lesson submissions owner insert" on public.lesson_submissions;
create policy "lesson submissions owner insert"
  on public.lesson_submissions
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.lesson_modules modules
      where modules.id = module_id
        and modules.is_published = true
        and (
          modules.is_free = true
          or public.user_has_module_access(auth.uid(), modules.id)
          or public.is_admin()
        )
    )
  );
