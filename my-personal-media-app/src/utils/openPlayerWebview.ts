import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { BackgroundThrottlingPolicy } from "@tauri-apps/api/window";
import { debugLog } from "../store/useDebugStore";

export const CHROME_COMPAT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const createPlayerWindowLabel = () => `vidsrc-player-${Date.now()}`;

const waitForWebviewWindow = (webviewWindow: WebviewWindow) =>
  new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out while creating the Tauri player window."));
    }, 8000);

    webviewWindow.once("tauri://created", () => {
      window.clearTimeout(timeout);
      resolve();
    });

    webviewWindow.once<unknown>("tauri://error", (event) => {
      window.clearTimeout(timeout);
      reject(new Error(String(event.payload || "Unable to create Tauri player window.")));
    });
  });

export const openPlayerWebviewWindow = async (url: string, title: string) => {
  const parsedUrl = new URL(url);

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS VidSrc URLs can be opened in the Tauri player window.");
  }

  const label = createPlayerWindowLabel();

  debugLog("tauri.playerWindow", "Creating top-level Tauri player WebviewWindow.", {
    label,
    url: parsedUrl.toString(),
    userAgent: CHROME_COMPAT_USER_AGENT,
  });

  const playerWindow = new WebviewWindow(label, {
    url: parsedUrl.toString(),
    title: `${title} - Cineshelf Player`,
    width: 1280,
    height: 760,
    minWidth: 900,
    minHeight: 560,
    center: true,
    resizable: true,
    focus: true,
    visible: true,
    decorations: true,
    acceptFirstMouse: true,
    allowLinkPreview: false,
    backgroundThrottling: "disabled" as BackgroundThrottlingPolicy,
    userAgent: CHROME_COMPAT_USER_AGENT,
  });

  await waitForWebviewWindow(playerWindow);
  await playerWindow.setFocus();

  debugLog(
    "tauri.playerWindow",
    "Top-level Tauri player WebviewWindow created.",
    {
      label,
      url: parsedUrl.toString(),
    },
    "success",
  );
};
