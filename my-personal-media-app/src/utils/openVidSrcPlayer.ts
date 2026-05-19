import { openPlayerWebviewWindow } from "./openPlayerWebview";
import { canonicalizeKnownVidSrcUrl } from "./vidsrc";

export const buildVidSrcPlayerUrl = (playerUrl: string) => {
  const canonicalPlayerUrl = canonicalizeKnownVidSrcUrl(playerUrl);
  return canonicalPlayerUrl;
};

export const openVidSrcPlayerWindow = async (playerUrl: string, title: string) => {
  await openPlayerWebviewWindow(buildVidSrcPlayerUrl(playerUrl), title);
};
