import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { UnlistenFn } from "@tauri-apps/api/event";
import type { BackgroundThrottlingPolicy } from "@tauri-apps/api/window";
import { debugLog } from "../store/useDebugStore";

export const CHROME_COMPAT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const playerWindowLabel = "cineshelf-player";
const allowedPlayerProtocols = new Set(["https:", "http:", "tauri:", "asset:"]);
let activePlayerWindow: WebviewWindow | null = null;
let activePlayerCloseUnlisten: UnlistenFn | null = null;

const normalizePlayerWindowUrl = (url: string) => {
  const trimmedUrl = url.trim().replace(/^src=/i, "");
  const urlWithProtocol = trimmedUrl.startsWith("//") ? `https:${trimmedUrl}` : trimmedUrl;
  const parsedUrl = new URL(urlWithProtocol, window.location.href);

  if (!allowedPlayerProtocols.has(parsedUrl.protocol)) {
    throw new Error(`Unsupported player URL protocol: ${parsedUrl.protocol}`);
  }

  return parsedUrl;
};

const clearActivePlayerCloseListener = () => {
  activePlayerCloseUnlisten?.();
  activePlayerCloseUnlisten = null;
};

const closePlayerWindow = async () => {
  clearActivePlayerCloseListener();

  const playerWindow = activePlayerWindow ?? (await WebviewWindow.getByLabel(playerWindowLabel));

  if (playerWindow) {
    await playerWindow.close().catch(() => undefined);
  }

  activePlayerWindow = null;
};

const waitForWebviewWindow = (webviewWindow: WebviewWindow) =>
  new Promise<void>((resolve, reject) => {
    let settled = false;
    let createdUnlisten: UnlistenFn | null = null;
    let errorUnlisten: UnlistenFn | null = null;

    const cleanup = () => {
      window.clearTimeout(timeout);
      createdUnlisten?.();
      errorUnlisten?.();
      createdUnlisten = null;
      errorUnlisten = null;
    };

    const finish = (callback: () => void) => {
      if (settled) {
        return;
      }

      settled = true;
      cleanup();
      callback();
    };

    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error("Timed out while creating the Tauri player window.")));
    }, 8000);

    void webviewWindow
      .once("tauri://created", () => {
        finish(resolve);
      })
      .then((unlisten) => {
        if (settled) {
          unlisten();
          return;
        }

        createdUnlisten = unlisten;
      })
      .catch((error) => {
        finish(() => reject(error instanceof Error ? error : new Error(String(error))));
      });

    void webviewWindow
      .once<unknown>("tauri://error", (event) => {
        finish(() => reject(new Error(String(event.payload || "Unable to create Tauri player window."))));
      })
      .then((unlisten) => {
        if (settled) {
          unlisten();
          return;
        }

        errorUnlisten = unlisten;
      })
      .catch((error) => {
        finish(() => reject(error instanceof Error ? error : new Error(String(error))));
      });
  });

export const openPlayerWebviewWindow = async (url: string, title: string) => {
  const parsedUrl = normalizePlayerWindowUrl(url);

  await closePlayerWindow();

  debugLog("tauri.playerWindow", "Creating top-level Tauri player WebviewWindow.", {
    label: playerWindowLabel,
    url: parsedUrl.toString(),
    userAgent: CHROME_COMPAT_USER_AGENT,
  });

  const playerWindow = new WebviewWindow(playerWindowLabel, {
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
    backgroundThrottling: "suspend" as BackgroundThrottlingPolicy,
    userAgent: CHROME_COMPAT_USER_AGENT,
  });

  try {
    await waitForWebviewWindow(playerWindow);
  } catch (error) {
    await playerWindow.close().catch(() => undefined);
    throw error;
  }

  await playerWindow.setFocus();
  activePlayerWindow = playerWindow;
  activePlayerCloseUnlisten = await playerWindow.onCloseRequested(() => {
    if (activePlayerWindow?.label === playerWindow.label) {
      activePlayerWindow = null;
    }

    clearActivePlayerCloseListener();
  });

  debugLog(
    "tauri.playerWindow",
    "Top-level Tauri player WebviewWindow created.",
    {
      label: playerWindowLabel,
      url: parsedUrl.toString(),
    },
    "success",
  );
};
