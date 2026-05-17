import { openUrl } from "@tauri-apps/plugin-opener";
import { debugLog } from "../store/useDebugStore";

export const openExternalUrl = async (url: string) => {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "https:") {
    debugLog("tauri.opener", "Blocked non-HTTPS external URL.", {
      url: parsedUrl.toString(),
    }, "error");
    throw new Error("Only HTTPS external player URLs can be opened.");
  }

  debugLog("tauri.opener", "Calling Tauri opener plugin.", {
    url: parsedUrl.toString(),
  });
  await openUrl(parsedUrl.toString());
  debugLog("tauri.opener", "Tauri opener plugin completed.", {
    url: parsedUrl.toString(),
  }, "success");
};
