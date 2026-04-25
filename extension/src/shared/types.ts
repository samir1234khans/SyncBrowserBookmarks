export type BrowserName = "CHROME" | "EDGE";

export type BookmarkNodeDTO = {
  appNodeId?: string;
  browserNodeId: string;
  parentBrowserNodeId?: string | null;
  type: "BOOKMARK" | "FOLDER";
  title: string;
  url?: string | null;
  position: number;
  path: string[];
  updatedAt: string;
  deletedAt?: string | null;
};

export type ExtensionState = {
  token?: string;
  deviceId?: string;
  browser: BrowserName;
  apiBaseUrl: string;
  lastCursor?: string;
  lastSyncAt?: string;
  syncStatus: "idle" | "syncing" | "error";
  lastError?: string;
};
