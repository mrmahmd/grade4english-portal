create table if not exists public.platform_settings (
  id text primary key default 'grade4' check (id = 'grade4'),
  registration_enabled boolean not null default true,
  login_enabled boolean not null default true,
  connect_plus_visible boolean not null default true,
  english4_visible boolean not null default true,
  hero_week_number text not null default '',
  heroes jsonb not null default '[]'::jsonb,
  featured_student_ids jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.platform_settings (id)
values ('grade4')
on conflict (id) do nothing;

alter table public.platform_settings enable row level security;
grant select on public.platform_settings to anon, authenticated;
grant select, insert, update on public.platform_settings to service_role;
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'platform_settings'
      and policyname = 'public reads grade4 platform settings'
  ) then
    create policy "public reads grade4 platform settings"
      on public.platform_settings for select
      to anon, authenticated
      using (id = 'grade4');
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'hero-of-week',
  'hero-of-week',
  true,
  3145728,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'public reads hero of week images'
  ) then
    create policy "public reads hero of week images"
      on storage.objects for select
      to anon, authenticated
      using (bucket_id = 'hero-of-week');
  end if;
end $$;

comment on table public.platform_settings is
  'Public-safe Grade 4 portal switches, featured learners, and Hero of the Week presentation data. Writes use the teacher-admin Edge Function.';
