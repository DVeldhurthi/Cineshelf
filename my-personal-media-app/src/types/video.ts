export type VideoKind = "movie" | "tv";

export type VideoSeason = {
  season: number;
  episodes: number;
};

export type VidSrcUrlFormat = "query" | "path" | "legacyPath";
export type VidSrcLookupSource = "auto" | "imdb" | "tmdb";

export type Video = {
  id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  releaseYear: number;
  type: VideoKind;
  kind: VideoKind;
  year: number;
  runtime: string;
  genres: string[];
  imdbId: string;
  imdbUrl?: string;
  tmdbId?: string;
  tmdbUrl?: string;
  rating: string;
  tagline: string;
  synopsis: string;
  color: string;
  accentColor: string;
  posterUrl: string;
  backdropUrl: string;
  categories: string[];
  seriesKey?: string;
  seriesTitle?: string;
  featured?: boolean;
  isPublicDomain?: boolean;
  placeholder?: boolean;
  seasons?: VideoSeason[];
};

export type VidSrcMirror = {
  id: string;
  label: string;
  baseUrl: string;
  urlFormat: VidSrcUrlFormat;
  enabled: boolean;
};

export type ContinueWatchingEntry = {
  videoId: string;
  updatedAt: number;
  season?: number;
  episode?: number;
  mirrorId?: string;
};

export type AppSettings = {
  mirrors: VidSrcMirror[];
  activeMirrorId: string;
  warnBeforeExternalPlayer: boolean;
  vidSrcLookupSource: VidSrcLookupSource;
};
