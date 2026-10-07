create table if not exists public.spell_arbia_teacher_pin (
  id smallint primary key check (id = 1),
  salt text not null,
  pin_hash text not null,
  iterations integer not null check (iterations >= 100000),
  failed_count smallint not null default 0,
  locked_until timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.spell_arbia_teacher_sessions (
  token_hash text primary key,
  teacher_id uuid not null references auth.users(id),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists spell_arbia_teacher_sessions_expiry_idx on public.spell_arbia_teacher_sessions(expires_at);
alter table public.spell_arbia_teacher_pin enable row level security;
alter table public.spell_arbia_teacher_sessions enable row level security;
revoke all on public.spell_arbia_teacher_pin from anon, authenticated;
revoke all on public.spell_arbia_teacher_sessions from anon, authenticated;
