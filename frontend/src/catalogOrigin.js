// Catalog provenance is independent of dcterms:creator and source-file URLs.
const httpUrl = value => {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password && !url.search ? url : null;
  } catch { return null; }
};

export function catalogOrigin(catalogUrl, storageRoots = []) {
  const catalog = httpUrl(catalogUrl);
  if (!catalog) return null;
  const roots = storageRoots.map(httpUrl).filter(root => root && !root.hash &&
    root.origin === catalog.origin && root.pathname.endsWith("/") && catalog.pathname.startsWith(root.pathname));
  roots.sort((a, b) => b.pathname.length - a.pathname.length);
  let root = roots[0];
  if (!root) {
    // Established catalog/ layout; do not guess a Pod from an unrelated WebID
    // or from an arbitrary custom document's parent directory.
    const parts = catalog.pathname.split("/");
    const index = parts.lastIndexOf("catalog");
    if (index > 0) root = new URL(parts.slice(0, index).join("/") + "/", catalog.origin);
  }
  return { catalogUrl: catalog.href, podRoot: root?.href || "" };
}

export function datasetCatalogOrigins(dataset) {
  const origins = [...(dataset.catalogOrigins || []), ...(dataset.catalogUrl ? [{ catalogUrl: dataset.catalogUrl }] : [])];
  const resolved = new Map();
  for (const origin of origins) {
    const value = catalogOrigin(origin.catalogUrl, origin.podRoot ? [origin.podRoot] : []);
    if (value && (!resolved.has(value.catalogUrl) || (!resolved.get(value.catalogUrl).podRoot && value.podRoot))) resolved.set(value.catalogUrl, value);
  }
  return [...resolved.values()];
}

export function podNameFromRoot(root) {
  const url = httpUrl(root);
  if (!url) return "";
  try { return decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() || url.hostname.split(".")[0]); }
  catch { return url.hostname; }
}

export function datasetPodRoots(dataset) {
  return [...new Set(datasetCatalogOrigins(dataset).map(origin => origin.podRoot).filter(Boolean))];
}
export const datasetPodNames = dataset => [...new Set(datasetPodRoots(dataset).map(podNameFromRoot))].join(", ");
