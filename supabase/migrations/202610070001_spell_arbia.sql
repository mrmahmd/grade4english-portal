-- Teacher-only spelling competition data. The Edge Function verifies teacher_users.
create table if not exists public.spell_arbia_roster (
  id uuid primary key default gen_random_uuid(),
  class_key text not null check (class_key in ('A','B')),
  position integer not null check (position between 1 and 100),
  display_name text not null check (char_length(trim(display_name)) between 2 and 120),
  absent boolean not null default false,
  active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (class_key, position)
);

create table if not exists public.spell_arbia_attempts (
  id uuid primary key default gen_random_uuid(),
  roster_id uuid not null references public.spell_arbia_roster(id) on delete restrict,
  class_key text not null check (class_key in ('A','B')),
  attempt_no smallint not null check (attempt_no in (1,2)),
  word_index smallint not null check (word_index between 0 and 49),
  correct boolean not null,
  marked_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (roster_id, attempt_no),
  unique (class_key, word_index)
);

create index if not exists spell_arbia_attempts_roster_idx on public.spell_arbia_attempts(roster_id, created_at);
alter table public.spell_arbia_roster enable row level security;
alter table public.spell_arbia_attempts enable row level security;
revoke all on public.spell_arbia_roster from anon, authenticated;
revoke all on public.spell_arbia_attempts from anon, authenticated;

insert into public.spell_arbia_roster (class_key,position,display_name) values
('A',1,'Asser Mostafa Abdel Latif Bayoumi'),
('A',2,'Baraa Abdallah Salah Eldin Saber Abdelrahman'),
('A',3,'Hamza Mohamed El Sayed Abbas'),
('A',4,'Ammar Tamer Abbas Mohamed'),
('A',5,'Zein Eldin Hany Abdel Moneim Abou El Nasr Mohamed'),
('A',6,'Abdallah Ibrahim Abdallah El Wakeel'),
('A',7,'Omar Mohamed Ahmed Abdel Aleem Ghanem'),
('A',8,'Omar Mohamed Abdel Nasser Abdel Aal Talha'),
('A',9,'Fares Ahmed Mohamed Youssef Mady'),
('A',10,'Malek Eslam Mohamed Abdel Aziz'),
('A',11,'Malek Omar Mohamed Ibrahim Abdel Rahim'),
('A',12,'Malek Mostafa Fattouh Mohamed Mahmoud'),
('A',13,'Malek Mosaab Metwally Mohamed'),
('A',14,'Marwan Ahmed Abdel Fattah Ali'),
('A',15,'Mansour Mohamed Mohamed Mansour Ghazy'),
('A',16,'Moamen Mohamed Gaber Saad'),
('A',17,'Yassin Mohamed Ahmed Othman Mohamed'),
('A',18,'Yamen Mohamed Nabil Abdel Hady El Morsy'),
('A',19,'Youssef Samy Youssef Ali Youssef El Shaery'),
('A',20,'Youssef Abdelrahman Mokhtar Tawfik Mohamed'),
('A',21,'Youssef Maysara Mohamed Ali'),
('B',1,'Ahmed Amr Sobhy Abdel Aziz'),
('B',2,'Anas Mohamed Ali Younes Marzouk'),
('B',3,'Adam Mohamed Ahmed Hassan Ahmed'),
('B',4,'Khaled Ahmed Mohamed Hassan Ahmed'),
('B',5,'Rayan Hamada Saber Ali El Gaara'),
('B',6,'Abdelrahman Mahmoud Abdelrahman Tawfik Haggag'),
('B',7,'Abdallah Ahmed Hegazy Khalifa Mohamed'),
('B',8,'Omar Ahmed Saad Ahmed'),
('B',9,'Omar Ahmed Kamel Mohamed Beshir'),
('B',10,'Omar Sherif Mohamed Ahmed Helil'),
('B',11,'Kenan Abdel Hamid Saeed Kamal Ismail'),
('B',12,'Malek Hussein Mostafa El Tatary'),
('B',13,'Malek Mohamed Abdel Aal Ismail Khataby'),
('B',14,'Mohamed Eslam Mohamed Ali'),
('B',15,'Mohamed Khaled Abdo Abdel Aziz El Basel'),
('B',16,'Mohamed Samir Fathy Saeed Mostafa'),
('B',17,'Mohamed Mahmoud Saeed Mohamed El Khayat'),
('B',18,'Marwan Ibrahim Mohamed Ibrahim Ismail'),
('B',19,'Marwan Karim Abdel Nabi Ali Mesbah'),
('B',20,'Yassin Ramy El Sayed Mohamed Abdel Wahab Abou Mandour')
on conflict (class_key,position) do nothing;
