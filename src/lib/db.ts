import { supabase } from './supabase'
import type { Story } from './types'
import type { StoryDraft } from '../components/AddStoryModal'

interface FeedRow {
  id: string
  author_id: string
  anilist_id: number | null
  anime_title: string
  anime_cover_url: string | null
  anime_cover_color: string | null
  anime_format: string | null
  anime_studio: string | null
  anime_trailer_id: string | null
  anime_trailer_site: string | null
  body: string
  created_at: string
  author_username: string
  author_avatar_seed: string | null
  like_count: number
  liked_by_me: boolean
}

function rowToStory(r: FeedRow): Story {
  return {
    id: r.id,
    anime: {
      anilistId: r.anilist_id ?? 0,
      title: r.anime_title,
      coverUrl: r.anime_cover_url ?? undefined,
      coverColor: r.anime_cover_color,
      format: r.anime_format,
      studio: r.anime_studio,
      trailer: r.anime_trailer_id && r.anime_trailer_site
        ? { id: r.anime_trailer_id, site: r.anime_trailer_site }
        : null,
    },
    body: r.body,
    author: r.author_username,
    likeCount: r.like_count,
    likedByMe: r.liked_by_me,
    createdAt: r.created_at,
  }
}

export async function fetchStories(): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories_with_counts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data as FeedRow[]).map(rowToStory)
}

export async function fetchStoriesByAuthor(username: string): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories_with_counts')
    .select('*')
    .eq('author_username', username)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data as FeedRow[]).map(rowToStory)
}

export async function getProfileByUsername(
  username: string,
): Promise<{ username: string; avatar_seed: string | null; created_at: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_seed, created_at')
    .eq('username', username)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return Boolean(data)
}

export async function getMyProfile(userId: string): Promise<{ username: string; avatar_seed: string | null } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, avatar_seed')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function createProfile(userId: string, username: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .insert({ id: userId, username, avatar_seed: username })
  if (error) throw new Error(error.message)
}

export async function insertStory(draft: StoryDraft, authorId: string): Promise<Story> {
  const { anime, body } = draft
  const { data, error } = await supabase
    .from('stories')
    .insert({
      author_id: authorId,
      anilist_id: anime.anilistId || null,
      anime_title: anime.title,
      anime_cover_url: anime.coverUrl ?? null,
      anime_cover_color: anime.coverColor ?? null,
      anime_format: anime.format ?? null,
      anime_studio: anime.studio ?? null,
      anime_trailer_id: anime.trailer?.id ?? null,
      anime_trailer_site: anime.trailer?.site ?? null,
      body,
    })
    .select('id, created_at')
    .single()
  if (error) throw new Error(error.message)
  return {
    id: data.id,
    anime,
    body,
    author: '', // filled by caller (the current username)
    likeCount: 0,
    likedByMe: false,
    createdAt: data.created_at,
  }
}

export async function setLike(storyId: string, userId: string, liked: boolean): Promise<void> {
  if (liked) {
    const { error } = await supabase
      .from('likes')
      .insert({ story_id: storyId, user_id: userId })
    // Ignore duplicate-like races (unique violation 23505).
    if (error && error.code !== '23505') throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('story_id', storyId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
}
