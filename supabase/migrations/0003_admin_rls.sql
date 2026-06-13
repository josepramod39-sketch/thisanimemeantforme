-- Sync committed migrations with the live schema: admin gate, write policies,
-- enabled-only public clips, and the default mood phases.

-- Admin helper: true only for the site owners' emails (magic-link JWT).
-- search_path is pinned so the function can't be hijacked via a rogue schema.
create or replace function public.is_admin() returns boolean
language sql stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() ->> 'email') in ('josepramod39@gmail.com', 'krishnaprateek428@gmail.com'),
    false
  )
$$;

-- Admin write policies ----------------------------------------------------
create policy "moods_admin_write" on public.moods
  for all using (public.is_admin()) with check (public.is_admin());

create policy "clips_admin_all" on public.clips
  for all using (public.is_admin()) with check (public.is_admin());

create policy "settings_admin_write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());

-- Owner can moderate (update/delete) any story.
create policy "stories_admin_all" on public.stories
  for all using (public.is_admin()) with check (public.is_admin());

-- Public should only see enabled clips (admins see all via clips_admin_all).
drop policy if exists "clips_select_all" on public.clips;
create policy "clips_select_public" on public.clips
  for select using (enabled = true);

-- Default mood phases ------------------------------------------------------
insert into public.moods (slug, label, sort) values
  ('lonely', 'Lonely', 1),
  ('heartbroken', 'Heartbroken', 2),
  ('lost', 'Lost or stuck', 3),
  ('burntout', 'Burnt out', 4),
  ('anxious', 'Anxious', 5),
  ('grieving', 'Grieving', 6),
  ('hopeful', 'Need hope', 7),
  ('nostalgic', 'Nostalgic', 8)
on conflict (slug) do nothing;
