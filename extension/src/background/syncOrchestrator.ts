import { ApiClient } from "../shared/apiClient";
import { getState, setState } from "../shared/storage";
import type { BrowserName } from "../shared/types";
import { applyRemoteOperation, exportBrowserTree } from "./bookmarkAdapter";

const getBrowser = (): BrowserName => (navigator.userAgent.includes("Edg/") ? "EDGE" : "CHROME");

export const runSync = async () => {
  const state = await getState();
  if (!state.token) {
    throw new Error("Auth token missing");
  }

  const client = new ApiClient(state.apiBaseUrl, state.token);
  const browser = getBrowser();
  await setState({ syncStatus: "syncing", browser, lastError: undefined });

  let deviceId = state.deviceId;
  if (!deviceId) {
    const registration = await client.registerDevice(browser, `${browser}-extension`);
    deviceId = registration.deviceId;
    await setState({ deviceId });
  }

  const nodes = await exportBrowserTree();
  const pushResult = await client.pushBookmarks({
    deviceId,
    browser,
    cursor: state.lastCursor,
    nodes,
  });

  const pullResult = await client.pullChanges({ deviceId, cursor: pushResult.cursor });
  for (const operation of pullResult.operations) {
    await applyRemoteOperation(operation);
  }

  await setState({
    syncStatus: "idle",
    lastSyncAt: new Date().toISOString(),
    lastCursor: pullResult.cursor,
  });
};
