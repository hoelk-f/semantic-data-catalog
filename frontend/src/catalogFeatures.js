// API descriptions remain readable for compatibility, but are not part of the
// proposed SolidDCAT base profile. Keep this extension out of the catalog UI
// and disable its writer until an explicit profile extension is adopted.
export const API_CATALOG_ENTRIES_ENABLED = false;

export const isVisibleCatalogEntry = entry =>
  API_CATALOG_ENTRIES_ENABLED || entry.datasetType !== "service";

export function assertApiCatalogWritesEnabled() {
  if (!API_CATALOG_ENTRIES_ENABLED) {
    throw new Error("Creating or editing API catalog entries is currently disabled.");
  }
}
