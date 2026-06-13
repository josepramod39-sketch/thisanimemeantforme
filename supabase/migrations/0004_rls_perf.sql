-- Performance pass on RLS (effective access unchanged):
--  * wrap auth.*/is_admin() in (select ...) so they're evaluated once per query
--    (fixes the "auth_rls_initplan" advisor), and
--  * collapse overlapping permissive policies to one policy per action
--    (fixes "multiple_permissive_policies").

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check ((select auth.uid()) = id);
create policy "profiles_update_self" on public.profiles
  for update using ((select auth.uid()) = id);

-- likes ------------------------------------------------------------------
drop policy if exists "likes_insert_self" on public.likes;
drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_insert_self" on public.likes
  for insert with check ((select auth.uid()) = user_id);
create policy "likes_delete_self" on public.likes
  for delete using ((select auth.uid()) = user_id);

-- stories: merge admin into per-action policies (no FOR ALL overlap) ------
drop policy if exists "stories_admin_all" on public.stories;
drop policy if exists "stories_insert_self" on public.stories;
drop policy if exists "stories_update_self" on public.stories;
drop policy if exists "stories_delete_self" on public.stories;
create policy "stories_insert_self" on public.stories
  for insert with check ((select auth.uid()) = author_id);
create policy "stories_update" on public.stories
  for update using ((select auth.uid()) = author_id or (select public.is_admin()));
create policy "stories_delete" on public.stories
  for delete using ((select auth.uid()) = author_id or (select public.is_admin()));

-- moods ------------------------------------------------------------------
drop policy if exists "moods_admin_write" on public.moods;
create policy "moods_admin_insert" on public.moods
  for insert with check ((select public.is_admin()));
create policy "moods_admin_update" on public.moods
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "moods_admin_delete" on public.moods
  for delete using ((select public.is_admin()));

-- clips: single SELECT (enabled OR admin); admin writes only -------------
drop policy if exists "clips_admin_all" on public.clips;
drop policy if exists "clips_select_public" on public.clips;
create policy "clips_select" on public.clips
  for select using (enabled or (select public.is_admin()));
create policy "clips_admin_insert" on public.clips
  for insert with check ((select public.is_admin()));
create policy "clips_admin_update" on public.clips
  for update using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "clips_admin_delete" on public.clips
  for delete using ((select public.is_admin()));

-- site_settings ----------------------------------------------------------
drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_update" on public.site_settings
  for update using ((select public.is_admin())) with check ((select public.is_admin()));

-- Keep the stories.mood FK covered (helps mood-delete scans).
create index if not exists stories_mood_idx on public.stories (mood);
