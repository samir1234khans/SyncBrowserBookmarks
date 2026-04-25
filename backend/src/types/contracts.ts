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

export type SyncPushPayload = {
  deviceId: string;
  browser: "CHROME" | "EDGE";
  cursor?: string;
  nodes: BookmarkNodeDTO[];
};

export type SyncPullResponse = {
  cursor: string;
  operations: Array<
    | { type: "UPSERT"; node: BookmarkNodeDTO }
    | { type: "DELETE"; appNodeId: string; reason: string }
    | { type: "CONFLICT"; appNodeId?: string; reason: string }
  >;
};
