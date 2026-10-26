-- Execute este arquivo no SQL Editor do Supabase.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 280),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.music_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'spotify')),
  title text not null check (char_length(title) between 1 and 280),
  source_url text not null,
  embed_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('pomodoro', 'short', 'long')),
  duration_seconds integer not null check (duration_seconds > 0),
  completed boolean not null default false,
  finished_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.music_links enable row level security;
alter table public.focus_sessions enable row level security;

create policy "Usuários leem o próprio perfil" on public.profiles for select using (auth.uid() = id);
create policy "Usuários editam o próprio perfil" on public.profiles for insert with check (auth.uid() = id);
create policy "Usuários atualizam o próprio perfil" on public.profiles for update using (auth.uid() = id);
create policy "Usuários veem as próprias tarefas" on public.tasks for select using (auth.uid() = user_id);
create policy "Usuários criam as próprias tarefas" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Usuários atualizam as próprias tarefas" on public.tasks for update using (auth.uid() = user_id);
create policy "Usuários removem as próprias tarefas" on public.tasks for delete using (auth.uid() = user_id);
create policy "Usuários veem os próprios links de música" on public.music_links for select using (auth.uid() = user_id);
create policy "Usuários criam os próprios links de música" on public.music_links for insert with check (auth.uid() = user_id);
create policy "Usuários removem os próprios links de música" on public.music_links for delete using (auth.uid() = user_id);
create policy "Usuários veem as próprias sessões" on public.focus_sessions for select using (auth.uid() = user_id);
create policy "Usuários registram as próprias sessões" on public.focus_sessions for insert with check (auth.uid() = user_id);
