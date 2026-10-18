export const normalizeRegistryUrl = (value) => {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    return `${url.href.replace(/\/+$/, '')}/`;
  } catch { return ''; }
};

// These documents are supplied per host by the deployment's profile configuration.
// Personal memberships determine publication, never which registry this page browses.
export function resolveCatalogRegistry(appConfig = window.__APP_CONFIG__, env = window._env_) {
  const url = normalizeRegistryUrl(appConfig?.catalog?.defaultRegistry ?? env?.CATALOG_DEFAULT_REGISTRY);
  if (!url) return { url: '', label: '' };
  const presets = appConfig?.registries || env?.CATALOG_REGISTRIES || [];
  const preset = presets.find(entry => normalizeRegistryUrl(entry.url) === url);
  return {
    url,
    label: preset?.id || new URL(url).pathname.split('/').filter(Boolean).pop() || new URL(url).hostname,
  };
}
