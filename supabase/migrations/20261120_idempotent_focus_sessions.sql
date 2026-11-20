-- Impede duplicatas quando o navegador repete a gravação de uma sessão concluída.
-- Mantém os registros atuais e adiciona uma chave estável por usuário.
begin;

alter table public.focus_sessions add column if not exists client_id uuid;
update public.focus_sessions set client_id = gen_random_uuid() where client_id is null;
alter table public.focus_sessions alter column client_id set default gen_random_uuid();
alter table public.focus_sessions alter column client_id set not null;
create unique index if not exists focus_sessions_user_client_id_key
  on public.focus_sessions (user_id, client_id);

commit;
