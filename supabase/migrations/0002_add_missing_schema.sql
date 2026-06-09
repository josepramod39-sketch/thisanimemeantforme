-- Add missing tables and columns to animefor schema

-- MOODS
create table public.moods (
  slug text primary key,
  label text not null,
  sort integer not null default 0
);
alter table public.moods enable row level security;
create policy "moods_select_all" on public.moods for select using (true);

-- CLIPS
create table public.clips (
  youtube_id text primary key,
  kind text not null default 'video',
  title text not null,
  channel text not null,
  channel_url text,
  thumbnail text,
  sort integer not null default 0,
  enabled boolean not null default true
);
alter table public.clips enable row level security;
create policy "clips_select_all" on public.clips for select using (true);
-- Admin-only modification is handled by RLS defaults for authenticated users without policies

-- SITE SETTINGS
create table public.site_settings (
  id integer primary key check (id = 1),
  brand_title text not null default 'animefor',
  hero_kicker text not null default 'a quiet wall for loud feelings',
  hero_prompt text not null default 'What did this anime mean to you?',
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy "settings_select_all" on public.site_settings for select using (true);

-- INSERT DEFAULT SETTINGS
insert into public.site_settings (id) values (1) on conflict do nothing;

-- UPDATE STORIES
alter table public.stories
add column mood text references public.moods(slug) on delete set null;

-- UPDATE VIEW
drop view if exists public.stories_with_counts;

create view public.stories_with_counts
  with (security_invoker = on) as
select
  s.id, s.author_id, s.anilist_id, s.anime_title, s.anime_cover_url,
  s.anime_cover_color, s.anime_format, s.anime_studio, s.anime_trailer_id,
  s.anime_trailer_site, s.body, s.created_at, s.mood,
  m.label as mood_label,
  p.username as author_username,
  p.avatar_seed as author_avatar_seed,
  coalesce(lc.cnt, 0) as like_count,
  exists (
    select 1 from public.likes lm
    where lm.story_id = s.id and lm.user_id = auth.uid()
  ) as liked_by_me
from public.stories s
join public.profiles p on p.id = s.author_id
left join public.moods m on m.slug = s.mood
left join (
  select story_id, count(*)::int as cnt
  from public.likes group by story_id
) lc on lc.story_id = s.id;

grant select on public.stories_with_counts to anon, authenticated;
