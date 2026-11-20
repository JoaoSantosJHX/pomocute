-- Execute este arquivo no SQL Editor do Supabase ao criar um ambiente novo.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 280),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, client_id)
);

create table if not exists public.music_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null default gen_random_uuid(),
  platform text not null check (platform in ('youtube', 'spotify')),
  title text not null check (char_length(title) between 1 and 280),
  source_url text not null,
  embed_url text not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('pomodoro', 'short', 'long')),
  duration_seconds integer not null check (duration_seconds > 0),
  completed boolean not null default false,
  finished_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists music_links_user_id_idx on public.music_links (user_id);
create index if not exists focus_sessions_user_id_idx on public.focus_sessions (user_id);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.music_links enable row level security;
alter table public.focus_sessions enable row level security;

revoke all on public.profiles, public.tasks, public.music_links, public.focus_sessions from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.music_links to authenticated;
grant select, insert on public.focus_sessions to authenticated;

create policy "Usuários leem o próprio perfil" on public.profiles
  for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "Usuários editam o próprio perfil" on public.profiles
  for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy "Usuários atualizam o próprio perfil" on public.profiles
  for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "Usuários veem as próprias tarefas" on public.tasks
  for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários criam as próprias tarefas" on public.tasks
  for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários atualizam as próprias tarefas" on public.tasks
  for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários removem as próprias tarefas" on public.tasks
  for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Usuários veem os próprios links de música" on public.music_links
  for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários criam os próprios links de música" on public.music_links
  for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários atualizam os próprios links de música" on public.music_links
  for update to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
  with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários removem os próprios links de música" on public.music_links
  for delete to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "Usuários veem as próprias sessões" on public.focus_sessions
  for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
create policy "Usuários registram as próprias sessões" on public.focus_sessions
  for insert to authenticated with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);
