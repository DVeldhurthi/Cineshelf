import { Search, Tv, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { videos } from "../data/catalog";
import { getEnabledAnimeApiSources, useMediaStore } from "../store/useMediaStore";
import type { AnimeApiSource } from "../types/anime";
import type { AnimeMedia } from "../types/anime";
import type { Video } from "../types/video";
import styles from "./SpotlightSearch.module.css";

type SpotlightSearchProps = {
  open: boolean;
  onClose: () => void;
};

const normalizeQuery = (value: string) => value.trim().toLowerCase();
const tokenizeQuery = (query: string) => normalizeQuery(query).split(/\s+/).filter(Boolean);

type SpotlightResult =
  | {
      id: string;
      type: "video";
      score: number;
      video: Video;
    }
  | {
      id: string;
      type: "anime";
      score: number;
      anime: AnimeMedia;
    };

const resultLimit = 4;

const insertTopResult = (results: SpotlightResult[], result: SpotlightResult) => {
  if (result.score <= 0) {
    return;
  }

  const existingIndex = results.findIndex((candidate) => candidate.id === result.id);

  if (existingIndex >= 0) {
    if (results[existingIndex].score >= result.score) {
      return;
    }

    results.splice(existingIndex, 1);
  }

  const insertIndex = results.findIndex((candidate) => candidate.score < result.score);

  if (insertIndex === -1) {
    results.push(result);
  } else {
    results.splice(insertIndex, 0, result);
  }

  if (results.length > resultLimit) {
    results.length = resultLimit;
  }
};

const getVideoSearchScore = (video: Video, query: string, tokens: string[]) => {
  const title = video.title.toLowerCase();
  const year = String(video.releaseYear);
  const genres = video.genres.join(" ").toLowerCase();
  const categories = video.categories.join(" ").toLowerCase();
  const ids = [video.imdbId, video.tmdbId ?? ""].join(" ").toLowerCase();
  const series = (video.seriesTitle ?? "").toLowerCase();
  const description = video.description.toLowerCase();
  const searchable = [title, year, genres, categories, ids, series, description]
    .join(" ")
    .trim();

  if (!tokens.every((token) => searchable.includes(token))) {
    return 0;
  }

  if (title === query) {
    return 120;
  }

  if (title.startsWith(query)) {
    return 100;
  }

  if (title.includes(query)) {
    return 78;
  }

  if (ids.includes(query)) {
    return 66;
  }

  const tokenScore = tokens.reduce((score, token) => {
    if (title.startsWith(token)) {
      return score + 18;
    }

    if (title.includes(token)) {
      return score + 12;
    }

    if (ids.includes(token)) {
      return score + 10;
    }

    if (genres.includes(token) || categories.includes(token)) {
      return score + 7;
    }

    if (year.includes(token)) {
      return score + 5;
    }

    return score + 1;
  }, 0);

  const featuredBonus = video.featured ? 4 : 0;
  const recencyBonus = Math.min(6, Math.max(0, video.releaseYear - 1990) / 8);

  return 18 + tokenScore + featuredBonus + recencyBonus;
};

const getAnimeSearchScore = (anime: AnimeMedia, query: string, index: number) => {
  const title = anime.title.toLowerCase();
  const nativeTitle = anime.nativeTitle?.toLowerCase() ?? "";
  const romajiTitle = anime.romajiTitle?.toLowerCase() ?? "";
  const year = String(anime.releaseYear ?? "");
  const genres = anime.genres.join(" ").toLowerCase();
  const text = [title, nativeTitle, romajiTitle, year, genres, anime.description]
    .join(" ")
    .toLowerCase();

  if (!text.includes(query)) {
    return Math.max(12, 38 - index);
  }

  if (title === query || nativeTitle === query || romajiTitle === query) {
    return 96;
  }

  if (title.startsWith(query) || nativeTitle.startsWith(query) || romajiTitle.startsWith(query)) {
    return 76;
  }

  if (title.includes(query) || nativeTitle.includes(query) || romajiTitle.includes(query)) {
    return 58;
  }

  if (genres.includes(query)) {
    return 30;
  }

  if (year.includes(query)) {
    return 22;
  }

  return Math.max(12, 28 - index);
};

const getDefaultResults = () =>
  videos
    .filter((video) => video.featured)
    .sort((first, second) => second.releaseYear - first.releaseYear)
    .slice(0, resultLimit)
    .map((video): SpotlightResult => ({
      id: `video:${video.id}`,
      type: "video",
      score: 0,
      video,
    }));

const searchVideos = (query: string) => {
  const normalizedQuery = normalizeQuery(query);
  const tokens = tokenizeQuery(normalizedQuery);

  if (!normalizedQuery) {
    return getDefaultResults();
  }

  const results: SpotlightResult[] = [];

  for (const video of videos) {
    insertTopResult(results, {
      id: `video:${video.id}`,
      type: "video" as const,
      score: getVideoSearchScore(video, normalizedQuery, tokens),
      video,
    });
  }

  return results;
};

const animeSearchCache = new Map<string, AnimeMedia[]>();

const cacheAnimeSearch = (key: string, anime: AnimeMedia[]) => {
  animeSearchCache.set(key, anime);

  while (animeSearchCache.size > 8) {
    const oldestKey = animeSearchCache.keys().next().value;

    if (!oldestKey) {
      return;
    }

    animeSearchCache.delete(oldestKey);
  }
};

const buildAnimeSearchCacheKey = (
  query: string,
  animeApiSources: AnimeApiSource[],
  showMatureAnimeSection: boolean,
) =>
  [
    query,
    String(showMatureAnimeSection),
    animeApiSources
      .map((source) => `${source.provider}:${source.providerKey ?? ""}:${source.baseUrl}`)
      .join("|"),
  ].join("::");

export function SpotlightSearch({ open, onClose }: SpotlightSearchProps) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const settings = useMediaStore((state) => state.settings);
  const [query, setQuery] = useState("");
  const [animeResults, setAnimeResults] = useState<SpotlightResult[]>([]);
  const [animeLoading, setAnimeLoading] = useState(false);
  const animeApiSources = useMemo(
    () => getEnabledAnimeApiSources(settings),
    [settings.activeAnimeApiMirrorId, settings.animeApiMirrors, settings.miruroApiBaseUrl],
  );
  const normalizedQuery = normalizeQuery(query);
  const videoResults = useMemo(() => searchVideos(query), [query]);
  const results = useMemo(
    () =>
      [...videoResults, ...animeResults]
        .sort((first, second) => {
          if (first.score !== second.score) {
            return second.score - first.score;
          }

          return first.type.localeCompare(second.type);
        })
        .slice(0, 4),
    [animeResults, videoResults],
  );
  const selectResult = useCallback(
    (result: SpotlightResult) => {
      if (result.type === "anime") {
        navigate(`/anime/${result.anime.id}`, { state: { anime: result.anime } });
        onClose();
        return;
      }

      navigate(`/watch/${result.video.id}`);
      onClose();
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setAnimeResults([]);
      setAnimeLoading(false);
      return;
    }

    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 0);

    return () => window.clearTimeout(focusTimer);
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!open || normalizedQuery.length < 2) {
      setAnimeResults([]);
      setAnimeLoading(false);
      return undefined;
    }

    const timeout = window.setTimeout(async () => {
      const cacheKey = buildAnimeSearchCacheKey(
        normalizedQuery,
        animeApiSources,
        settings.showMatureAnimeSection,
      );
      const cachedAnimeResults = animeSearchCache.get(cacheKey);

      if (cachedAnimeResults) {
        setAnimeResults(
          cachedAnimeResults.map((anime, index) => ({
            id: `anime:${anime.sourceId ?? anime.id}`,
            type: "anime",
            score: getAnimeSearchScore(anime, normalizedQuery, index),
            anime,
          })),
        );
        setAnimeLoading(false);
        return;
      }

      setAnimeLoading(true);

      try {
        const [{ splitMatureAnime }, { searchAnime }] = await Promise.all([
          import("../utils/animeContentSafety"),
          import("../utils/miruro"),
        ]);
        const nextAnimeResults = await searchAnime(animeApiSources, normalizedQuery, 4, {
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }

        const splitResults = splitMatureAnime(
          nextAnimeResults,
          settings.showMatureAnimeSection,
        );
        const visibleAnimeResults = settings.showMatureAnimeSection
          ? [...splitResults.regular, ...splitResults.mature]
          : splitResults.regular;

        if (!cancelled) {
          const limitedAnimeResults = visibleAnimeResults.slice(0, resultLimit);

          cacheAnimeSearch(cacheKey, limitedAnimeResults);
          setAnimeResults(
            limitedAnimeResults.map((anime, index) => ({
              id: `anime:${anime.sourceId ?? anime.id}`,
              type: "anime",
              score: getAnimeSearchScore(anime, normalizedQuery, index),
              anime,
            })),
          );
        }
      } catch {
        if (!cancelled) {
          setAnimeResults([]);
        }
      } finally {
        if (!cancelled) {
          setAnimeLoading(false);
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [
    animeApiSources,
    normalizedQuery,
    open,
    settings.showMatureAnimeSection,
  ]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "Enter" && results[0]) {
        selectResult(results[0]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open, results, selectResult]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Spotlight search"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.searchBar}>
          <Search size={24} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="Search Cineshelf"
            aria-label="Search Cineshelf"
          />
          {query ? (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
              <X size={18} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className={styles.results} aria-label="Top search results">
          {results.length ? (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                className={styles.result}
                onClick={() => selectResult(result)}
              >
                <img
                  src={result.type === "anime" ? result.anime.poster : result.video.posterUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.resultCopy}>
                  <strong>{result.type === "anime" ? result.anime.title : result.video.title}</strong>
                  <span>
                    {result.type === "video" && result.video.kind === "tv" ? (
                      <Tv size={13} aria-hidden="true" />
                    ) : null}
                    {result.type === "anime"
                      ? "Anime"
                      : result.video.kind === "tv"
                        ? "TV"
                        : "Movie"}{" "}
                    /{" "}
                    {result.type === "anime"
                      ? [result.anime.releaseYear, result.anime.format].filter(Boolean).join(" / ")
                      : result.video.releaseYear}{" "}
                    /{" "}
                    {(result.type === "anime" ? result.anime.genres : result.video.genres)
                      .slice(0, 2)
                      .join(", ")}
                  </span>
                </span>
              </button>
            ))
          ) : animeLoading ? (
            <p className={styles.empty}>Searching anime...</p>
          ) : (
            <p className={styles.empty}>No close matches.</p>
          )}
        </div>
      </section>
    </div>
  );
}
