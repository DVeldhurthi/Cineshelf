export type AnimeFormat = "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL" | string;
export type AnimeApiProvider = "miruro" | "consumet" | "anipub" | "jikan" | "anilist";

export type AnimeApiSource = {
  id?: string;
  label?: string;
  baseUrl: string;
  provider: AnimeApiProvider;
  providerKey?: string;
};

export type AnimeMedia = {
  id: string;
  title: string;
  nativeTitle?: string;
  romajiTitle?: string;
  description: string;
  poster: string;
  backdrop: string;
  releaseYear?: number;
  format: AnimeFormat;
  status?: string;
  episodes?: number;
  duration?: number;
  score?: number;
  popularity?: number;
  genres: string[];
  relationType?: string;
  isMature?: boolean;
  apiBaseUrl?: string;
  apiProvider?: AnimeApiProvider;
  apiProviderKey?: string;
  sourceId?: string;
};

export type AnimeApiMirror = {
  id: string;
  label: string;
  baseUrl: string;
  provider: AnimeApiProvider;
  enabled: boolean;
};

export type AnimeEpisode = {
  id: string;
  number: number;
  title: string;
  image?: string;
  description?: string;
  duration?: number;
  airDate?: string;
  provider: string;
  category: "sub" | "dub" | string;
  apiBaseUrl?: string;
  apiProvider?: AnimeApiProvider;
  apiProviderKey?: string;
};

export type AnimeEpisodeGroup = {
  provider: string;
  category: string;
  label: string;
  episodes: AnimeEpisode[];
  apiBaseUrl?: string;
  apiProvider?: AnimeApiProvider;
  apiProviderKey?: string;
};

export type AnimeStream = {
  url: string;
  type?: string;
  quality?: string;
};

export type AnimeSubtitle = {
  file: string;
  label?: string;
  kind?: string;
};

export type AnimeStreamsResponse = {
  streams: AnimeStream[];
  subtitles: AnimeSubtitle[];
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
};
