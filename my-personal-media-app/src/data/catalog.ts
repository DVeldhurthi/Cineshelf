import videoData from "./videos.json";
import type { Video, VideoKind } from "../types/video";
import { buildBackdropUrl, buildPosterUrl } from "../utils/posters";

type RawVideo = Partial<Video> &
  Pick<Video, "id" | "title" | "imdbId" | "genres" | "runtime"> & {
    description?: string;
    poster?: string;
    backdrop?: string;
    releaseYear?: number;
    type?: VideoKind;
  };

const palette = [
  ["#9f2d34", "#f6d365"],
  ["#235a7c", "#d8b764"],
  ["#4f6d58", "#e9c46a"],
  ["#63346e", "#f4a261"],
  ["#365f6b", "#f7c59f"],
  ["#2d6a4f", "#ffd166"],
  ["#4a4e69", "#c9ada7"],
  ["#264653", "#e76f51"],
];

const normalizeVideo = (video: RawVideo, index: number): Video => {
  const type = video.type ?? video.kind ?? "movie";
  const releaseYear = video.releaseYear ?? video.year ?? new Date().getFullYear();
  const description = video.description ?? video.synopsis ?? "";
  const poster = video.poster ?? video.posterUrl ?? buildPosterUrl(video.imdbId);
  const backdrop = video.backdrop ?? video.backdropUrl ?? buildBackdropUrl(video.imdbId);
  const [color, accentColor] = palette[index % palette.length];

  return {
    ...video,
    description,
    poster,
    backdrop,
    releaseYear,
    type,
    kind: type,
    year: releaseYear,
    rating: video.rating ?? "NR",
    tagline: video.tagline ?? description,
    synopsis: description,
    color: video.color ?? color,
    accentColor: video.accentColor ?? accentColor,
    posterUrl: poster,
    backdropUrl: backdrop,
    categories: video.categories ?? [],
  };
};

export const videos: Video[] = (videoData as RawVideo[]).map(normalizeVideo);

export const getVideoById = (id: string | undefined) =>
  videos.find((video) => video.id === id);

export const getGenres = () =>
  Array.from(new Set(videos.flatMap((video) => video.genres))).sort((a, b) =>
    a.localeCompare(b),
  );

export const getDecades = () =>
  Array.from(new Set(videos.map((video) => `${Math.floor(video.releaseYear / 10) * 10}s`))).sort(
    (a, b) => b.localeCompare(a),
  );

export const filterByKind = (kind: VideoKind) =>
  videos.filter((video) => video.type === kind);

export const filterByCategory = (category: string) =>
  videos.filter((video) => video.categories.includes(category));

export const getSameSeriesVideos = (video: Video) => {
  if (!video.seriesKey) {
    return [];
  }

  return videos
    .filter((candidate) => candidate.id !== video.id && candidate.seriesKey === video.seriesKey)
    .sort((first, second) => {
      if (first.releaseYear !== second.releaseYear) {
        return first.releaseYear - second.releaseYear;
      }

      return first.title.localeCompare(second.title);
    });
};
