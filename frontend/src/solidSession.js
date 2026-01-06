import { Session } from "@inrupt/solid-client-authn-browser";

// Create a dedicated Solid session for this app with its own session ID so
// that multiple applications running on the same domain don't overwrite each
// other's authentication state in localStorage.
const SHARED_SESSION_ID = "solid-dataspace";
const KEY_CURRENT_SESSION = "solidClientAuthn:currentSession";
const STORAGE_PREFIX = "solidClientAuthenticationUser:";

export const session = new Session({
  clientName: "Semantic Data Catalog",
  sessionId: SHARED_SESSION_ID,
});

const ensureRedirectUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("code") || url.searchParams.has("state")) return;
  const nextUrl = url.toString();
  const sameOrigin = (value) => {
    try {
      return new URL(value).origin === window.location.origin;
    } catch {
      return false;
    }
  };
  const currentSessionId = window.localStorage.getItem(KEY_CURRENT_SESSION);
  const sessionIds = new Set(
    [SHARED_SESSION_ID, currentSessionId].filter(Boolean)
  );
  sessionIds.forEach((sessionId) => {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (!data.redirectUrl || !sameOrigin(data.redirectUrl)) {
        data.redirectUrl = nextUrl;
      } else if (data.redirectUrl !== nextUrl) {
        data.redirectUrl = nextUrl;
      }
      window.localStorage.setItem(
        `${STORAGE_PREFIX}${sessionId}`,
        JSON.stringify(data)
      );
    } catch {}
  });
};

// Restore a previous Solid session, if any, and handle redirects coming back
// from the identity provider. This should be awaited before rendering the app
// so that `session.info` is up to date.
export async function restoreSession() {
  if (typeof window === "undefined") return;
  ensureRedirectUrl();
  await session.handleIncomingRedirect(window.location.href, {
    restorePreviousSession: true,
  });
}

