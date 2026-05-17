import { create } from "zustand";

export type DebugLevel = "info" | "success" | "warn" | "error";

export type DebugEntry = {
  id: string;
  timestamp: number;
  level: DebugLevel;
  scope: string;
  message: string;
  details?: unknown;
};

type DebugState = {
  entries: DebugEntry[];
  isOpen: boolean;
  isPaused: boolean;
  addEntry: (entry: Omit<DebugEntry, "id" | "timestamp">) => void;
  clearEntries: () => void;
  setOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  setPaused: (isPaused: boolean) => void;
};

const maxEntries = 250;

const nativeConsole = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

const createEntryId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `debug-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const normalizeForConsole = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (value instanceof Event) {
    return {
      type: value.type,
      target: value.target instanceof Element ? value.target.tagName.toLowerCase() : null,
    };
  }

  return value;
};

const formatConsoleArgument = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return `${value.name}: ${value.message}`;
  }

  try {
    return JSON.stringify(normalizeForConsole(value));
  } catch {
    return String(value);
  }
};

export const useDebugStore = create<DebugState>()((set) => ({
  entries: [],
  isOpen: false,
  isPaused: false,

  addEntry: (entry) =>
    set((state) => {
      if (state.isPaused) {
        return state;
      }

      return {
        entries: [
          {
            ...entry,
            id: createEntryId(),
            timestamp: Date.now(),
          },
          ...state.entries,
        ].slice(0, maxEntries),
      };
    }),

  clearEntries: () => set({ entries: [] }),
  setOpen: (isOpen) => set({ isOpen }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setPaused: (isPaused) => set({ isPaused }),
}));

const mirrorToNativeConsole = (entry: Omit<DebugEntry, "id" | "timestamp">) => {
  const method = entry.level === "error" ? "error" : entry.level === "warn" ? "warn" : "info";
  nativeConsole[method](`[${entry.scope}] ${entry.message}`, entry.details ?? "");
};

export const debugLog = (
  scope: string,
  message: string,
  details?: unknown,
  level: DebugLevel = "info",
) => {
  const entry = {
    level,
    scope,
    message,
    details: normalizeForConsole(details),
  };

  useDebugStore.getState().addEntry(entry);
  mirrorToNativeConsole(entry);
};

let consoleBridgeInstalled = false;

export const installDebugConsoleBridge = () => {
  if (consoleBridgeInstalled) {
    return;
  }

  consoleBridgeInstalled = true;

  const methods = ["log", "info", "warn", "error"] as const;

  methods.forEach((method) => {
    console[method] = (...args: unknown[]) => {
      nativeConsole[method](...args);

      useDebugStore.getState().addEntry({
        level: method === "error" ? "error" : method === "warn" ? "warn" : "info",
        scope: `console.${method}`,
        message: args.map(formatConsoleArgument).join(" "),
        details: args.length > 1 ? args.map(normalizeForConsole) : undefined,
      });
    };
  });
};

export const getDebugEnvironment = () => {
  const tauriWindow = window as Window & {
    __TAURI_INTERNALS__?: unknown;
  };

  return {
    href: window.location.href,
    origin: window.location.origin,
    protocol: window.location.protocol,
    userAgent: navigator.userAgent,
    tauriInternalsDetected: Boolean(tauriWindow.__TAURI_INTERNALS__),
    online: navigator.onLine,
  };
};
