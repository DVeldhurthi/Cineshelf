import type { VideoKind } from "./video";

export type SearchFilters = {
  query: string;
  kind: VideoKind | "all";
  genre: string;
  sort: "featured" | "year-desc" | "year-asc" | "title";
};
