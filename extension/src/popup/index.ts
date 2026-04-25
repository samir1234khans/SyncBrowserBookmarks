import { getState, setState } from "../shared/storage";
import { exportBrowserTree } from "../background/bookmarkAdapter";

const syncStatus = document.getElementById("syncStatus") as HTMLSpanElement;
const lastSync = document.getElementById("lastSync") as HTMLSpanElement;
const bookmarkCount = document.getElementById("bookmarkCount") as HTMLSpanElement;
const statusText = document.getElementById("status") as HTMLDivElement;
const syncNowButton = document.getElementById("syncNow") as HTMLButtonElement;
const loginButton = document.getElementById("login") as HTMLButtonElement;

const render = async () => {
  const state = await getState();
  const bookmarks = await exportBrowserTree();

  syncStatus.textContent = state.syncStatus;
  lastSync.textContent = state.lastSyncAt ? new Date(state.lastSyncAt).toLocaleString() : "Never";
  bookmarkCount.textContent = String(bookmarks.length);
  statusText.textContent = state.lastError ?? (state.token ? "Authenticated" : "Login needed");
};

syncNowButton.addEventListener("click", async () => {
  statusText.textContent = "Sync started...";
  await chrome.runtime.sendMessage({ type: "SYNC_NOW" });
  await render();
});

loginButton.addEventListener("click", async () => {
  const email = prompt("Email")?.trim();
  const password = prompt("Password (min 8 chars)")?.trim();

  if (!email || !password) {
    statusText.textContent = "Email and password are required.";
    return;
  }

  const state = await getState();
  const response = await fetch(`${state.apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const fallback = await fetch(`${state.apiBaseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!fallback.ok) {
      statusText.textContent = "Authentication failed.";
      return;
    }

    const registered = (await fallback.json()) as { token: string };
    await setState({ token: registered.token });
    statusText.textContent = "Registered and authenticated.";
    await render();
    return;
  }

  const loggedIn = (await response.json()) as { token: string };
  await setState({ token: loggedIn.token });
  statusText.textContent = "Logged in successfully.";
  await render();
});

void render();
