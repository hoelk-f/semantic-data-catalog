import { Session } from "@inrupt/solid-client-authn-browser";

// Create a dedicated Solid session for this app with its own session ID so
// that multiple applications running on the same domain don't overwrite each
// other's authentication state in localStorage.
const SHARED_SESSION_ID = "solid-dataspace";
const KEY_CURRENT_SESSION = "solidClientAuthn:currentSession";
const STORAGE_PREFIX = "solidClientAuthenticationUser:";
const RETURN_TO_KEY = "solid-login-return-to";

const getSharedRedirectUrl = () => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/`;
};

export const session = new Session({
  clientName: "Semantic Data Catalog",
  sessionId: SHARED_SESSION_ID,
});

const ensureRedirectUrl = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (url.searchParams.has("code") || url.searchParams.has("state")) return;
  const sharedRedirectUrl = getSharedRedirectUrl();
  const currentSessionId = window.localStorage.getItem(KEY_CURRENT_SESSION);
  const sessionIds = new Set(
    [SHARED_SESSION_ID, currentSessionId].filter(Boolean)
  );
  sessionIds.forEach((sessionId) => {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${sessionId}`);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.redirectUrl !== sharedRedirectUrl) {
        data.redirectUrl = sharedRedirectUrl;
        delete data.clientId;
        delete data.clientSecret;
        delete data.clientName;
        delete data.clientType;
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
  if (session.info.isLoggedIn) {
    const returnTo = window.localStorage.getItem(RETURN_TO_KEY);
    if (returnTo) {
      window.localStorage.removeItem(RETURN_TO_KEY);
      if (returnTo.startsWith(window.location.origin) && returnTo !== window.location.href) {
        window.location.assign(returnTo);
      }
    }
  }
}

export function setLoginReturnTo() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RETURN_TO_KEY, window.location.href);
}

export function getSharedRedirectUrlForLogin() {
  return getSharedRedirectUrl();
}

