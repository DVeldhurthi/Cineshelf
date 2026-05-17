import { Search, SlidersHorizontal, X } from "lucide-react";
import type { SearchFilters } from "../types/search";
import styles from "./SearchControls.module.css";

type SearchControlsProps = {
  filters: SearchFilters;
  genres: string[];
  decades: string[];
  onChange: (filters: SearchFilters) => void;
  onReset: () => void;
};

export function SearchControls({
  filters,
  genres,
  decades,
  onChange,
  onReset,
}: SearchControlsProps) {
  const updateFilter = <Key extends keyof SearchFilters>(
    key: Key,
    value: SearchFilters[Key],
  ) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  return (
    <section className={styles.searchPanel} aria-label="Catalog search">
      <div className={styles.searchBox}>
        <Search size={20} aria-hidden="true" />
        <input
          value={filters.query}
          onChange={(event) => updateFilter("query", event.currentTarget.value)}
          placeholder="Search title, genre, year, IMDb ID"
        />
        {filters.query ? (
          <button
            type="button"
            onClick={() => updateFilter("query", "")}
            aria-label="Clear search"
            title="Clear search"
          >
            <X size={18} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className={styles.filterGrid}>
        <label>
          <span>
            <SlidersHorizontal size={14} aria-hidden="true" />
            Type
          </span>
          <select
            value={filters.kind}
            onChange={(event) =>
              updateFilter("kind", event.currentTarget.value as SearchFilters["kind"])
            }
          >
            <option value="all">All</option>
            <option value="movie">Movies</option>
            <option value="tv">TV</option>
          </select>
        </label>

        <label>
          <span>Genre</span>
          <select
            value={filters.genre}
            onChange={(event) => updateFilter("genre", event.currentTarget.value)}
          >
            <option value="all">All genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Decade</span>
          <select
            value={filters.decade}
            onChange={(event) => updateFilter("decade", event.currentTarget.value)}
          >
            <option value="all">All decades</option>
            {decades.map((decade) => (
              <option key={decade} value={decade}>
                {decade}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Sort</span>
          <select
            value={filters.sort}
            onChange={(event) =>
              updateFilter("sort", event.currentTarget.value as SearchFilters["sort"])
            }
          >
            <option value="featured">Featured</option>
            <option value="year-desc">Newest</option>
            <option value="year-asc">Oldest</option>
            <option value="title">Title</option>
          </select>
        </label>

        <button type="button" className={styles.resetButton} onClick={onReset}>
          <X size={16} aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </section>
  );
}
