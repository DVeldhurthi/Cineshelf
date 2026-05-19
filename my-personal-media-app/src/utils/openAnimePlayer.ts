import type { AnimeSubtitle } from "../types/anime";
import { openPlayerWebviewWindow } from "./openPlayerWebview";

const directEmbedHosts = [
  "anipub.xyz",
  "gogoanime.com.by",
  "megaplay.buzz",
  "megacloud.blog",
  "vidstreaming",
];

const normalizeStreamUrl = (streamUrl: string) => {
  const trimmedUrl = streamUrl.trim().replace(/^src=/i, "");
  return trimmedUrl.startsWith("//") ? `https:${trimmedUrl}` : trimmedUrl;
};

const isLikelyHlsStream = (streamUrl: string) => /\.m3u8($|[?#])/i.test(normalizeStreamUrl(streamUrl));

const isLikelyDirectEmbed = (streamUrl: string) => {
  try {
    const url = new URL(normalizeStreamUrl(streamUrl));
    return directEmbedHosts.some((host) => url.hostname.includes(host));
  } catch {
    return false;
  }
};

export const buildAnimePlayerUrl = (
  streamUrl: string,
  title: string,
  poster?: string,
  subtitles: AnimeSubtitle[] = [],
) => {
  const appUrl = new URL(`${window.location.origin}${window.location.pathname}`);
  appUrl.hash = "/anime-player";
  appUrl.searchParams.set("src", streamUrl);
  appUrl.searchParams.set("title", title);

  if (poster) {
    appUrl.searchParams.set("poster", poster);
  }

  if (subtitles.length > 0) {
    appUrl.searchParams.set("subtitles", JSON.stringify(subtitles));
  }

  return appUrl.toString();
};

export const openAnimePlayerWindow = async (
  streamUrl: string,
  title: string,
  poster?: string,
  subtitles: AnimeSubtitle[] = [],
  forceDirectEmbed = false,
) => {
  const normalizedStreamUrl = normalizeStreamUrl(streamUrl);

  if (forceDirectEmbed || (!isLikelyHlsStream(normalizedStreamUrl) && isLikelyDirectEmbed(normalizedStreamUrl))) {
    await openPlayerWebviewWindow(normalizedStreamUrl, title);
    return;
  }

  await openPlayerWebviewWindow(buildAnimePlayerUrl(normalizedStreamUrl, title, poster, subtitles), title);
};
