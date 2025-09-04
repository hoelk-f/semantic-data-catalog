import { Session } from "@inrupt/solid-client-authn-browser";

// Shared Solid session with a fixed ID so that login information can be
// restored automatically after a page refresh.
export const session = new Session({ sessionId: 'semantic-data-catalog' });

// Restore a previous Solid session, if any, and handle redirects coming back
// from the identity provider. This should be awaited before rendering the app
// so that `session.info` is up to date.
export async function restoreSession() {
  if (typeof window === "undefined") return;
  await session.handleIncomingRedirect(window.location.href, {
    restorePreviousSession: true,
  });
}

