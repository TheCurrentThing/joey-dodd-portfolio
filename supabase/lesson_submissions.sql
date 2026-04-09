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

create table if not exists public.lesson_submissions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.lesson_modules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  student_note text,
  feedback_request text,
  status text not null default 'submitted',
  staff_feedback text,
  featured boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint lesson_submissions_status_check check (
    status in ('submitted', 'in_review', 'reviewed', 'revision_requested')
  ),
  constraint lesson_submissions_student_name_check check (char_length(trim(student_name)) between 1 and 60)
);

alter table public.lesson_submissions
  add column if not exists student_note text;

alter table public.lesson_submissions
  add column if not exists feedback_request text;

alter table public.lesson_submissions
  add column if not exists status text not null default 'submitted';

alter table public.lesson_submissions
  add column if not exists staff_feedback text;

alter table public.lesson_submissions
  add column if not exists featured boolean not null default false;

alter table public.lesson_submissions
  add column if not exists reviewed_at timestamptz;

alter table public.lesson_submissions
  add column if not exists created_at timestamptz not null default timezone('utc', now());

alter table public.lesson_submissions
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

create table if not exists public.lesson_submission_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.lesson_submissions(id) on delete cascade,
  storage_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.lesson_submission_assets
  add column if not exists storage_path text;

alter table public.lesson_submission_assets
  add column if not exists sort_order integer not null default 0;

alter table public.lesson_submission_assets
  add column if not exists created_at timestamptz not null default timezone('utc', now());

create index if not exists lesson_submissions_module_created_idx
  on public.lesson_submissions(module_id, created_at desc);

create index if not exists lesson_submissions_user_created_idx
  on public.lesson_submissions(user_id, created_at desc);

create index if not exists lesson_submissions_status_created_idx
  on public.lesson_submissions(status, created_at desc);

create index if not exists lesson_submission_assets_submission_sort_idx
  on public.lesson_submission_assets(submission_id, sort_order);

drop trigger if exists set_lesson_submissions_updated_at on public.lesson_submissions;
create trigger set_lesson_submissions_updated_at
  before update on public.lesson_submissions
  for each row execute procedure public.set_current_timestamp_updated_at();

alter table public.lesson_submissions enable row level security;
alter table public.lesson_submission_assets enable row level security;

drop policy if exists "lesson submissions owner read" on public.lesson_submissions;
create policy "lesson submissions owner read"
  on public.lesson_submissions
  for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "lesson submissions owner insert" on public.lesson_submissions;
create policy "lesson submissions owner insert"
  on public.lesson_submissions
  for insert
  with check (
    auth.uid() = user_id
    and (public.has_lessons_access() or public.is_admin())
    and exists (
      select 1
      from public.lesson_modules modules
      where modules.id = module_id
        and modules.is_published = true
    )
  );

drop policy if exists "lesson submissions admin update" on public.lesson_submissions;
create policy "lesson submissions admin update"
  on public.lesson_submissions
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "lesson submissions admin delete" on public.lesson_submissions;
create policy "lesson submissions admin delete"
  on public.lesson_submissions
  for delete
  using (public.is_admin());

drop policy if exists "lesson submission assets owner read" on public.lesson_submission_assets;
create policy "lesson submission assets owner read"
  on public.lesson_submission_assets
  for select
  using (
    exists (
      select 1
      from public.lesson_submissions submissions
      where submissions.id = lesson_submission_assets.submission_id
        and (submissions.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "lesson submission assets owner insert" on public.lesson_submission_assets;
create policy "lesson submission assets owner insert"
  on public.lesson_submission_assets
  for insert
  with check (
    exists (
      select 1
      from public.lesson_submissions submissions
      where submissions.id = submission_id
        and (submissions.user_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "lesson submission assets admin delete" on public.lesson_submission_assets;
create policy "lesson submission assets admin delete"
  on public.lesson_submission_assets
  for delete
  using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('lesson-submissions', 'lesson-submissions', false)
on conflict (id) do nothing;

drop policy if exists "lesson submission object read" on storage.objects;
create policy "lesson submission object read"
  on storage.objects
  for select
  using (
    bucket_id = 'lesson-submissions'
    and (
      public.is_admin()
      or exists (
        select 1
        from public.lesson_submission_assets assets
        join public.lesson_submissions submissions on submissions.id = assets.submission_id
        where assets.storage_path = storage.objects.name
          and submissions.user_id = auth.uid()
      )
    )
  );

drop policy if exists "lesson submission object insert" on storage.objects;
create policy "lesson submission object insert"
  on storage.objects
  for insert
  with check (
    bucket_id = 'lesson-submissions'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
    )
  );

drop policy if exists "lesson submission object update" on storage.objects;
create policy "lesson submission object update"
  on storage.objects
  for update
  using (
    bucket_id = 'lesson-submissions'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'lesson-submissions'
    and (
      public.is_admin()
      or split_part(name, '/', 1) = auth.uid()::text
    )
  );

drop policy if exists "lesson submission object delete" on storage.objects;
create policy "lesson submission object delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'lesson-submissions'
    and public.is_admin()
  );
