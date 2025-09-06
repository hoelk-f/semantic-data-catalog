import { Session } from "@inrupt/solid-client-authn-browser";

// Simple IStorage wrapper backed by the browser's localStorage so that
// authentication data survives full page reloads. Using a custom storage
// wrapper avoids clashing with other apps running on the same origin because
// we provide a dedicated session identifier below.
const localStorageWrapper = {
  get: async (key) =>
    typeof window === "undefined"
      ? undefined
      : window.localStorage.getItem(key) ?? undefined,
  set: async (key, value) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
  },
  delete: async (key) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
  },
};

// Create a dedicated Solid session for this app with its own session ID so
// that multiple applications running on the same domain don't overwrite each
// other's authentication state in storage.
export const session = new Session({
  clientName: "Semantic Data Catalog",
  sessionId: "semantic-data-catalog",
  secureStorage: localStorageWrapper,
  insecureStorage: localStorageWrapper,
});

// Restore a previous Solid session, if any, and handle redirects coming back
// from the identity provider. This should be awaited before rendering the app
// so that `session.info` is up to date.
export async function restoreSession() {
  if (typeof window === "undefined") return session;
  await session.handleIncomingRedirect(window.location.href, {
    restorePreviousSession: true,
  });
  return session;
}

