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
}

export interface AiringEntry {
  id: number;
  anime: AnimeRef;
  episode: number;
  airingAt: number; // unix seconds
}
