import type { ExtensionState } from "./types";

const key = "sync-state";

const defaultState: ExtensionState = {
  browser: "CHROME",
  apiBaseUrl: "http://localhost:4000/api",
  syncStatus: "idle",
};

export const getState = async (): Promise<ExtensionState> => {
  const response = await chrome.storage.local.get(key);
  return { ...defaultState, ...(response[key] as Partial<ExtensionState> | undefined) };
};

export const setState = async (patch: Partial<ExtensionState>) => {
  const current = await getState();
  const next = { ...current, ...patch };
  await chrome.storage.local.set({ [key]: next });
  return next;
};
