// Shared domain types for animefor

export interface AnimeRef {
  anilistId: number;
  title: string;
  coverUrl?: string;
  coverColor?: string | null;
  format?: string | null;
  studio?: string | null;
  trailer?: AnimeTrailer | null;
}

export interface AnimeTrailer {
  id: string;
  site: string; // "youtube" | "dailymotion"
  thumbnail?: string | null;
}

export interface Story {
  id: string;
  anime: AnimeRef;
  body: string;
  author: string; // username handle
  likeCount: number;
  likedByMe: boolean;
  createdAt: string; // ISO
  mood?: string | null; // mood slug
  moodLabel?: string | null;
}

export interface Mood {
  slug: string;
  label: string;
  sort: number;
}

export interface SiteSettings {
  brandTitle: string;
  heroKicker: string;
  heroPrompt: string;
}

export interface AiringEntry {
  id: number;
  anime: AnimeRef;
  episode: number;
  airingAt: number; // unix seconds
}
