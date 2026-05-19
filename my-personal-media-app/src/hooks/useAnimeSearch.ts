import { useEffect, useState } from "react";
import type { AnimeApiSource, AnimeMedia } from "../types/anime";
import { splitMatureAnime } from "../utils/animeContentSafety";
import { isAnimeRequestAbortError, searchAnime } from "../utils/miruro";

type AnimeApiInput = string | string[] | AnimeApiSource[];
const animeSearchCache = new Map<string, AnimeMedia[]>();
const animeSearchInflightCache = new Map<string, Promise<AnimeMedia[]>>();
const maxAnimeSearchCacheEntries = 30;

const getCacheKey = (baseUrl: AnimeApiInput) =>
  (Array.isArray(baseUrl) ? baseUrl : [baseUrl])
    .map((source) =>
      typeof source === "string"
        ? source.trim()
        : `${source.provider}:${source.providerKey ?? ""}:${source.baseUrl.trim()}`,
    )
    .join("|");

export const useAnimeSearch = (
  baseUrl: AnimeApiInput,
  query: string,
  enabled = true,
  showMatureAnimeSection = false,
) => {
  const [results, setResults] = useState<AnimeMedia[]>([]);
  const [matureResults, setMatureResults] = useState<AnimeMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const baseUrlKey = getCacheKey(baseUrl);
  const normalizedQuery = trimmedQuery.toLowerCase();
  const searchCacheKey = `${baseUrlKey}:query-${normalizedQuery}:mature-${String(showMatureAnimeSection)}`;

  const cacheSearchResults = (cacheKey: string, anime: AnimeMedia[]) => {
    if (animeSearchCache.size >= maxAnimeSearchCacheEntries) {
      const oldestKey = animeSearchCache.keys().next().value;

      if (oldestKey) {
        animeSearchCache.delete(oldestKey);
      }
    }

    animeSearchCache.set(cacheKey, anime);
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    if (!enabled || trimmedQuery.length < 2) {
      setResults([]);
      setMatureResults([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    const cachedResults = animeSearchCache.get(searchCacheKey);

    if (cachedResults) {
      const splitResults = splitMatureAnime(cachedResults, showMatureAnimeSection);
      setResults(splitResults.regular);
      setMatureResults(splitResults.mature);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const inflightResults = animeSearchInflightCache.get(searchCacheKey);
        const nextResults =
          inflightResults ??
          searchAnime(baseUrl, trimmedQuery, 18, {
            signal: controller.signal,
          }).finally(() => {
            animeSearchInflightCache.delete(searchCacheKey);
          });

        if (!inflightResults) {
          animeSearchInflightCache.set(searchCacheKey, nextResults);
        }

        const resolvedResults = await nextResults;

        cacheSearchResults(searchCacheKey, resolvedResults);
        const splitResults = splitMatureAnime(resolvedResults, showMatureAnimeSection);

        if (!cancelled) {
          setResults(splitResults.regular);
          setMatureResults(splitResults.mature);
        }
      } catch (searchError) {
        if (!cancelled && !isAnimeRequestAbortError(searchError)) {
          setError(searchError instanceof Error ? searchError.message : "Unable to search anime.");
          setResults([]);
          setMatureResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 260);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [baseUrl, baseUrlKey, enabled, searchCacheKey, showMatureAnimeSection, trimmedQuery]);

  return {
    results,
    matureResults,
    loading,
    error,
  };
};
