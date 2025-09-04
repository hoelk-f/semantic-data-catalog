import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

// Use the default Solid session instance, which automatically persists its
// state to `localStorage`. This keeps the user logged in across full page
// reloads without needing a manually managed session ID.
export const session = getDefaultSession();

// Restore a previous Solid session, if any, and handle redirects coming back
// from the identity provider. This should be awaited before rendering the app
// so that `session.info` is up to date.
export async function restoreSession() {
  if (typeof window === "undefined") return;
  await session.handleIncomingRedirect(window.location.href, {
    restorePreviousSession: true,
  });
}

