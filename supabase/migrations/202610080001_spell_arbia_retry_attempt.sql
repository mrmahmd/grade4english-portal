-- Preserve all Round 1 answers and allow one additional retry word after a loss.
alter table public.spell_arbia_attempts
  add column if not exists is_retry boolean not null default false;

alter table public.spell_arbia_attempts
  drop constraint if exists spell_arbia_attempts_attempt_no_check;

alter table public.spell_arbia_attempts
  add constraint spell_arbia_attempts_attempt_no_check
  check (attempt_no between 1 and 3);
