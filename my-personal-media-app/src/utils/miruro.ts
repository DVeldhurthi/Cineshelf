import { invoke } from "@tauri-apps/api/core";
import type {
  AnimeApiProvider,
  AnimeApiSource,
  AnimeEpisode,
  AnimeEpisodeGroup,
  AnimeMedia,
  AnimeStreamsResponse,
  AnimeSubtitle,
} from "../types/anime";
import { hasMatureAnimeSignals } from "./animeContentSafety";

type QueryParam = {
  key: string;
  value: string;
};

type MiruroTitle = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
};

type MiruroMedia = {
  id?: number | string;
  title?: MiruroTitle | string;
  description?: string | null;
  coverImage?: {
    large?: string | null;
    extraLarge?: string | null;
    color?: string | null;
  } | null;
  bannerImage?: string | null;
  poster?: string | null;
  image?: string | null;
  format?: string | null;
  status?: string | null;
  seasonYear?: number | null;
  year?: number | null;
  episodes?: number | null;
  duration?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  genres?: string[] | null;
  isAdult?: boolean | null;
  rating?: string | null;
  tags?: Array<{ name?: string | null; isAdult?: boolean | null }> | null;
};

type MiruroPageResponse = {
  results?: MiruroMedia[];
  suggestions?: MiruroMedia[];
};

type MiruroRelationEntry = {
  relationType?: string | null;
  type?: string | null;
  node?: MiruroMedia | null;
  media?: MiruroMedia | null;
  mediaRecommendation?: MiruroMedia | null;
};

type MiruroRelationsResponse = {
  relations?:
    | {
        edges?: MiruroRelationEntry[];
        nodes?: MiruroMedia[];
      }
    | MiruroRelationEntry[];
  edges?: MiruroRelationEntry[];
  results?: MiruroMedia[];
};

type MiruroEpisodeResponse = {
  providers?: Record<
    string,
    {
      episodes?: Record<string, unknown[]>;
    }
  >;
};

type MiruroStreamResponse = {
  streams?: unknown[];
  sources?: unknown[];
  subtitles?: unknown[];
  tracks?: unknown[];
  intro?: AnimeStreamsResponse["intro"];
  outro?: AnimeStreamsResponse["outro"];
};

type AnimeApiBaseInput = string | string[] | AnimeApiSource[];
type AnimeRequestOptions = {
  signal?: AbortSignal;
};

type ConsumetTitle = MiruroTitle | string;

type ConsumetMedia = {
  id?: string | number;
  title?: ConsumetTitle;
  description?: string | null;
  image?: string | null;
  poster?: string | null;
  cover?: string | null;
  coverImage?: MiruroMedia["coverImage"] | string | null;
  bannerImage?: string | null;
  releaseDate?: string | number | null;
  year?: number | null;
  totalEpisodes?: number | null;
  episodes?: ConsumetEpisode[] | null;
  duration?: number | null;
  status?: string | null;
  type?: string | null;
  subOrDub?: string | null;
  genres?: string[] | null;
};

type ConsumetEpisode = {
  id?: string | number;
  episodeId?: string | number;
  number?: number | string;
  episodeNumber?: number | string;
  title?: string | null;
  image?: string | null;
  description?: string | null;
  duration?: number | null;
  airDate?: string | null;
  session?: string | null;
  url?: string | null;
};

type ConsumetSearchResponse = {
  results?: ConsumetMedia[];
};

type ConsumetInfoResponse = ConsumetMedia & {
  episodes?: ConsumetEpisode[] | null;
};

type ConsumetEpisodeResponse = {
  episodes?: ConsumetEpisode[] | null;
  results?: ConsumetEpisode[] | null;
};

type ConsumetProviderDefinition = {
  key: string;
  label: string;
  searchRoutes: (query: string) => { path: string; query?: Record<string, string | number | undefined> }[];
  infoRoutes: (id: string) => { path: string; query?: Record<string, string | number | undefined> }[];
  episodeRoutes: (id: string) => { path: string; query?: Record<string, string | number | undefined> }[];
  streamRoutes: (episodeId: string) => { path: string; query?: Record<string, string | number | undefined> }[];
};

type AniPubSearchEntry = {
  Id?: string | number;
  _id?: string | number;
  Name?: string;
  Image?: string;
  ImagePath?: string;
  Cover?: string;
  finder?: string;
  DescripTion?: string;
  MALScore?: string;
  Genres?: string[];
  rating?: string;
  Rating?: string;
};

type AniPubSearchAllResponse = {
  found?: boolean;
  AniData?: AniPubSearchEntry[];
};

type AniPubEpisodeLink = {
  name?: string;
  title?: string;
  link?: string;
};

type AniPubDetailsResponse = {
  local?: AniPubSearchEntry & {
    name?: string;
    link?: string;
    ep?: AniPubEpisodeLink[];
    epCount?: number | string;
  };
};

type JikanNamedResource = {
  name?: string;
};

type JikanAnime = {
  mal_id?: number | string;
  title?: string | null;
  title_english?: string | null;
  title_japanese?: string | null;
  synopsis?: string | null;
  background?: string | null;
  images?: {
    jpg?: {
      image_url?: string | null;
      large_image_url?: string | null;
    };
    webp?: {
      image_url?: string | null;
      large_image_url?: string | null;
    };
  } | null;
  trailer?: {
    images?: {
      maximum_image_url?: string | null;
      large_image_url?: string | null;
      medium_image_url?: string | null;
    };
  } | null;
  type?: string | null;
  status?: string | null;
  year?: number | null;
  aired?: {
    prop?: {
      from?: {
        year?: number | null;
      } | null;
    } | null;
  } | null;
  episodes?: number | null;
  duration?: string | null;
  score?: number | null;
  popularity?: number | null;
  favorites?: number | null;
  rating?: string | null;
  genres?: JikanNamedResource[] | null;
  explicit_genres?: JikanNamedResource[] | null;
  themes?: JikanNamedResource[] | null;
};

type JikanListResponse = {
  data?: JikanAnime[];
};

type JikanInfoResponse = {
  data?: JikanAnime;
};

type JikanRelationEntry = {
  mal_id?: number | string;
  type?: string | null;
  name?: string | null;
};

type JikanRelationGroup = {
  relation?: string | null;
  entry?: JikanRelationEntry[];
};

type JikanRelationsResponse = {
  data?: JikanRelationGroup[];
};

type AniListTitle = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
};

type AniListMedia = {
  id?: number | string;
  idMal?: number | string | null;
  type?: string | null;
  format?: string | null;
  status?: string | null;
  title?: AniListTitle | null;
  description?: string | null;
  episodes?: number | null;
  duration?: number | null;
  seasonYear?: number | null;
  averageScore?: number | null;
  meanScore?: number | null;
  popularity?: number | null;
  genres?: string[] | null;
  isAdult?: boolean | null;
  coverImage?: {
    large?: string | null;
    extraLarge?: string | null;
  } | null;
  bannerImage?: string | null;
  relations?: {
    edges?: AniListRelationEdge[];
  } | null;
};

type AniListRelationEdge = {
  relationType?: string | null;
  node?: AniListMedia | null;
};

type AniListMediaResponse = {
  data?: {
    Media?: AniListMedia | null;
  };
  errors?: Array<{ message?: string }>;
};

type AniListPageResponse = {
  data?: {
    Page?: {
      media?: AniListMedia[];
    };
  };
  errors?: Array<{ message?: string }>;
};

export const normalizeMiruroBaseUrl = (input: string) => {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Miruro API base URL is required.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Miruro API base URL must use HTTP or HTTPS.");
  }

  const path = url.pathname.replace(/\/+$/, "");
  return `${url.origin}${path}`;
};

const inferAnimeApiProvider = (baseUrl: string): AnimeApiProvider =>
  /anilist/i.test(baseUrl)
    ? "anilist"
    : /jikan/i.test(baseUrl)
      ? "jikan"
      : /anipub/i.test(baseUrl)
      ? "anipub"
      : /consumet/i.test(baseUrl)
        ? "consumet"
        : "miruro";

const normalizeAnimeApiSource = (input: string | AnimeApiSource): AnimeApiSource => {
  if (typeof input === "string") {
    const baseUrl = normalizeMiruroBaseUrl(input);

    return {
      baseUrl,
      provider: inferAnimeApiProvider(baseUrl),
    };
  }

  const baseUrl = normalizeMiruroBaseUrl(input.baseUrl);

  return {
    ...input,
    baseUrl,
    provider: input.provider ?? inferAnimeApiProvider(baseUrl),
  };
};

const getAnimeApiSources = (input: AnimeApiBaseInput) => {
  const values = Array.isArray(input) ? input : [input];
  const seenSources = new Set<string>();

  return values
    .map(normalizeAnimeApiSource)
    .filter((source) => {
      const key = `${source.provider}:${source.baseUrl}:${source.providerKey ?? ""}`;

      if (seenSources.has(key)) {
        return false;
      }

      seenSources.add(key);
      return true;
    });
};

const getSourcesByProvider = (input: AnimeApiBaseInput, provider: AnimeApiProvider) =>
  getAnimeApiSources(input).filter((source) => source.provider === provider);

const getMiruroBaseUrls = (input: AnimeApiBaseInput) => {
  const normalizedBaseUrls = getSourcesByProvider(input, "miruro").map((source) => source.baseUrl);
  return [...new Set(normalizedBaseUrls)];
};

const getAnimeApiCacheKey = (input: AnimeApiBaseInput, provider?: AnimeApiProvider) =>
  getAnimeApiSources(input)
    .filter((source) => !provider || source.provider === provider)
    .map((source) => `${source.provider}:${source.providerKey ?? ""}:${source.baseUrl}`)
    .join("|");

const abortErrorName = "AbortError";

const createAbortError = () => new DOMException("Anime API request was aborted.", abortErrorName);

export const isAnimeRequestAbortError = (error: unknown) =>
  error instanceof DOMException
    ? error.name === abortErrorName
    : error instanceof Error && error.name === abortErrorName;

const throwIfAborted = (signal?: AbortSignal) => {
  if (signal?.aborted) {
    throw createAbortError();
  }
};

const withMiruroFallback = async <T>(
  baseInput: AnimeApiBaseInput,
  request: (baseUrl: string) => Promise<T>,
  options: AnimeRequestOptions = {},
) => {
  const baseUrls = getMiruroBaseUrls(baseInput);
  let lastError: unknown;

  if (!baseUrls.length) {
    throw new Error("No Miruro-compatible anime API mirror is enabled.");
  }

  for (const baseUrl of baseUrls) {
    throwIfAborted(options.signal);

    try {
      const response = await request(baseUrl);
      throwIfAborted(options.signal);
      return response;
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Every configured anime API mirror failed.");
};

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const getTitle = (title: MiruroMedia["title"]) => {
  if (typeof title === "string") {
    return {
      title,
      romajiTitle: title,
      nativeTitle: undefined,
    };
  }

  return {
    title: title?.english || title?.romaji || title?.native || "Untitled Anime",
    romajiTitle: title?.romaji || undefined,
    nativeTitle: title?.native || undefined,
  };
};

export const normalizeAnimeMedia = (media: MiruroMedia, source?: AnimeApiSource): AnimeMedia => {
  const title = getTitle(media.title);
  const poster = media.coverImage?.extraLarge || media.coverImage?.large || media.poster || media.image || "";
  const tagNames = media.tags?.map((tag) => tag.name).filter((name): name is string => Boolean(name)) ?? [];
  const isMature =
    Boolean(media.isAdult || media.tags?.some((tag) => tag.isAdult)) ||
    hasMatureAnimeSignals([
      title.title,
      title.romajiTitle,
      title.nativeTitle,
      media.description,
      media.format,
      media.status,
      media.rating,
      ...tagNames,
      ...(media.genres ?? []),
    ]);

  return {
    id: String(media.id ?? ""),
    ...title,
    description: stripHtml(media.description ?? ""),
    poster,
    backdrop: media.bannerImage || poster,
    releaseYear: media.seasonYear ?? media.year ?? undefined,
    format: media.format || "TV",
    status: media.status ?? undefined,
    episodes: media.episodes ?? undefined,
    duration: media.duration ?? undefined,
    score: media.averageScore ?? media.meanScore ?? undefined,
    popularity: media.popularity ?? undefined,
    genres: media.genres ?? [],
    isMature,
    apiBaseUrl: source?.baseUrl,
    apiProvider: source?.provider,
    apiProviderKey: source?.providerKey,
    sourceId: source?.id,
  };
};

const parseJikanDuration = (duration?: string | null) => {
  const match = duration?.match(/(\d+)\s*min/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
};

const normalizeJikanAnime = (media: JikanAnime, source?: AnimeApiSource): AnimeMedia => {
  const id = String(media.mal_id ?? "");
  const poster =
    media.images?.webp?.large_image_url ||
    media.images?.jpg?.large_image_url ||
    media.images?.webp?.image_url ||
    media.images?.jpg?.image_url ||
    "";
  const backdrop =
    media.trailer?.images?.maximum_image_url ||
    media.trailer?.images?.large_image_url ||
    media.trailer?.images?.medium_image_url ||
    poster;
  const genres = [
    ...(media.genres ?? []),
    ...(media.explicit_genres ?? []),
    ...(media.themes ?? []),
  ]
    .map((genre) => genre.name)
    .filter((name): name is string => Boolean(name));
  const title = media.title_english || media.title || media.title_japanese || "Untitled Anime";
  const isMature =
    /rx|hentai|r\+/i.test(media.rating ?? "") ||
    hasMatureAnimeSignals([
      title,
      media.title,
      media.title_english,
      media.title_japanese,
      media.synopsis,
      media.background,
      media.rating,
      ...genres,
    ]);

  return {
    id,
    title,
    romajiTitle: media.title ?? undefined,
    nativeTitle: media.title_japanese ?? undefined,
    description: stripHtml(media.synopsis || media.background || ""),
    poster,
    backdrop,
    releaseYear: media.year ?? media.aired?.prop?.from?.year ?? undefined,
    format: media.type || "TV",
    status: media.status ?? undefined,
    episodes: media.episodes ?? undefined,
    duration: parseJikanDuration(media.duration),
    score: media.score ?? undefined,
    popularity: media.popularity ?? media.favorites ?? undefined,
    genres,
    isMature,
    apiBaseUrl: source?.baseUrl,
    apiProvider: source?.provider,
    apiProviderKey: source?.providerKey,
    sourceId: source?.id,
  };
};

const normalizeJikanPage = (response: JikanListResponse, source?: AnimeApiSource) =>
  (response.data ?? [])
    .map((media) => normalizeJikanAnime(media, source))
    .filter((anime) => anime.id && anime.poster)
    .filter((anime, index, row) => row.findIndex((entry) => entry.id === anime.id) === index);

const getAniListTitle = (title?: AniListTitle | null) => ({
  title: title?.english || title?.romaji || title?.native || "Untitled Anime",
  romajiTitle: title?.romaji || undefined,
  nativeTitle: title?.native || undefined,
});

const normalizeAniListAnime = (
  media: AniListMedia,
  source?: AnimeApiSource,
  relationType?: string,
): AnimeMedia | null => {
  const id = String(media.idMal ?? "");

  if (!id || media.type !== "ANIME") {
    return null;
  }

  const title = getAniListTitle(media.title);
  const poster = media.coverImage?.extraLarge || media.coverImage?.large || "";
  const isMature =
    Boolean(media.isAdult) ||
    hasMatureAnimeSignals([
      title.title,
      title.romajiTitle,
      title.nativeTitle,
      media.description,
      media.format,
      media.status,
      ...(media.genres ?? []),
    ]);

  return {
    id,
    ...title,
    description: stripHtml(media.description ?? ""),
    poster,
    backdrop: media.bannerImage || poster,
    releaseYear: media.seasonYear ?? undefined,
    format: media.format || "TV",
    status: media.status ?? undefined,
    episodes: media.episodes ?? undefined,
    duration: media.duration ?? undefined,
    score: media.averageScore ?? media.meanScore ?? undefined,
    popularity: media.popularity ?? undefined,
    genres: media.genres ?? [],
    relationType,
    isMature,
    apiBaseUrl: source?.baseUrl,
    apiProvider: "anilist",
    apiProviderKey: media.id ? String(media.id) : undefined,
    sourceId: source?.id,
  };
};

function mergeUniqueAnime(...animeGroups: AnimeMedia[][]) {
  const seenIds = new Set<string>();

  return animeGroups.flat().filter((anime) => {
    if (!anime.id || seenIds.has(anime.id)) {
      return false;
    }

    seenIds.add(anime.id);
    return true;
  });
}

const miruroGet = async <T>(
  baseUrl: string,
  path: string,
  query: Record<string, string | number | undefined> = {},
  options: AnimeRequestOptions = {},
) => {
  throwIfAborted(options.signal);

  const normalizedBaseUrl = normalizeMiruroBaseUrl(baseUrl);
  const params: QueryParam[] = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([key, value]) => ({
      key,
      value: String(value),
    }));

  const response = await invoke<T>("miruro_get", {
    baseUrl: normalizedBaseUrl,
    path,
    query: params,
  });

  throwIfAborted(options.signal);
  return response;
};

const jikanGet = async <T>(
  baseUrl: string,
  path: string,
  query: Record<string, string | number | undefined> = {},
  options: AnimeRequestOptions = {},
) => {
  throwIfAborted(options.signal);

  const normalizedBaseUrl = normalizeMiruroBaseUrl(baseUrl);
  const url = new URL(path.replace(/^\/+/, ""), `${normalizedBaseUrl}/`);

  Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== "")
    .forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

  const response = await fetch(url, {
    signal: options.signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Jikan API returned HTTP ${response.status}.`);
  }

  const json = (await response.json()) as T;
  throwIfAborted(options.signal);
  return json;
};

const waitForJikanRequestWindow = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 360);
  });

const aniListGet = async <T>(
  baseUrl: string,
  query: string,
  variables: Record<string, unknown>,
  options: AnimeRequestOptions = {},
) => {
  throwIfAborted(options.signal);

  const response = await fetch(normalizeMiruroBaseUrl(baseUrl), {
    method: "POST",
    signal: options.signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList API returned HTTP ${response.status}.`);
  }

  const json = (await response.json()) as T;
  throwIfAborted(options.signal);
  return json;
};

const normalizePage = (response: MiruroPageResponse, source?: AnimeApiSource) =>
  (response.results ?? response.suggestions ?? [])
    .map((media) => normalizeAnimeMedia(media, source))
    .filter((anime) => anime.id && anime.poster);

const normalizeRelationType = (value?: string | null) =>
  value
    ? value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : undefined;

const excludedRelationTypes = new Set(["SOURCE", "ALTERNATIVE"]);
const watchableAnimeFormats = new Set(["MOVIE", "ONA", "OVA", "SPECIAL", "TV", "TV_SHORT"]);

const normalizeRelationKey = (value?: string | null) =>
  value?.trim().replace(/[\s-]+/g, "_").toUpperCase();

const shouldIncludeRelation = (value?: string | null) => {
  const relationKey = normalizeRelationKey(value);
  return !relationKey || !excludedRelationTypes.has(relationKey);
};

const isWatchableAnimeFormat = (format?: string | null) => {
  if (!format) {
    return true;
  }

  return watchableAnimeFormats.has(format.toUpperCase());
};

const normalizeRelatedAnime = (entry: MiruroRelationEntry | MiruroMedia): AnimeMedia | null => {
  const relationEntry = entry as MiruroRelationEntry;
  const relationType = relationEntry.relationType ?? relationEntry.type;

  if (!shouldIncludeRelation(relationType)) {
    return null;
  }

  const media =
    relationEntry.node ??
    relationEntry.media ??
    relationEntry.mediaRecommendation ??
    (entry as MiruroMedia);
  const anime = normalizeAnimeMedia(media);

  if (!isWatchableAnimeFormat(anime.format)) {
    return null;
  }

  const displayRelationType = normalizeRelationType(relationType);
  return displayRelationType ? { ...anime, relationType: displayRelationType } : anime;
};

const normalizeRelations = (response: MiruroRelationsResponse) => {
  const relationEntries = Array.isArray(response.relations)
    ? response.relations
    : response.relations?.edges ?? response.edges ?? [];
  const relationNodes = !Array.isArray(response.relations) ? response.relations?.nodes ?? [] : [];
  const resultNodes = response.results ?? [];
  const seenIds = new Set<string>();

  return [...relationEntries, ...relationNodes, ...resultNodes]
    .map(normalizeRelatedAnime)
    .filter((anime): anime is AnimeMedia => Boolean(anime?.id && anime.poster))
    .filter((anime) => {
      if (seenIds.has(anime.id)) {
        return false;
      }

      seenIds.add(anime.id);
      return true;
    });
};

const fetchJikanCollection = async (
  baseUrl: AnimeApiBaseInput,
  collection: "spotlight" | "trending" | "popular" | "recent" | "schedule",
  perPage = 14,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "jikan");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const route = (() => {
        if (collection === "recent") {
          return {
            path: "seasons/now",
            query: { limit: perPage },
          };
        }

        if (collection === "schedule") {
          return {
            path: "schedules",
            query: { limit: perPage },
          };
        }

        return {
          path: "top/anime",
          query: {
            filter: collection === "spotlight" ? "favorite" : "bypopularity",
            limit: perPage,
          },
        };
      })();
      const response = await jikanGet<JikanListResponse>(
        source.baseUrl,
        route.path,
        route.query,
        options,
      );
      const anime = normalizeJikanPage(response, source);

      if (anime.length) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every configured Jikan anime source failed.");
};

const fetchJikanFilter = async (
  baseUrl: AnimeApiBaseInput,
  params: Record<string, string | number | undefined>,
  options: AnimeRequestOptions = {},
) => {
  const perPage = Number(params.per_page ?? params.limit ?? 14) || 14;
  const format = typeof params.format === "string" ? params.format.toLowerCase() : undefined;
  const sources = getSourcesByProvider(baseUrl, "jikan");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await jikanGet<JikanListResponse>(
        source.baseUrl,
        "top/anime",
        {
          limit: perPage,
          type: format,
        },
        options,
      );
      const anime = normalizeJikanPage(response, source);

      if (anime.length) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every configured Jikan anime source failed.");
};

const searchJikan = async (
  baseUrl: AnimeApiBaseInput,
  query: string,
  perPage: number,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "jikan");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await jikanGet<JikanListResponse>(
        source.baseUrl,
        "anime",
        {
          q: query,
          limit: perPage,
        },
        options,
      );
      const anime = normalizeJikanPage(response, source);

      if (anime.length) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured Jikan anime source failed.");
  }

  return [];
};

const fetchJikanInfo = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "jikan");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await jikanGet<JikanInfoResponse>(
        source.baseUrl,
        `anime/${encodePathSegment(id)}`,
        {},
        options,
      );
      const anime = response.data ? normalizeJikanAnime(response.data, source) : null;

      if (anime?.id && anime.poster) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Every configured Jikan anime source failed.");
};

const aniListCollectionQuery = `
  query AnimeCollection($page: Int, $perPage: Int, $sort: [MediaSort], $season: MediaSeason, $seasonYear: Int, $format: MediaFormat, $search: String) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, sort: $sort, season: $season, seasonYear: $seasonYear, format: $format, search: $search) {
        id
        idMal
        type
        format
        status
        title {
          romaji
          english
          native
        }
        description
        episodes
        duration
        seasonYear
        averageScore
        meanScore
        popularity
        genres
        isAdult
        coverImage {
          large
          extraLarge
        }
        bannerImage
      }
    }
  }
`;

const getCurrentAniListSeason = (date = new Date()) => {
  const month = date.getMonth();

  if (month <= 2) {
    return "WINTER";
  }

  if (month <= 5) {
    return "SPRING";
  }

  if (month <= 8) {
    return "SUMMER";
  }

  return "FALL";
};

const normalizeAniListPage = (response: AniListPageResponse, source: AnimeApiSource) =>
  (response.data?.Page?.media ?? [])
    .map((media) => normalizeAniListAnime(media, source))
    .filter((anime): anime is AnimeMedia => Boolean(anime?.id && anime.poster));

const fetchAniListCollection = async (
  baseUrl: AnimeApiBaseInput,
  collection: "spotlight" | "trending" | "popular" | "recent" | "schedule",
  perPage = 14,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "anilist");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const variables = (() => {
        if (collection === "recent" || collection === "schedule") {
          return {
            page: 1,
            perPage,
            sort: ["POPULARITY_DESC"],
            season: getCurrentAniListSeason(),
            seasonYear: new Date().getFullYear(),
          };
        }

        if (collection === "spotlight") {
          return {
            page: 1,
            perPage,
            sort: ["FAVOURITES_DESC"],
          };
        }

        return {
          page: 1,
          perPage,
          sort: collection === "trending" ? ["TRENDING_DESC"] : ["POPULARITY_DESC"],
        };
      })();
      const response = await aniListGet<AniListPageResponse>(
        source.baseUrl,
        aniListCollectionQuery,
        variables,
        options,
      );

      if (response.errors?.length) {
        throw new Error(response.errors[0]?.message || "AniList API returned an error.");
      }

      const anime = normalizeAniListPage(response, source);

      if (anime.length) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured AniList collection source failed.");
  }

  return [];
};

const fetchAniListFilter = async (
  baseUrl: AnimeApiBaseInput,
  params: Record<string, string | number | undefined>,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "anilist");
  const perPage = Number(params.per_page ?? params.limit ?? 14) || 14;
  const format = typeof params.format === "string" ? params.format : undefined;
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await aniListGet<AniListPageResponse>(
        source.baseUrl,
        aniListCollectionQuery,
        {
          page: 1,
          perPage,
          sort: ["SCORE_DESC"],
          format,
        },
        options,
      );

      if (response.errors?.length) {
        throw new Error(response.errors[0]?.message || "AniList API returned an error.");
      }

      const anime = normalizeAniListPage(response, source);

      if (anime.length) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured AniList filter source failed.");
  }

  return [];
};

const searchAniList = async (
  baseUrl: AnimeApiBaseInput,
  query: string,
  perPage: number,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "anilist");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await aniListGet<AniListPageResponse>(
        source.baseUrl,
        aniListCollectionQuery,
        {
          page: 1,
          perPage,
          sort: ["SEARCH_MATCH"],
          search: query,
        },
        options,
      );

      if (response.errors?.length) {
        throw new Error(response.errors[0]?.message || "AniList API returned an error.");
      }

      const anime = normalizeAniListPage(response, source);

      if (anime.length) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured AniList search source failed.");
  }

  return [];
};

const fetchAniListInfo = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "anilist");
  const idMal = Number.parseInt(id, 10);
  let lastError: unknown;

  if (!Number.isFinite(idMal)) {
    return null;
  }

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await aniListGet<AniListMediaResponse>(
        source.baseUrl,
        aniListRelationQuery,
        { idMal },
        options,
      );

      if (response.errors?.length) {
        throw new Error(response.errors[0]?.message || "AniList API returned an error.");
      }

      const anime = response.data?.Media
        ? normalizeAniListAnime(response.data.Media, source)
        : null;

      if (anime?.id && anime.poster) {
        return anime;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured AniList info source failed.");
  }

  return null;
};

const normalizeJikanRelationType = (value?: string | null) => value?.trim() || undefined;

const fetchJikanDirectAnimeRelations = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "jikan");
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await jikanGet<JikanRelationsResponse>(
        source.baseUrl,
        `anime/${encodePathSegment(id)}/relations`,
        {},
        options,
      );
      const seenIds = new Set<string>();
      const relations = (response.data ?? [])
        .flatMap((group) =>
          (group.entry ?? [])
            .filter((entry) => entry.type === "anime")
            .map((entry) => ({
              entry,
              relationType: normalizeJikanRelationType(group.relation),
            })),
        )
        .map<AnimeMedia | null>(({ entry, relationType }) => {
          const relationId = String(entry.mal_id ?? "");
          const title = entry.name?.trim() || "";

          if (!relationId || !title || relationId === id || seenIds.has(relationId)) {
            return null;
          }

          seenIds.add(relationId);

          return {
            id: relationId,
            title,
            description: "",
            poster: "",
            backdrop: "",
            format: "TV",
            genres: [],
            relationType,
            apiBaseUrl: source.baseUrl,
            apiProvider: "jikan",
            sourceId: source.id,
          };
        })
        .filter((anime): anime is AnimeMedia => Boolean(anime));

      if (relations.length) {
        const detailedRelations: AnimeMedia[] = [];

        for (const relation of relations) {
          throwIfAborted(options.signal);

          try {
            const detailResponse = await jikanGet<JikanInfoResponse>(
              source.baseUrl,
              `anime/${encodePathSegment(relation.id)}`,
              {},
              options,
            );
            const detailedAnime = detailResponse.data
              ? normalizeJikanAnime(detailResponse.data, source)
              : null;

            detailedRelations.push(
              detailedAnime?.id
                ? {
                    ...detailedAnime,
                    relationType: relation.relationType,
                  }
                : relation,
            );
          } catch (error) {
            if (isAnimeRequestAbortError(error)) {
              throw error;
            }

            detailedRelations.push(relation);
          }

          await waitForJikanRequestWindow();
        }

        return detailedRelations;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured Jikan relation source failed.");
  }

  return [];
};

const aniListRelationQuery = `
  query AnimeRelations($idMal: Int) {
    Media(idMal: $idMal, type: ANIME) {
      relations {
        edges {
          relationType
          node {
            id
            idMal
            type
            format
            status
            title {
              romaji
              english
              native
            }
            description
            episodes
            duration
            seasonYear
            averageScore
            meanScore
            popularity
            genres
            isAdult
            coverImage {
              large
              extraLarge
            }
            bannerImage
          }
        }
      }
    }
  }
`;

const fetchAniListDirectAnimeRelations = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const sources = getSourcesByProvider(baseUrl, "anilist");
  const idMal = Number.parseInt(id, 10);
  let lastError: unknown;

  if (!Number.isFinite(idMal)) {
    return [];
  }

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      const response = await aniListGet<AniListMediaResponse>(
        source.baseUrl,
        aniListRelationQuery,
        { idMal },
        options,
      );

      if (response.errors?.length) {
        throw new Error(response.errors[0]?.message || "AniList API returned an error.");
      }

      const seenIds = new Set<string>();
      const relations = (response.data?.Media?.relations?.edges ?? [])
        .map((edge) =>
          edge.node
            ? normalizeAniListAnime(edge.node, source, normalizeRelationType(edge.relationType))
            : null,
        )
        .filter((anime): anime is AnimeMedia => Boolean(anime?.id && anime.id !== id))
        .filter((anime) => {
          if (seenIds.has(anime.id)) {
            return false;
          }

          seenIds.add(anime.id);
          return true;
        });

      if (relations.length) {
        return relations;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error("Every configured AniList relation source failed.");
  }

  return [];
};

export const fetchAnimeCollection = async (
  baseUrl: AnimeApiBaseInput,
  collection: "spotlight" | "trending" | "popular" | "recent" | "schedule",
  perPage = 14,
  options: AnimeRequestOptions = {},
) => {
  const [miruroResults, jikanResults, aniListResults] = await Promise.all([
    withMiruroFallback(baseUrl, async (nextBaseUrl) => {
      const source = { baseUrl: nextBaseUrl, provider: "miruro" as const };
      const response = await miruroGet<MiruroPageResponse>(nextBaseUrl, collection, {
        page: 1,
        per_page: perPage,
      }, options);

      return normalizePage(response, source);
    }, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    fetchJikanCollection(baseUrl, collection, perPage, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    fetchAniListCollection(baseUrl, collection, perPage, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
  ]);

  return mergeUniqueAnime(jikanResults, aniListResults, miruroResults);
};

export const fetchAnimeFilter = async (
  baseUrl: AnimeApiBaseInput,
  params: Record<string, string | number | undefined>,
  options: AnimeRequestOptions = {},
) => {
  const [miruroResults, jikanResults, aniListResults] = await Promise.all([
    withMiruroFallback(baseUrl, async (nextBaseUrl) => {
      const source = { baseUrl: nextBaseUrl, provider: "miruro" as const };
      const response = await miruroGet<MiruroPageResponse>(nextBaseUrl, "filter", params, options);
      return normalizePage(response, source);
    }, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    fetchJikanFilter(baseUrl, params, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    fetchAniListFilter(baseUrl, params, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
  ]);

  return mergeUniqueAnime(jikanResults, aniListResults, miruroResults);
};

export const searchAnime = async (
  baseUrl: AnimeApiBaseInput,
  query: string,
  perPage = 16,
  options: AnimeRequestOptions = {},
) => {
  const [miruroResults, jikanResults, aniListResults, aniPubResults] = await Promise.all([
    withMiruroFallback(baseUrl, async (nextBaseUrl) => {
      const source = { baseUrl: nextBaseUrl, provider: "miruro" as const };
      const response = await miruroGet<MiruroPageResponse>(nextBaseUrl, "search", {
        query,
        page: 1,
        per_page: perPage,
      }, options);

      return normalizePage(response, source);
    }, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    searchJikan(baseUrl, query, perPage, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    searchAniList(baseUrl, query, perPage, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
    searchAniPub(baseUrl, query, perPage, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AnimeMedia[];
    }),
  ]);

  return mergeUniqueAnime(jikanResults, aniListResults, miruroResults, aniPubResults);
};

export const fetchAnimeInfo = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const miruroAnime = await withMiruroFallback(baseUrl, async (nextBaseUrl) => {
    const source = { baseUrl: nextBaseUrl, provider: "miruro" as const };
    const response = await miruroGet<MiruroMedia>(
      nextBaseUrl,
      `info/${encodeURIComponent(id)}`,
      {},
      options,
    );
    const anime = normalizeAnimeMedia(response, source);

    if (!anime.id || !anime.poster) {
      throw new Error(`Anime API mirror ${nextBaseUrl} did not return usable details.`);
    }

    return anime;
  }, options).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return null;
  });

  if (miruroAnime) {
    return miruroAnime;
  }

  const aniListAnime = await fetchAniListInfo(baseUrl, id, options).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return null;
  });

  if (aniListAnime) {
    return aniListAnime;
  }

  return fetchJikanInfo(baseUrl, id, options);
};

const directRelationCache = new Map<string, Promise<AnimeMedia[]>>();
const sameSeriesCache = new Map<string, AnimeMedia[]>();
const maxSameSeriesDepth = 8;
const maxSameSeriesFrontier = 12;
const maxSameSeriesResults = 40;

const sortSameSeries = (anime: AnimeMedia[]) =>
  [...anime].sort((first, second) => {
    const firstYear = first.releaseYear ?? Number.MAX_SAFE_INTEGER;
    const secondYear = second.releaseYear ?? Number.MAX_SAFE_INTEGER;

    if (firstYear !== secondYear) {
      return firstYear - secondYear;
    }

    return first.title.localeCompare(second.title);
  });

const fetchDirectAnimeRelations = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const miruroRelations = await withMiruroFallback(baseUrl, async (nextBaseUrl) => {
    try {
      const response = await miruroGet<MiruroRelationsResponse>(
        nextBaseUrl,
        `anime/${encodeURIComponent(id)}/relations`,
        {},
        options,
      );

      return normalizeRelations(response).filter((anime) => anime.id !== id);
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      const response = await miruroGet<MiruroRelationsResponse & MiruroMedia>(
        nextBaseUrl,
        `info/${encodeURIComponent(id)}`,
        {},
        options,
      );

      return normalizeRelations(response).filter((anime) => anime.id !== id);
    }
  }, options).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return [] as AnimeMedia[];
  });

  if (miruroRelations.length) {
    return miruroRelations;
  }

  const aniListRelations = await fetchAniListDirectAnimeRelations(baseUrl, id, options).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return [] as AnimeMedia[];
  });

  if (aniListRelations.length) {
    return aniListRelations;
  }

  const jikanRelations = await fetchJikanDirectAnimeRelations(baseUrl, id, options);
  return mergeUniqueAnime(jikanRelations);
};

const getCachedDirectAnimeRelations = (baseUrl: AnimeApiBaseInput, id: string) => {
  const cacheKey = `${getAnimeApiCacheKey(baseUrl)}:${id}`;
  const cachedRelations = directRelationCache.get(cacheKey);

  if (cachedRelations) {
    return cachedRelations;
  }

  const request = fetchDirectAnimeRelations(baseUrl, id).catch((error: unknown) => {
    directRelationCache.delete(cacheKey);
    throw error;
  });

  directRelationCache.set(cacheKey, request);
  return request;
};

export const fetchAnimeSameSeries = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  options: AnimeRequestOptions = {},
) => {
  const cacheKey = `${getAnimeApiCacheKey(baseUrl)}:${id}`;
  const cachedSeries = sameSeriesCache.get(cacheKey);

  if (!options.signal && cachedSeries) {
    return cachedSeries;
  }

  const hasGraphRelationSource =
    getMiruroBaseUrls(baseUrl).length > 0 || getSourcesByProvider(baseUrl, "anilist").length > 0;

  if (getSourcesByProvider(baseUrl, "jikan").length && !hasGraphRelationSource) {
    const directSameSeries = sortSameSeries(
      await fetchDirectAnimeRelations(baseUrl, id, options),
    );

    if (!options.signal) {
      sameSeriesCache.set(cacheKey, directSameSeries);
    }

    return directSameSeries;
  }

  const visitedIds = new Set([id]);
  const collected = new Map<string, AnimeMedia>();
  let frontier = [id];

  for (let depth = 0; depth < maxSameSeriesDepth && frontier.length > 0; depth += 1) {
    throwIfAborted(options.signal);

    const relationGroups = await Promise.all(
      frontier.map((frontierId) =>
        (options.signal
          ? fetchDirectAnimeRelations(baseUrl, frontierId, options)
          : getCachedDirectAnimeRelations(baseUrl, frontierId)
        ).catch((error) => {
          if (isAnimeRequestAbortError(error)) {
            throw error;
          }

          return [] as AnimeMedia[];
        }),
      ),
    );
    throwIfAborted(options.signal);

    const nextFrontier: string[] = [];

    relationGroups.flat().forEach((anime) => {
      if (visitedIds.has(anime.id) || collected.size >= maxSameSeriesResults) {
        return;
      }

      visitedIds.add(anime.id);
      collected.set(anime.id, anime);
      nextFrontier.push(anime.id);
    });

    frontier = nextFrontier.slice(0, maxSameSeriesFrontier);
  }

  const sameSeries = sortSameSeries([...collected.values()]);
  if (!options.signal) {
    sameSeriesCache.set(cacheKey, sameSeries);
  }

  return sameSeries;
};

const normalizeEpisode = (
  rawEpisode: unknown,
  provider: string,
  category: string,
  apiBaseUrl: string,
  apiProvider: AnimeApiProvider = "miruro",
  apiProviderKey?: string,
): AnimeEpisode | null => {
  if (!rawEpisode || typeof rawEpisode !== "object") {
    return null;
  }

  const episode = rawEpisode as Record<string, unknown>;
  const id = typeof episode.id === "string" ? episode.id : "";
  const number = typeof episode.number === "number" ? episode.number : Number(episode.number ?? 0);

  if (!id || !Number.isFinite(number)) {
    return null;
  }

  return {
    id,
    number,
    title: typeof episode.title === "string" && episode.title ? episode.title : `Episode ${number}`,
    image: typeof episode.image === "string" ? episode.image : undefined,
    description: typeof episode.description === "string" ? stripHtml(episode.description) : undefined,
    duration: typeof episode.duration === "number" ? episode.duration : undefined,
    airDate: typeof episode.airDate === "string" ? episode.airDate : undefined,
    provider,
    category,
    apiBaseUrl,
    apiProvider,
    apiProviderKey,
  };
};

const normalizeEpisodeGroups = (
  response: MiruroEpisodeResponse,
  apiBaseUrl: string,
): AnimeEpisodeGroup[] => {
  const providers = response.providers ?? {};

  return Object.entries(providers)
    .flatMap(([provider, providerData]) =>
      Object.entries(providerData.episodes ?? {}).map(([category, rawEpisodes]) => {
        const episodes = rawEpisodes
          .map((episode) => normalizeEpisode(episode, provider, category, apiBaseUrl))
          .filter((episode): episode is AnimeEpisode => Boolean(episode))
          .sort((first, second) => first.number - second.number);

        return {
          provider,
          category,
          label: `${provider.toUpperCase()} ${category.toUpperCase()}`,
          episodes,
          apiBaseUrl,
          apiProvider: "miruro" as const,
        };
      }),
    )
    .filter((group) => group.episodes.length > 0)
    .sort((first, second) => {
      if (first.category !== second.category) {
        return first.category === "sub" ? -1 : 1;
      }

      return first.provider.localeCompare(second.provider);
    });
};

const encodePathSegment = (value: string | number) => encodeURIComponent(String(value));

const consumetProviderDefinitions: ConsumetProviderDefinition[] = [
  {
    key: "hianime",
    label: "HiAnime",
    searchRoutes: (query) => [
      { path: `anime/hianime/${encodePathSegment(query)}` },
      { path: "anime/hianime/search", query: { q: query } },
      { path: "anime/hianime/search", query: { query } },
    ],
    infoRoutes: (id) => [
      { path: "anime/hianime/info", query: { id } },
      { path: `anime/hianime/info/${encodePathSegment(id)}` },
    ],
    episodeRoutes: (id) => [
      { path: `anime/hianime/episodes/${encodePathSegment(id)}` },
      { path: "anime/hianime/episodes", query: { id } },
    ],
    streamRoutes: (episodeId) => [
      { path: "anime/hianime/watch", query: { episodeId, server: "hd-1", category: "sub" } },
      { path: "anime/hianime/watch", query: { episodeId, server: "hd-2", category: "sub" } },
      { path: "anime/hianime/watch", query: { episodeId } },
      { path: `anime/hianime/watch/${encodePathSegment(episodeId)}` },
    ],
  },
  {
    key: "zoro",
    label: "HiAnime Legacy",
    searchRoutes: (query) => [
      { path: `anime/zoro/${encodePathSegment(query)}` },
      { path: "anime/zoro/search", query: { q: query } },
      { path: "anime/zoro/search", query: { query } },
    ],
    infoRoutes: (id) => [
      { path: "anime/zoro/info", query: { id } },
      { path: `anime/zoro/info/${encodePathSegment(id)}` },
    ],
    episodeRoutes: (id) => [
      { path: `anime/zoro/episodes/${encodePathSegment(id)}` },
      { path: "anime/zoro/episodes", query: { id } },
    ],
    streamRoutes: (episodeId) => [
      { path: "anime/zoro/watch", query: { episodeId, server: "vidcloud" } },
      { path: "anime/zoro/watch", query: { episodeId, server: "vidstreaming" } },
      { path: "anime/zoro/watch", query: { episodeId } },
      { path: `anime/zoro/watch/${encodePathSegment(episodeId)}` },
    ],
  },
  {
    key: "animepahe",
    label: "AnimePahe",
    searchRoutes: (query) => [
      { path: `anime/animepahe/${encodePathSegment(query)}` },
      { path: `anime/animepahe/search/${encodePathSegment(query)}` },
      { path: "anime/animepahe/search", query: { q: query } },
      { path: "anime/animepahe/search", query: { query } },
    ],
    infoRoutes: (id) => [
      { path: `anime/animepahe/info/${encodePathSegment(id)}` },
      { path: "anime/animepahe/info", query: { id } },
    ],
    episodeRoutes: (id) => [
      { path: `anime/animepahe/episodes/${encodePathSegment(id)}` },
      { path: "anime/animepahe/episodes", query: { id } },
    ],
    streamRoutes: (episodeId) => {
      const [animeId, session] = episodeId.split("::");

      return [
        ...(animeId && session
          ? [{ path: `anime/animepahe/episode/${encodePathSegment(animeId)}/${encodePathSegment(session)}` }]
          : []),
        { path: `anime/animepahe/watch/${encodePathSegment(session || episodeId)}` },
        { path: "anime/animepahe/watch", query: { episodeId: session || episodeId } },
        { path: `anime/animepahe/watch/${encodePathSegment(episodeId)}` },
      ];
    },
  },
  {
    key: "gogoanime",
    label: "GogoAnime",
    searchRoutes: (query) => [
      { path: `anime/gogoanime/${encodePathSegment(query)}` },
      { path: `anime/gogoanime/search/${encodePathSegment(query)}` },
      { path: "anime/gogoanime/search", query: { q: query } },
      { path: "anime/gogoanime/search", query: { query } },
    ],
    infoRoutes: (id) => [
      { path: `anime/gogoanime/info/${encodePathSegment(id)}` },
      { path: "anime/gogoanime/info", query: { id } },
    ],
    episodeRoutes: (id) => [
      { path: `anime/gogoanime/episodes/${encodePathSegment(id)}` },
      { path: "anime/gogoanime/episodes", query: { id } },
    ],
    streamRoutes: (episodeId) => [
      { path: `anime/gogoanime/watch/${encodePathSegment(episodeId)}` },
      { path: "anime/gogoanime/watch", query: { episodeId, server: "gogocdn" } },
      { path: "anime/gogoanime/watch", query: { episodeId, server: "vidstreaming" } },
      { path: "anime/gogoanime/watch", query: { episodeId } },
    ],
  },
];

const getConsumetTitleValues = (title: ConsumetTitle | undefined) => {
  if (!title) {
    return [];
  }

  if (typeof title === "string") {
    return [title];
  }

  return [title.english, title.romaji, title.native].filter((value): value is string => Boolean(value));
};

const normalizeSearchValue = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getAnimeTitleCandidates = (anime?: AnimeMedia | null) => {
  if (!anime) {
    return [];
  }

  const seenTitles = new Set<string>();
  return [anime.title, anime.romajiTitle, anime.nativeTitle]
    .filter((value): value is string => Boolean(value?.trim()))
    .filter((title) => {
      const key = normalizeSearchValue(title) || title.trim().toLowerCase();

      if (seenTitles.has(key)) {
        return false;
      }

      seenTitles.add(key);
      return true;
    });
};

const scoreConsumetCandidate = (candidate: ConsumetMedia, query: string) => {
  const normalizedQuery = normalizeSearchValue(query);
  const candidateTitles = getConsumetTitleValues(candidate.title).map(normalizeSearchValue).filter(Boolean);

  if (!candidateTitles.length || !normalizedQuery) {
    return 1;
  }

  if (candidateTitles.some((title) => title === normalizedQuery)) {
    return 100;
  }

  if (candidateTitles.some((title) => title.includes(normalizedQuery) || normalizedQuery.includes(title))) {
    return 80;
  }

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length && candidateTitles.some((title) => queryWords.every((word) => title.includes(word)))) {
    return 60;
  }

  return 0;
};

const fetchFirstJson = async <T>(
  baseUrl: string,
  routes: { path: string; query?: Record<string, string | number | undefined> }[],
  options: AnimeRequestOptions = {},
) => {
  let lastError: unknown;

  for (const route of routes) {
    throwIfAborted(options.signal);

    try {
      return await miruroGet<T>(baseUrl, route.path, route.query, options);
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Anime API request failed.");
};

const normalizeConsumetSearchResponse = (response: ConsumetSearchResponse | ConsumetMedia[]) =>
  (Array.isArray(response) ? response : response.results ?? []).filter((media) => Boolean(media.id));

const findBestConsumetMatch = (results: ConsumetMedia[], queries: string[]) => {
  const scored = results
    .map((result, index) => ({
      result,
      index,
      score: Math.max(...queries.map((query) => scoreConsumetCandidate(result, query))),
    }))
    .sort((first, second) => second.score - first.score || first.index - second.index);

  return scored[0]?.result ?? null;
};

const normalizeConsumetEpisode = (
  episode: ConsumetEpisode,
  provider: ConsumetProviderDefinition,
  category: string,
  source: AnimeApiSource,
): AnimeEpisode | null => {
  const rawId = episode.id ?? episode.episodeId;
  const rawNumber = episode.number ?? episode.episodeNumber;
  const number = typeof rawNumber === "number" ? rawNumber : Number(rawNumber ?? 0);
  const id =
    provider.key === "animepahe" && episode.session && rawId
      ? `${String(rawId)}::${episode.session}`
      : String(rawId ?? "");

  if (!id || !Number.isFinite(number)) {
    return null;
  }

  return {
    id,
    number,
    title: episode.title?.trim() || `Episode ${number}`,
    image: episode.image ?? undefined,
    description: episode.description ? stripHtml(episode.description) : undefined,
    duration: episode.duration ?? undefined,
    airDate: episode.airDate ?? undefined,
    provider: provider.label,
    category,
    apiBaseUrl: source.baseUrl,
    apiProvider: "consumet",
    apiProviderKey: provider.key,
  };
};

const extractConsumetEpisodes = (response: ConsumetInfoResponse | ConsumetEpisodeResponse | ConsumetEpisode[]) => {
  if (Array.isArray(response)) {
    return response;
  }

  const episodeContainer = response as ConsumetEpisodeResponse;
  return response.episodes ?? episodeContainer.results ?? [];
};

const fetchConsumetProviderEpisodes = async (
  source: AnimeApiSource,
  provider: ConsumetProviderDefinition,
  titleCandidates: string[],
  options: AnimeRequestOptions = {},
): Promise<AnimeEpisodeGroup | null> => {
  if (!titleCandidates.length) {
    return null;
  }

  let matchedMedia: ConsumetMedia | null = null;

  for (const title of titleCandidates) {
    throwIfAborted(options.signal);

    try {
      const searchResponse = await fetchFirstJson<ConsumetSearchResponse | ConsumetMedia[]>(
        source.baseUrl,
        provider.searchRoutes(title),
        options,
      );
      const searchResults = normalizeConsumetSearchResponse(searchResponse);
      matchedMedia = findBestConsumetMatch(searchResults, titleCandidates);

      if (matchedMedia?.id) {
        break;
      }
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      matchedMedia = null;
    }
  }

  if (!matchedMedia?.id) {
    return null;
  }

  const mediaId = String(matchedMedia.id);
  let infoResponse: ConsumetInfoResponse | null = null;
  let episodes: ConsumetEpisode[] = [];

  try {
    infoResponse = await fetchFirstJson<ConsumetInfoResponse>(
      source.baseUrl,
      provider.infoRoutes(mediaId),
      options,
    );
    episodes = extractConsumetEpisodes(infoResponse);
  } catch (error) {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    infoResponse = null;
  }

  if (!episodes.length) {
    try {
      const episodeResponse = await fetchFirstJson<ConsumetEpisodeResponse | ConsumetEpisode[]>(
        source.baseUrl,
        provider.episodeRoutes(mediaId),
        options,
      );
      episodes = extractConsumetEpisodes(episodeResponse);
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      episodes = [];
    }
  }

  const normalizedEpisodes = episodes
    .map((episode) =>
      normalizeConsumetEpisode(
        episode,
        provider,
        infoResponse?.subOrDub || matchedMedia.subOrDub || "sub",
        source,
      ),
    )
    .filter((episode): episode is AnimeEpisode => Boolean(episode))
    .sort((first, second) => first.number - second.number);

  if (!normalizedEpisodes.length) {
    return null;
  }

  const category = normalizedEpisodes[0]?.category ?? "sub";

  return {
    provider: provider.label,
    category,
    label: `${provider.label} ${category.toUpperCase()}`,
    episodes: normalizedEpisodes,
    apiBaseUrl: source.baseUrl,
    apiProvider: "consumet",
    apiProviderKey: provider.key,
  };
};

const fetchConsumetEpisodeGroups = async (
  baseUrl: AnimeApiBaseInput,
  anime?: AnimeMedia | null,
  options: AnimeRequestOptions = {},
): Promise<AnimeEpisodeGroup[]> => {
  const sources = getSourcesByProvider(baseUrl, "consumet");
  const titleCandidates = getAnimeTitleCandidates(anime);

  if (!sources.length || !titleCandidates.length) {
    return [];
  }

  const providerRequests = sources.flatMap((source) =>
    consumetProviderDefinitions.map((provider) =>
      fetchConsumetProviderEpisodes(source, provider, titleCandidates, options).catch((error) => {
        if (isAnimeRequestAbortError(error)) {
          throw error;
        }

        return null;
      }),
    ),
  );
  const groups = await Promise.all(providerRequests);
  throwIfAborted(options.signal);
  const seenGroups = new Set<string>();

  return groups
    .filter((group): group is AnimeEpisodeGroup => Boolean(group?.episodes.length))
    .filter((group) => {
      const key = `${group.apiBaseUrl}:${group.apiProviderKey}:${group.category}`;

      if (seenGroups.has(key)) {
        return false;
      }

      seenGroups.add(key);
      return true;
    });
};

const getAniPubTitleValues = (entry: AniPubSearchEntry) =>
  [entry.Name, entry.finder]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.replace(/[-_]+/g, " "));

const scoreAniPubCandidate = (candidate: AniPubSearchEntry, query: string) => {
  const normalizedQuery = normalizeSearchValue(query);
  const candidateTitles = getAniPubTitleValues(candidate).map(normalizeSearchValue).filter(Boolean);

  if (!candidateTitles.length || !normalizedQuery) {
    return 1;
  }

  if (candidateTitles.some((title) => title === normalizedQuery)) {
    return 100;
  }

  if (candidateTitles.some((title) => title.includes(normalizedQuery) || normalizedQuery.includes(title))) {
    return 80;
  }

  const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
  if (queryWords.length && candidateTitles.some((title) => queryWords.every((word) => title.includes(word)))) {
    return 60;
  }

  return 0;
};

const normalizeAniPubSearchResponse = (response: AniPubSearchEntry[] | AniPubSearchAllResponse) =>
  (Array.isArray(response) ? response : response.AniData ?? []).filter(
    (entry) => Boolean(entry.Id ?? entry._id),
  );

const findBestAniPubMatch = (results: AniPubSearchEntry[], queries: string[]) => {
  const scored = results
    .map((result, index) => ({
      result,
      index,
      score: Math.max(...queries.map((query) => scoreAniPubCandidate(result, query))),
    }))
    .sort((first, second) => second.score - first.score || first.index - second.index);

  return scored[0]?.result ?? null;
};

const normalizeAniPubMedia = (entry: AniPubSearchEntry, source: AnimeApiSource): AnimeMedia => {
  const id = String(entry.Id ?? entry._id ?? "");
  const poster = entry.Image || entry.ImagePath || entry.Cover || "";
  const isMature = hasMatureAnimeSignals([
    entry.Name,
    entry.finder,
    entry.DescripTion,
    entry.rating,
    entry.Rating,
    ...(entry.Genres ?? []),
  ]);

  return {
    id,
    title: entry.Name || "Untitled Anime",
    description: stripHtml(entry.DescripTion ?? ""),
    poster,
    backdrop: entry.Cover || poster,
    format: "TV",
    score: entry.MALScore ? Number.parseFloat(entry.MALScore) || undefined : undefined,
    genres: entry.Genres ?? [],
    isMature,
    apiBaseUrl: source.baseUrl,
    apiProvider: "anipub",
    apiProviderKey: "anipub",
    sourceId: source.id,
  };
};

const fetchAniPubSearch = async (
  source: AnimeApiSource,
  query: string,
  options: AnimeRequestOptions = {},
) => {
  const searchResults = await fetchFirstJson<AniPubSearchEntry[]>(
    source.baseUrl,
    [{ path: `api/search/${encodePathSegment(query)}` }],
    options,
  ).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return [] as AniPubSearchEntry[];
  });

  if (searchResults.length) {
    return normalizeAniPubSearchResponse(searchResults);
  }

  const searchAllResults = await fetchFirstJson<AniPubSearchAllResponse>(
    source.baseUrl,
    [{ path: `api/searchall/${encodePathSegment(query)}` }],
    options,
  ).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return { AniData: [] } satisfies AniPubSearchAllResponse;
  });

  return normalizeAniPubSearchResponse(searchAllResults);
};

const fetchAniPubProviderEpisodes = async (
  source: AnimeApiSource,
  titleCandidates: string[],
  options: AnimeRequestOptions = {},
): Promise<AnimeEpisodeGroup | null> => {
  if (!titleCandidates.length) {
    return null;
  }

  let matchedMedia: AniPubSearchEntry | null = null;

  for (const title of titleCandidates) {
    throwIfAborted(options.signal);

    const searchResults = await fetchAniPubSearch(source, title, options).catch((error) => {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      return [] as AniPubSearchEntry[];
    });
    matchedMedia = findBestAniPubMatch(searchResults, titleCandidates);

    if (matchedMedia?.Id ?? matchedMedia?._id) {
      break;
    }
  }

  const mediaId = matchedMedia?.Id ?? matchedMedia?._id;

  if (!mediaId) {
    return null;
  }

  const details = await fetchFirstJson<AniPubDetailsResponse>(
    source.baseUrl,
    [
      { path: `v1/api/details/${encodePathSegment(mediaId)}` },
      { path: `anime/api/details/${encodePathSegment(mediaId)}` },
    ],
    options,
  ).catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return null;
  });
  const local = details?.local;

  if (!local) {
    return null;
  }

  const episodeLinks = [
    local.link ? { name: local.name ?? "Episode 1", link: local.link } : null,
    ...(local.ep ?? []),
  ].filter((episode): episode is AniPubEpisodeLink => Boolean(episode?.link));
  const episodes = episodeLinks
    .map<AnimeEpisode | null>((episode, index) => {
      const rawUrl = episode.link ?? "";
      const url = rawUrl.replace(/^src=/i, "").match(/https?:\/\/[^\s"']+/)?.[0] ?? "";

      if (!url) {
        return null;
      }

      const category = (() => {
        try {
          return new URL(url).searchParams.get("type") || "embed";
        } catch {
          return "embed";
        }
      })();
      const number = index + 1;

      return {
        id: url,
        number,
        title: episode.name || episode.title || `Episode ${number}`,
        provider: "AniPub",
        category,
        apiBaseUrl: source.baseUrl,
        apiProvider: "anipub" as const,
        apiProviderKey: "anipub",
      };
    })
    .filter((episode): episode is AnimeEpisode => Boolean(episode));

  if (!episodes.length) {
    return null;
  }

  const category = episodes[0]?.category ?? "embed";

  return {
    provider: "AniPub",
    category,
    label: `AniPub ${category.toUpperCase()}`,
    episodes,
    apiBaseUrl: source.baseUrl,
    apiProvider: "anipub",
    apiProviderKey: "anipub",
  };
};

const fetchAniPubEpisodeGroups = async (
  baseUrl: AnimeApiBaseInput,
  anime?: AnimeMedia | null,
  options: AnimeRequestOptions = {},
): Promise<AnimeEpisodeGroup[]> => {
  const sources = getSourcesByProvider(baseUrl, "anipub");
  const titleCandidates = getAnimeTitleCandidates(anime);

  if (!sources.length || !titleCandidates.length) {
    return [];
  }

  const groups = await Promise.all(
    sources.map((source) =>
      fetchAniPubProviderEpisodes(source, titleCandidates, options).catch((error) => {
        if (isAnimeRequestAbortError(error)) {
          throw error;
        }

        return null;
      }),
    ),
  );
  throwIfAborted(options.signal);

  return groups.filter((group): group is AnimeEpisodeGroup => Boolean(group?.episodes.length));
};

const searchAniPub = async (
  baseUrl: AnimeApiBaseInput,
  query: string,
  perPage: number,
  options: AnimeRequestOptions = {},
): Promise<AnimeMedia[]> => {
  const sources = getSourcesByProvider(baseUrl, "anipub");
  const seenIds = new Set<string>();
  const results = (
    await Promise.all(
      sources.map(async (source) =>
        (await fetchAniPubSearch(source, query, options).catch((error) => {
          if (isAnimeRequestAbortError(error)) {
            throw error;
          }

          return [] as AniPubSearchEntry[];
        }))
          .slice(0, perPage)
          .map((entry) => normalizeAniPubMedia(entry, source)),
      ),
    )
  ).flat();
  throwIfAborted(options.signal);

  return results.filter((anime) => {
    const key = `${anime.apiBaseUrl}:${anime.id}`;

    if (!anime.id || seenIds.has(key)) {
      return false;
    }

    seenIds.add(key);
    return true;
  });
};

export const fetchAnimeEpisodes = async (
  baseUrl: AnimeApiBaseInput,
  id: string,
  anime?: AnimeMedia | null,
  options: AnimeRequestOptions = {},
): Promise<AnimeEpisodeGroup[]> => {
  const baseUrls = getMiruroBaseUrls(baseUrl);
  let lastGroups: AnimeEpisodeGroup[] = [];

  for (const nextBaseUrl of baseUrls) {
    throwIfAborted(options.signal);

    try {
      const response = await miruroGet<MiruroEpisodeResponse>(
        nextBaseUrl,
        `episodes/${encodeURIComponent(id)}`,
        {},
        options,
      );
      const groups = normalizeEpisodeGroups(response, nextBaseUrl);

      if (groups.length > 0) {
        return groups;
      }

      lastGroups = groups;
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastGroups = [];
    }
  }

  const aniPubGroups = await fetchAniPubEpisodeGroups(baseUrl, anime, options);
  if (aniPubGroups.length) {
    return aniPubGroups;
  }

  const fallbackGroups = await fetchConsumetEpisodeGroups(baseUrl, anime, options);
  return fallbackGroups.length ? fallbackGroups : lastGroups;
};

const normalizeStream = (stream: unknown) => {
  if (!stream || typeof stream !== "object") {
    return null;
  }

  const streamRecord = stream as Record<string, unknown>;
  const url = typeof streamRecord.url === "string" ? streamRecord.url : "";

  if (!url) {
    return null;
  }

  return {
    url,
    type: typeof streamRecord.type === "string" ? streamRecord.type : undefined,
    quality: typeof streamRecord.quality === "string" ? streamRecord.quality : undefined,
  };
};

const normalizeSubtitle = (subtitle: unknown): AnimeSubtitle | null => {
  if (!subtitle || typeof subtitle !== "object") {
    return null;
  }

  const subtitleRecord = subtitle as Record<string, unknown>;
  const file = typeof subtitleRecord.file === "string" ? subtitleRecord.file : "";

  if (!file) {
    return null;
  }

  return {
    file,
    label: typeof subtitleRecord.label === "string" ? subtitleRecord.label : undefined,
    kind: typeof subtitleRecord.kind === "string" ? subtitleRecord.kind : undefined,
  };
};

const normalizeStreamsResponse = (response: MiruroStreamResponse): AnimeStreamsResponse => {
  const rawStreams = response.streams ?? response.sources ?? [];
  const streams = rawStreams
    .map(normalizeStream)
    .filter((stream): stream is NonNullable<typeof stream> => Boolean(stream));
  const subtitles = (response.subtitles ?? response.tracks ?? [])
    .map(normalizeSubtitle)
    .filter((subtitle): subtitle is AnimeSubtitle => Boolean(subtitle));

  return {
    streams,
    subtitles,
    intro: response.intro,
    outro: response.outro,
  };
};

const fetchConsumetStreams = async (
  source: AnimeApiSource,
  episodeId: string,
  options: AnimeRequestOptions = {},
): Promise<AnimeStreamsResponse> => {
  const provider = consumetProviderDefinitions.find(
    (definition) => definition.key === source.providerKey,
  );

  if (!provider) {
    throw new Error("Select a Consumet episode source before loading this stream.");
  }

  const response = await fetchFirstJson<MiruroStreamResponse>(
    source.baseUrl,
    provider.streamRoutes(episodeId),
    options,
  );
  const streamsResponse = normalizeStreamsResponse(response);

  if (!streamsResponse.streams.length) {
    throw new Error(`${provider.label} did not return playable streams.`);
  }

  return streamsResponse;
};

export const fetchAnimeStreams = async (
  baseUrl: AnimeApiBaseInput,
  episodeId: string,
  options: AnimeRequestOptions = {},
): Promise<AnimeStreamsResponse> => {
  const sources = getAnimeApiSources(baseUrl);
  let lastError: unknown;

  for (const source of sources) {
    throwIfAborted(options.signal);

    try {
      if (source.provider === "jikan") {
        continue;
      }

      if (source.provider === "anipub") {
        if (!/^https:\/\//i.test(episodeId)) {
          throw new Error("AniPub did not return a valid embed URL for this episode.");
        }

        return {
          streams: [{ url: episodeId, type: "embed", quality: "embed" }],
          subtitles: [],
        };
      }

      if (source.provider === "consumet") {
        return await fetchConsumetStreams(source, episodeId, options);
      }

      const response = await miruroGet<MiruroStreamResponse>(
        source.baseUrl,
        episodeId.replace(/^\/+/, ""),
        {},
        options,
      );
      const streamsResponse = normalizeStreamsResponse(response);

      if (!streamsResponse.streams.length) {
        throw new Error(`Anime API mirror ${source.baseUrl} did not return playable streams.`);
      }

      return streamsResponse;
    } catch (error) {
      if (isAnimeRequestAbortError(error)) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Every configured anime stream source failed.");
};
