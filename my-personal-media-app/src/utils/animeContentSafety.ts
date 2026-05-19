import type { AnimeMedia } from "../types/anime";

const matureTerms = [
  "hentai",
  "adult",
  "18+",
  "r+",
  "rx",
  "erotica",
  "ecchi",
  "borderline",
  "mature",
  "uncensored",
];

const normalizeSafetyText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9+]+/g, " ")
    .trim();

export const hasMatureAnimeSignals = (values: Array<string | number | null | undefined>) => {
  const searchable = normalizeSafetyText(values.filter(Boolean).join(" "));
  return matureTerms.some((term) => searchable.includes(normalizeSafetyText(term)));
};

export const isMatureAnime = (anime: AnimeMedia) =>
  Boolean(anime.isMature) ||
  hasMatureAnimeSignals([
    anime.title,
    anime.romajiTitle,
    anime.nativeTitle,
    anime.description,
    anime.format,
    anime.status,
    anime.relationType,
    ...anime.genres,
  ]);

export const splitMatureAnime = (anime: AnimeMedia[], showMatureAnimeSection: boolean) => {
  const regular: AnimeMedia[] = [];
  const mature: AnimeMedia[] = [];

  anime.forEach((entry) => {
    if (isMatureAnime(entry)) {
      if (showMatureAnimeSection) {
        mature.push(entry);
      }
      return;
    }

    regular.push(entry);
  });

  return { regular, mature };
};

export const filterMatureAnime = (anime: AnimeMedia[], showMatureAnimeSection: boolean) =>
  splitMatureAnime(anime, showMatureAnimeSection).regular;
