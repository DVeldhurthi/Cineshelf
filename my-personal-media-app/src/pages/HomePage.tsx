import { useMemo, useState } from "react";
import { HeroBanner } from "../components/HeroBanner";
import { MediaRow } from "../components/MediaRow";
import { SearchControls } from "../components/SearchControls";
import { filterByCategory, filterByKind, getDecades, getGenres, videos } from "../data/catalog";
import { useMediaStore } from "../store/useMediaStore";
import type { SearchFilters } from "../types/search";
import type { Video } from "../types/video";
import styles from "./HomePage.module.css";

const initialFilters: SearchFilters = {
  query: "",
  kind: "all",
  genre: "all",
  decade: "all",
  sort: "featured",
};

const normalizeSearch = (value: string) => value.trim().toLowerCase();

const getDecade = (video: Video) => `${Math.floor(video.releaseYear / 10) * 10}s`;

const applySearchFilters = (filters: SearchFilters) => {
  const query = normalizeSearch(filters.query);

  return videos
    .filter((video) => {
      const searchable = [
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
        .toLowerCase();

      const matchesQuery = query ? searchable.includes(query) : true;
      const matchesKind = filters.kind === "all" ? true : video.type === filters.kind;
      const matchesGenre = filters.genre === "all" ? true : video.genres.includes(filters.genre);
      const matchesDecade = filters.decade === "all" ? true : getDecade(video) === filters.decade;

      return matchesQuery && matchesKind && matchesGenre && matchesDecade;
    })
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
  { title: "Anime Shelf", eyebrow: "Animated standouts", category: "Anime" },
  { title: "Crime and Mystery", eyebrow: "Cases, conspiracies, consequences", category: "Crime" },
  { title: "Comedy Comforts", eyebrow: "Easy rewatching", category: "Comedy" },
  { title: "Classics and Public Domain", eyebrow: "Film history", category: "Classics" },
];

export function HomePage() {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const watchlistIds = useMediaStore((state) => state.watchlistIds);
  const continueWatching = useMediaStore((state) => state.continueWatching);
  const toggleWatchlist = useMediaStore((state) => state.toggleWatchlist);

  const genres = useMemo(() => getGenres(), []);
  const decades = useMemo(() => getDecades(), []);
  const heroVideo =
    videos.find((video) => video.categories.includes("Trending") && video.featured) ??
    videos.find((video) => video.featured) ??
    videos[0];
  const filteredVideos = useMemo(() => applySearchFilters(filters), [filters]);
  const isFiltering = Object.entries(filters).some(
    ([key, value]) => key !== "sort" && value !== initialFilters[key as keyof SearchFilters],
  );

  const continueWatchingVideos = Object.values(continueWatching)
    .sort((first, second) => second.updatedAt - first.updatedAt)
    .map((entry) => videos.find((video) => video.id === entry.videoId))
    .filter((video): video is Video => Boolean(video));

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
        decades={decades}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
      />

      <div className={styles.rows}>
        {continueWatchingVideos.length > 0 ? (
          <MediaRow
            title="Continue Watching"
            eyebrow="Recently opened"
            videos={continueWatchingVideos}
          />
        ) : null}

        {isFiltering ? (
          <MediaRow title="Search Results" eyebrow="Live catalog match" videos={filteredVideos} />
        ) : null}

        {homeRows.map((row) => (
          <MediaRow
            key={row.category}
            title={row.title}
            eyebrow={row.eyebrow}
            videos={filterByCategory(row.category)}
          />
        ))}

        <MediaRow title="All Movies" eyebrow="Full shelf" videos={filterByKind("movie")} />
        <MediaRow title="All Series" eyebrow="Every show" videos={filterByKind("tv")} />
      </div>
    </div>
  );
}
