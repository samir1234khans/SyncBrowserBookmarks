import { runSync } from "./syncOrchestrator";
import { setState } from "../shared/storage";

const safeSync = async () => {
  try {
    await runSync();
  } catch (error) {
    await setState({
      syncStatus: "error",
      lastError: error instanceof Error ? error.message : String(error),
    });
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("bookmark-sync", { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "bookmark-sync") {
    void safeSync();
  }
});

const bookmarkEvents = [
  chrome.bookmarks.onCreated,
  chrome.bookmarks.onChanged,
  chrome.bookmarks.onMoved,
  chrome.bookmarks.onRemoved,
];

for (const event of bookmarkEvents) {
  event.addListener(() => {
    void safeSync();
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "SYNC_NOW") {
    void safeSync().then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});
