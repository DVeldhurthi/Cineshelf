import { useEffect, useState } from "react";
import type { AnimeApiSource, AnimeMedia } from "../types/anime";
import { splitMatureAnime } from "../utils/animeContentSafety";
import { fetchAnimeCollection, fetchAnimeFilter, isAnimeRequestAbortError } from "../utils/miruro";

export type AnimeHomeRows = {
  spotlight: AnimeMedia[];
  trending: AnimeMedia[];
  seasonal: AnimeMedia[];
  airing: AnimeMedia[];
  favorites: AnimeMedia[];
  mature: AnimeMedia[];
};

const emptyRows: AnimeHomeRows = {
  spotlight: [],
  trending: [],
  seasonal: [],
  airing: [],
  favorites: [],
  mature: [],
};

const animeHomeCache = new Map<string, AnimeHomeRows>();
const animeHomeRawRowCache = new Map<string, AnimeMedia[]>();
const animeHomeRawRowInflightCache = new Map<string, Promise<AnimeMedia[]>>();
const animeHomeStoragePrefix = "cineshelf:anime-home:";
const animeHomeStorageMaxAgeMs = 1000 * 60 * 60 * 6;

type AnimeApiInput = string | string[] | AnimeApiSource[];
type AnimeHomeRowKey = Exclude<keyof AnimeHomeRows, "mature">;

const getCacheKey = (baseUrl: AnimeApiInput) =>
  (Array.isArray(baseUrl) ? baseUrl : [baseUrl])
    .map((source) =>
      typeof source === "string"
        ? source.trim()
        : `${source.provider}:${source.providerKey ?? ""}:${source.baseUrl.trim()}`,
    )
    .join("|");

const fetchRow = (request: Promise<AnimeMedia[]>) =>
  request.catch((error) => {
    if (isAnimeRequestAbortError(error)) {
      throw error;
    }

    return [] as AnimeMedia[];
  });

const hasAnyRows = (rows: AnimeHomeRows) =>
  Object.values(rows).some((row) => row.length > 0);

const getRawRowCacheKey = (sourceCacheKey: string, rowKey: AnimeHomeRowKey) =>
  `${sourceCacheKey}:row-${rowKey}`;

const readStoredRows = (cacheKey: string): AnimeHomeRows | null => {
  try {
    const value = window.localStorage.getItem(`${animeHomeStoragePrefix}${cacheKey}`);

    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as { savedAt?: number; rows?: AnimeHomeRows };

    if (!parsed.savedAt || Date.now() - parsed.savedAt > animeHomeStorageMaxAgeMs) {
      window.localStorage.removeItem(`${animeHomeStoragePrefix}${cacheKey}`);
      return null;
    }

    return parsed.rows && hasAnyRows(parsed.rows) ? parsed.rows : null;
  } catch {
    return null;
  }
};

const storeRows = (cacheKey: string, rows: AnimeHomeRows) => {
  if (!hasAnyRows(rows)) {
    return;
  }

  try {
    window.localStorage.setItem(
      `${animeHomeStoragePrefix}${cacheKey}`,
      JSON.stringify({
        savedAt: Date.now(),
        rows,
      }),
    );
  } catch {
    // Local storage is a speed boost only; the network path still works without it.
  }
};

const fetchCachedRawRow = (
  sourceCacheKey: string,
  rowKey: AnimeHomeRowKey,
  request: () => Promise<AnimeMedia[]>,
) => {
  const rowCacheKey = getRawRowCacheKey(sourceCacheKey, rowKey);
  const cachedRow = animeHomeRawRowCache.get(rowCacheKey);

  if (cachedRow) {
    return Promise.resolve(cachedRow);
  }

  const inflightRow = animeHomeRawRowInflightCache.get(rowCacheKey);

  if (inflightRow) {
    return inflightRow;
  }

  const rowRequest = fetchRow(request())
    .then((anime) => {
      animeHomeRawRowCache.set(rowCacheKey, anime);
      return anime;
    })
    .finally(() => {
      animeHomeRawRowInflightCache.delete(rowCacheKey);
    });

  animeHomeRawRowInflightCache.set(rowCacheKey, rowRequest);
  return rowRequest;
};

export const useAnimeHome = (
  baseUrl: AnimeApiInput,
  enabled = true,
  showMatureAnimeSection = false,
) => {
  const [rows, setRows] = useState<AnimeHomeRows>(emptyRows);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const sourceCacheKey = getCacheKey(baseUrl);
  const cacheKey = `${sourceCacheKey}:mature-${String(showMatureAnimeSection)}`;

  useEffect(() => {
    let cancelled = false;
    const memoryCachedRows = animeHomeCache.get(cacheKey);
    const storedCachedRows = memoryCachedRows ? null : readStoredRows(cacheKey);
    const cachedRows = memoryCachedRows ?? storedCachedRows;

    if (!enabled) {
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (cachedRows && hasAnyRows(cachedRows)) {
      animeHomeCache.set(cacheKey, cachedRows);
      setRows(cachedRows);
      setLoading(false);
      setError(null);

      if (memoryCachedRows) {
        return () => {
          cancelled = true;
        };
      }
    }

    const loadRows = async () => {
      setLoading(!storedCachedRows);
      setError(null);
      if (!storedCachedRows) {
        setRows(emptyRows);
      }

      try {
        const commitRows = (nextRows: Partial<Omit<AnimeHomeRows, "mature">>) => {
          setRows((currentRows) => {
            const regularRows = Object.fromEntries(
              Object.entries(nextRows).map(([key, anime]) => [
                key,
                splitMatureAnime(anime ?? [], showMatureAnimeSection).regular,
              ]),
            ) as Partial<Omit<AnimeHomeRows, "mature">>;
            const nextMatureAnime = Object.values(nextRows)
              .flatMap((anime) => splitMatureAnime(anime ?? [], showMatureAnimeSection).mature)
              .filter((anime): anime is AnimeMedia => Boolean(anime));
          const mergedRows = {
            ...currentRows,
            ...regularRows,
            mature: showMatureAnimeSection
                ? [...currentRows.mature, ...nextMatureAnime].filter(
                    (anime, index, row) => row.findIndex((entry) => entry.id === anime.id) === index,
                  )
                : [],
            };

            if (hasAnyRows(mergedRows)) {
              animeHomeCache.set(cacheKey, mergedRows);
              storeRows(cacheKey, mergedRows);
            }

            return mergedRows;
          });
        };
        const [trending, seasonal] = await Promise.all([
          fetchCachedRawRow(sourceCacheKey, "trending", () =>
            fetchAnimeCollection(baseUrl, "trending", 10),
          ),
          fetchCachedRawRow(sourceCacheKey, "seasonal", () =>
            fetchAnimeCollection(baseUrl, "recent", 10),
          ),
        ]);

        if (!cancelled) {
          commitRows({
            trending,
            seasonal,
          });
          setLoading(false);
        }

        const [spotlight, airing, favorites] = await Promise.all([
          fetchCachedRawRow(sourceCacheKey, "spotlight", () =>
            fetchAnimeCollection(baseUrl, "spotlight", 8),
          ),
          fetchCachedRawRow(sourceCacheKey, "airing", () =>
            fetchAnimeCollection(baseUrl, "schedule", 10),
          ),
          fetchCachedRawRow(sourceCacheKey, "favorites", () =>
            fetchAnimeFilter(baseUrl, {
              sort: "SCORE_DESC",
              format: "TV",
              per_page: 10,
            }),
          ),
        ]);

        if (!cancelled) {
          commitRows({
            spotlight,
            airing,
            favorites,
          });

          if (!hasAnyRows(animeHomeCache.get(cacheKey) ?? emptyRows)) {
            setError("Unable to load anime rows from the configured Miruro API.");
          }
        }
      } catch (loadError) {
        if (!cancelled && !isAnimeRequestAbortError(loadError)) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load anime.");
          setRows(emptyRows);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadRows();

    return () => {
      cancelled = true;
    };
  }, [baseUrl, cacheKey, enabled, showMatureAnimeSection, sourceCacheKey]);

  return {
    rows,
    loading,
    error,
  };
};
