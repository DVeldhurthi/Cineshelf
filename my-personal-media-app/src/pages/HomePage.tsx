import { useDeferredValue, useMemo, useState } from "react";
import { AnimeRow } from "../components/AnimeRow";
import { HeroBanner } from "../components/HeroBanner";
import { MediaRow } from "../components/MediaRow";
import { SearchControls } from "../components/SearchControls";
import { getGenres, videos } from "../data/catalog";
import { useAnimeHome } from "../hooks/useAnimeHome";
import { useAnimeSearch } from "../hooks/useAnimeSearch";
import { getEnabledAnimeApiSources, useMediaStore } from "../store/useMediaStore";
import type { SearchFilters } from "../types/search";
import type { Video } from "../types/video";
import styles from "./HomePage.module.css";

const initialFilters: SearchFilters = {
  query: "",
  kind: "all",
  genre: "all",
  sort: "featured",
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const searchableVideos = videos.map((video) => ({
  video,
  searchable: [
    video.title,
    video.description,
    video.imdbId,
    video.tmdbId ?? "",
    video.releaseYear.toString(),
    video.runtime,
    video.rating,
    video.tagline,
    video.synopsis,
    video.seriesKey ?? "",
    video.seriesTitle ?? "",
    ...video.categories,
    ...video.genres,
  ]
    .join(" ")
    .toLowerCase(),
}));

const applySearchFilters = (filters: SearchFilters) => {
  const query = normalizeSearch(filters.query);

  return searchableVideos
    .filter(({ video, searchable }) => {
      const matchesQuery = query ? searchable.includes(query) : true;
      const matchesKind = filters.kind === "all" ? true : video.type === filters.kind;
      const matchesGenre = filters.genre === "all" ? true : video.genres.includes(filters.genre);

      return matchesQuery && matchesKind && matchesGenre;
    })
    .map(({ video }) => video)
    .sort((first, second) => {
      if (filters.sort === "year-desc") {
        return second.releaseYear - first.releaseYear;
      }

      if (filters.sort === "year-asc") {
        return first.releaseYear - second.releaseYear;
      }

      if (filters.sort === "title") {
        return first.title.localeCompare(second.title);
      }

      return Number(second.featured) - Number(first.featured) || second.releaseYear - first.releaseYear;
    });
};

const homeRows = [
  { title: "Trending Now", eyebrow: "Fresh picks", category: "Trending" },
  { title: "Popular Movies", eyebrow: "Big-screen favorites", category: "Popular Movies" },
  { title: "Top TV Shows", eyebrow: "Prestige and bingeable series", category: "Top TV" },
  { title: "Action Rush", eyebrow: "High velocity", category: "Action" },
  { title: "Sci-Fi Worlds", eyebrow: "Future shock", category: "Sci-Fi" },
  { title: "Drama Essentials", eyebrow: "Award-season energy", category: "Drama" },
  { title: "Horror Nights", eyebrow: "Lights low", category: "Horror" },
  { title: "Crime and Mystery", eyebrow: "Cases, conspiracies, consequences", category: "Crime" },
  { title: "Comedy Comforts", eyebrow: "Easy rewatching", category: "Comedy" },
  { title: "Classics and Public Domain", eyebrow: "Film history", category: "Classics" },
];

const movieRows = homeRows.filter((row) => row.category !== "Top TV" && row.category !== "Anime");
const tvRows = homeRows.filter((row) => row.category === "Top TV" || row.category === "Drama");
const videosById = new Map(videos.map((video) => [video.id, video]));
const videosByKind = {
  movie: videos.filter((video) => video.type === "movie"),
  tv: videos.filter((video) => video.type === "tv"),
};
const videosByCategory = new Map(
  homeRows.map((row) => [
    row.category,
    videos.filter((video) => video.categories.includes(row.category)),
  ]),
);

type SectionFilter = "all" | "movie" | "tv" | "anime";

const sectionFilters: { id: SectionFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "movie", label: "Movies" },
  { id: "tv", label: "TV" },
  { id: "anime", label: "Anime" },
];

export function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all");
  const deferredFilters = useDeferredValue(filters);
  const watchlistIds = useMediaStore((state) => state.watchlistIds);
  const continueWatching = useMediaStore((state) => state.continueWatching);
  const settings = useMediaStore((state) => state.settings);
  const toggleWatchlist = useMediaStore((state) => state.toggleWatchlist);
  const showMoviesAndTv = sectionFilter === "all" || sectionFilter === "movie" || sectionFilter === "tv";
  const showAnime = sectionFilter === "all" || sectionFilter === "anime";
  const animeApiSources = useMemo(() => getEnabledAnimeApiSources(settings), [settings]);
  const animeHome = useAnimeHome(animeApiSources, showAnime, settings.showMatureAnimeSection);
  const animeSearch = useAnimeSearch(
    animeApiSources,
    filters.query,
    showAnime,
    settings.showMatureAnimeSection,
  );

  const genres = useMemo(() => getGenres(), []);
  const heroVideo =
    videos.find((video) => video.categories.includes("Trending") && video.featured) ??
    videos.find((video) => video.featured) ??
    videos[0];
  const filteredVideos = useMemo(() => applySearchFilters(deferredFilters), [deferredFilters]);
  const isFiltering = Object.entries(deferredFilters).some(
    ([key, value]) => key !== "sort" && value !== initialFilters[key as keyof SearchFilters],
  );
  const visibleFilteredVideos = useMemo(() => filteredVideos.filter((video) => {
    if (sectionFilter === "movie") {
      return video.type === "movie";
    }

    if (sectionFilter === "tv") {
      return video.type === "tv";
    }

    if (sectionFilter === "anime") {
      return false;
    }

    return true;
  }), [filteredVideos, sectionFilter]);
  const rowsForSection =
    sectionFilter === "movie" ? movieRows : sectionFilter === "tv" ? tvRows : homeRows;

  const continueWatchingVideos = useMemo(
    () =>
      Object.values(continueWatching)
        .sort((first, second) => second.updatedAt - first.updatedAt)
        .map((entry) => videosById.get(entry.videoId))
        .filter((video): video is Video => Boolean(video)),
    [continueWatching],
  );

  return (
    <div className={styles.page}>
      <HeroBanner
        video={heroVideo}
        isInWatchlist={watchlistIds.includes(heroVideo.id)}
        onToggleWatchlist={() => toggleWatchlist(heroVideo.id)}
      />

      <SearchControls
        filters={filters}
        genres={genres}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
      />

      <div className={styles.sectionSwitcher} role="tablist" aria-label="Content type">
        {sectionFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={sectionFilter === filter.id ? styles.sectionButtonActive : ""}
            onClick={() => setSectionFilter(filter.id)}
            aria-pressed={sectionFilter === filter.id}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className={styles.rows}>
        {continueWatchingVideos.length > 0 ? (
          <MediaRow
            title="Continue Watching"
            eyebrow="Recently opened"
            videos={continueWatchingVideos}
          />
        ) : null}

        {isFiltering && showMoviesAndTv ? (
          <MediaRow title="Movie & TV Search Results" eyebrow="VidSrc catalog match" videos={visibleFilteredVideos} />
        ) : null}

        {isFiltering && showAnime ? (
          <>
            <AnimeRow
              title="Anime Search Results"
              eyebrow="Miruro API match"
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

        {showAnime ? (
          <>
            <AnimeRow
              title="Trending Anime"
              eyebrow="Miruro spotlight"
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
              eyebrow="Next episodes soon"
              anime={animeHome.rows.airing}
              loading={animeHome.loading}
            />
            <AnimeRow
              title="All Time Anime Favorites"
              eyebrow="Highest-scored picks"
              anime={animeHome.rows.favorites}
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
          </>
        ) : null}

        {showMoviesAndTv
          ? rowsForSection.map((row) => (
              <MediaRow
                key={row.category}
                title={row.title}
                eyebrow={row.eyebrow}
                videos={videosByCategory.get(row.category) ?? []}
              />
            ))
          : null}

        {sectionFilter !== "anime" ? (
          <>
            {sectionFilter !== "tv" ? (
              <MediaRow title="All Movies" eyebrow="Full shelf" videos={videosByKind.movie} />
            ) : null}
            {sectionFilter !== "movie" ? (
              <MediaRow title="All Series" eyebrow="Every show" videos={videosByKind.tv} />
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
