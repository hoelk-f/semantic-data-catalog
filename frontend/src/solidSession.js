import { Session } from "@inrupt/solid-client-authn-browser";

// Simple IStorage wrapper backed by the browser's sessionStorage so that
// authentication data is kept only for the lifetime of the tab.
const sessionStorageWrapper = {
  get: async (key) =>
    typeof window === "undefined"
      ? undefined
      : window.sessionStorage.getItem(key) ?? undefined,
  set: async (key, value) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(key, value);
    }
  },
  delete: async (key) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(key);
    }
  },
};

// Create a dedicated Solid session for this app with its own session ID so
// that multiple applications running on the same domain don't overwrite each
// other's authentication state in localStorage.
export let session = new Session({
  clientName: "Semantic Data Catalog",
  sessionId: "semantic-data-catalog",
  // Store session state in sessionStorage rather than localStorage
  secureStorage: sessionStorageWrapper,
  insecureStorage: sessionStorageWrapper,
});

export function setSession(nextSession) {
  if (!nextSession) return;
  session = nextSession;
}

// Restore a previous Solid session, if any, and handle redirects coming back
// from the identity provider. This should be awaited before rendering the app
// so that `session.info` is up to date.
export async function restoreSession() {
  if (typeof window === "undefined") return;
  await session.handleIncomingRedirect(window.location.href, {
    restorePreviousSession: true,
  });
}
