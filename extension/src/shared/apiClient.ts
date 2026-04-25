import type { BookmarkNodeDTO } from "./types";

export class ApiClient {
  constructor(private baseUrl: string, private token: string) {}

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  }

  registerDevice(browser: "CHROME" | "EDGE", deviceName: string) {
    return this.request<{ deviceId: string }>("/devices/register", {
      method: "POST",
      body: JSON.stringify({ browser, deviceName }),
    });
  }

  pushBookmarks(payload: {
    deviceId: string;
    browser: "CHROME" | "EDGE";
    cursor?: string;
    nodes: BookmarkNodeDTO[];
  }) {
    return this.request<{ cursor: string }>("/sync/push", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  pullChanges(payload: { deviceId: string; cursor?: string }) {
    return this.request<{
      cursor: string;
      operations: Array<
        | { type: "UPSERT"; node: BookmarkNodeDTO }
        | { type: "DELETE"; appNodeId: string; reason: string }
        | { type: "CONFLICT"; appNodeId?: string; reason: string }
      >;
    }>("/sync/pull", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}
