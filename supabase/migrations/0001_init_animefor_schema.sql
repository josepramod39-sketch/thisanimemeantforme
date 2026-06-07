-- animefor core schema: profiles, stories, likes + RLS + feed view

-- PROFILES ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  avatar_seed text,
  created_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$')
);

-- STORIES ----------------------------------------------------------------
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  anilist_id integer,
  anime_title text not null,
  anime_cover_url text,
  anime_cover_color text,
  anime_format text,
  anime_studio text,
  anime_trailer_id text,
  anime_trailer_site text,
  body text not null,
  created_at timestamptz not null default now(),
  constraint body_length check (char_length(body) between 1 and 600)
);
create index stories_created_at_idx on public.stories (created_at desc);
create index stories_author_idx on public.stories (author_id);

-- LIKES ------------------------------------------------------------------
create table public.likes (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (story_id, user_id)
);
create index likes_story_idx on public.likes (story_id);
create index likes_user_idx on public.likes (user_id);

-- RLS --------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stories  enable row level security;
alter table public.likes    enable row level security;

create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_self" on public.profiles for update using (auth.uid() = id);

create policy "stories_select_all"   on public.stories for select using (true);
create policy "stories_insert_self"  on public.stories for insert with check (auth.uid() = author_id);
create policy "stories_update_self"  on public.stories for update using (auth.uid() = author_id);
create policy "stories_delete_self"  on public.stories for delete using (auth.uid() = author_id);

create policy "likes_select_all"     on public.likes for select using (true);
create policy "likes_insert_self"    on public.likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_self"    on public.likes for delete using (auth.uid() = user_id);

-- FEED VIEW (security_invoker => RLS applies as the caller) ---------------
create view public.stories_with_counts
  with (security_invoker = on) as
select
  s.id, s.author_id, s.anilist_id, s.anime_title, s.anime_cover_url,
  s.anime_cover_color, s.anime_format, s.anime_studio, s.anime_trailer_id,
  s.anime_trailer_site, s.body, s.created_at,
  p.username    as author_username,
  p.avatar_seed as author_avatar_seed,
  coalesce(lc.cnt, 0) as like_count,
  exists (
    select 1 from public.likes lm
    where lm.story_id = s.id and lm.user_id = auth.uid()
  ) as liked_by_me
from public.stories s
join public.profiles p on p.id = s.author_id
left join (
  select story_id, count(*)::int as cnt
  from public.likes group by story_id
) lc on lc.story_id = s.id;

grant select on public.stories_with_counts to anon, authenticated;
