-- Execute uma vez no SQL Editor do projeto Supabase já existente.
create table if not exists public.music_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('youtube', 'spotify')),
  title text not null check (char_length(title) between 1 and 280),
  source_url text not null,
  embed_url text not null,
  created_at timestamptz not null default now()
);

alter table public.music_links enable row level security;

drop policy if exists "Usuários veem os próprios links de música" on public.music_links;
drop policy if exists "Usuários criam os próprios links de música" on public.music_links;
drop policy if exists "Usuários removem os próprios links de música" on public.music_links;

create policy "Usuários veem os próprios links de música" on public.music_links
  for select using (auth.uid() = user_id);
create policy "Usuários criam os próprios links de música" on public.music_links
  for insert with check (auth.uid() = user_id);
create policy "Usuários removem os próprios links de música" on public.music_links
  for delete using (auth.uid() = user_id);
