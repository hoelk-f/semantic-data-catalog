import { Session } from "@inrupt/solid-client-authn-browser";

// Create a dedicated Solid session for this app with its own session ID so
// that multiple applications running on the same domain don't overwrite each
// other's authentication state in localStorage.
export const session = new Session({
  clientName: "Semantic Data Catalog",
  sessionId: "semantic-data-catalog",
});

// Restore a previous Solid session, if any, and handle redirects coming back
// from the identity provider. This should be awaited before rendering the app
// so that `session.info` is up to date.
export async function restoreSession() {
  if (typeof window === "undefined") return;
  await session.handleIncomingRedirect(window.location.href, {
    restorePreviousSession: true,
  });
}

