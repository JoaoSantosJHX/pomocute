-- Permite que cada pessoa atualize somente o título de seus próprios links.
drop policy if exists "Usuários atualizam os próprios links de música" on public.music_links;

create policy "Usuários atualizam os próprios links de música" on public.music_links
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
