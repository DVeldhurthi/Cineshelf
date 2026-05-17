const METAHUB_POSTER_BASE_URL = "https://images.metahub.space/poster/medium";
const METAHUB_BACKDROP_BASE_URL = "https://images.metahub.space/background/medium";

export const buildPosterUrl = (imdbId: string) =>
  `${METAHUB_POSTER_BASE_URL}/${encodeURIComponent(imdbId)}/img`;

export const buildBackdropUrl = (imdbId: string) =>
  `${METAHUB_BACKDROP_BASE_URL}/${encodeURIComponent(imdbId)}/img`;
