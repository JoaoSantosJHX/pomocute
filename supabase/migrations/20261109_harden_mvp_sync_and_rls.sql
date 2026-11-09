-- Aplicar em ambientes Supabase existentes antes de publicar o cliente que usa client_id.
-- Mantém os registros atuais e torna a sincronização idempotente por usuário.
begin;

alter table public.tasks add column if not exists client_id uuid;
update public.tasks set client_id = gen_random_uuid() where client_id is null;
alter table public.tasks alter column client_id set default gen_random_uuid();
alter table public.tasks alter column client_id set not null;
create unique index if not exists tasks_user_client_id_key on public.tasks (user_id, client_id);
create index if not exists tasks_user_id_idx on public.tasks (user_id);

alter table public.music_links add column if not exists client_id uuid;
update public.music_links set client_id = gen_random_uuid() where client_id is null;
alter table public.music_links alter column client_id set default gen_random_uuid();
alter table public.music_links alter column client_id set not null;
create unique index if not exists music_links_user_client_id_key on public.music_links (user_id, client_id);
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

drop policy if exists "Usuários leem o próprio perfil" on public.profiles;
drop policy if exists "Usuários editam o próprio perfil" on public.profiles;
drop policy if exists "Usuários atualizam o próprio perfil" on public.profiles;
drop policy if exists "Usuários veem as próprias tarefas" on public.tasks;
drop policy if exists "Usuários criam as próprias tarefas" on public.tasks;
drop policy if exists "Usuários atualizam as próprias tarefas" on public.tasks;
drop policy if exists "Usuários removem as próprias tarefas" on public.tasks;
drop policy if exists "Usuários veem os próprios links de música" on public.music_links;
drop policy if exists "Usuários criam os próprios links de música" on public.music_links;
drop policy if exists "Usuários atualizam os próprios links de música" on public.music_links;
drop policy if exists "Usuários removem os próprios links de música" on public.music_links;
drop policy if exists "Usuários veem as próprias sessões" on public.focus_sessions;
drop policy if exists "Usuários registram as próprias sessões" on public.focus_sessions;

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

commit;
