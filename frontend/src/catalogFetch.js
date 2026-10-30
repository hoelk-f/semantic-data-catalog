// Guest reads never reuse an authenticated session or browser cookies.
export const anonymousCatalogFetch = (input, options = {}) =>
  globalThis.fetch(input, { ...options, credentials: 'omit' });

export const fetchCatalogResource = (session, input, options) =>
  session?.info?.isLoggedIn
    ? session.fetch(input, options)
    : anonymousCatalogFetch(input, options);
