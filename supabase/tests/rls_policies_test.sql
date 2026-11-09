begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'ana.rls@example.test'),
  ('22222222-2222-2222-2222-222222222222', 'bia.rls@example.test');

insert into public.tasks (id, user_id, client_id, title, completed)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaab',
  'Tarefa da Ana',
  false
);

insert into public.music_links (id, user_id, client_id, platform, title, source_url, embed_url)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc',
  'youtube',
  'Música da Ana',
  'https://www.youtube.com/watch?v=M7lc1UVf-VE',
  'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE'
);

insert into public.focus_sessions (id, user_id, mode, duration_seconds, completed)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '11111111-1111-1111-1111-111111111111',
  'pomodoro',
  1500,
  true
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (select count(*)::integer from public.tasks),
  1,
  'a pessoa dona vê a própria tarefa'
);

set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is(
  (select count(*)::integer from public.tasks),
  0,
  'outra pessoa não vê tarefas alheias'
);

select is(
  (with changed as (
    update public.tasks set title = 'Alteração indevida'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'outra pessoa não atualiza tarefa alheia'
);

select is(
  (with removed as (
    delete from public.tasks where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning 1
  ) select count(*)::integer from removed),
  0,
  'outra pessoa não remove tarefa alheia'
);

select is(
  (select count(*)::integer from public.music_links),
  0,
  'outra pessoa não vê links de música alheios'
);

select is(
  (with changed as (
    update public.music_links set title = 'Alteração indevida'
    where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    returning 1
  ) select count(*)::integer from changed),
  0,
  'outra pessoa não atualiza link de música alheio'
);

select is(
  (select count(*)::integer from public.focus_sessions),
  0,
  'outra pessoa não vê sessões alheias'
);

set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select is(
  (select title from public.tasks where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'Tarefa da Ana',
  'a tarefa original continua inalterada'
);

reset role;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.tasks'::regclass),
  'RLS está habilitado para tarefas'
);

select * from finish();
rollback;
