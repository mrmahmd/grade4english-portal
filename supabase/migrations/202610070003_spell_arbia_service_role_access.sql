-- The Edge Function uses service_role for competition data. RLS still denies
-- direct browser access to anon/authenticated clients.
grant select, insert, update, delete on public.spell_arbia_roster to service_role;
grant select, insert, update, delete on public.spell_arbia_attempts to service_role;
grant select, insert, update, delete on public.spell_arbia_teacher_pin to service_role;
grant select, insert, update, delete on public.spell_arbia_teacher_sessions to service_role;
