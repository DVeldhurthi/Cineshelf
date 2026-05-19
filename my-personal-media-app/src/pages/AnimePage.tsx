import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { AnimeRow } from "../components/AnimeRow";
import { useAnimeHome } from "../hooks/useAnimeHome";
import { useAnimeSearch } from "../hooks/useAnimeSearch";
import { getEnabledAnimeApiSources, useMediaStore } from "../store/useMediaStore";
import styles from "./AnimePage.module.css";

export function AnimePage() {
  const settings = useMediaStore((state) => state.settings);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const animeApiSources = useMemo(() => getEnabledAnimeApiSources(settings), [settings]);
  const animeHome = useAnimeHome(animeApiSources, true, settings.showMatureAnimeSection);
  const animeSearch = useAnimeSearch(animeApiSources, deferredQuery, true, settings.showMatureAnimeSection);
  const isSearching = deferredQuery.trim().length >= 2;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p>Anime sources</p>
        <h1>Anime</h1>
        <span>Search, browse servers, and open episodes in the Tauri player window.</span>
      </header>

      <label className={styles.searchBox}>
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Search anime"
          aria-label="Search anime"
        />
      </label>

      <div className={styles.rows}>
        {isSearching ? (
          <>
            <AnimeRow
              title="Anime Search Results"
              eyebrow="Source match"
              anime={animeSearch.results}
              loading={animeSearch.loading}
              error={animeSearch.error}
            />
            {settings.showMatureAnimeSection ? (
              <AnimeRow
                title="Mature Anime Search Results"
                eyebrow="Hidden unless enabled"
                anime={animeSearch.matureResults}
                loading={animeSearch.loading}
              />
            ) : null}
          </>
        ) : null}

        <AnimeRow
          title="Trending Anime"
          eyebrow="Hot right now"
          anime={animeHome.rows.trending}
          loading={animeHome.loading}
          error={animeHome.error}
        />
        <AnimeRow
          title="Popular This Season"
          eyebrow="Currently airing"
          anime={animeHome.rows.seasonal}
          loading={animeHome.loading}
        />
        <AnimeRow
          title="Top Airing"
          eyebrow="Episodes coming soon"
          anime={animeHome.rows.airing}
          loading={animeHome.loading}
        />
        <AnimeRow
          title="All Time Favorites"
          eyebrow="Highest-scored TV anime"
          anime={animeHome.rows.favorites}
          loading={animeHome.loading}
        />
        <AnimeRow
          title="Spotlight"
          eyebrow="Curated picks"
          anime={animeHome.rows.spotlight}
          loading={animeHome.loading}
        />
        {settings.showMatureAnimeSection ? (
          <AnimeRow
            title="Mature Anime"
            eyebrow="Separated by Settings"
            anime={animeHome.rows.mature}
            loading={animeHome.loading}
          />
        ) : null}
      </div>
    </div>
  );
}
