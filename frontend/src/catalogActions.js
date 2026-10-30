import { fetchCatalogResource } from './catalogFetch';
import { trackCatalogEvent } from "./statistics";

export const openExternalLink = (url, windowRef) => {
  const targetWindow = windowRef !== undefined
    ? windowRef
    : (typeof window !== "undefined" ? window : undefined);
  if (!url || !targetWindow?.open) return false;
  targetWindow.open(url, "_blank", "noopener,noreferrer");
  return true;
};

const startTracking = (trackEvent, options) => {
  try {
    const result = trackEvent(options);
    if (result && typeof result.catch === "function") {
      result.catch(() => false);
    }
  } catch {
    // Statistics are deliberately best effort and must never block the action.
  }
};

const triggerBrowserDownload = (blob, fileName, browser = {}) => {
  const documentRef = browser.document !== undefined
    ? browser.document
    : (typeof document !== "undefined" ? document : undefined);
  const urlApi = browser.URL !== undefined
    ? browser.URL
    : (typeof URL !== "undefined" ? URL : undefined);
  if (!documentRef?.createElement || !urlApi?.createObjectURL) {
    throw new Error("Browser download APIs are unavailable.");
  }

  const objectUrl = urlApi.createObjectURL(blob);
  try {
    const link = documentRef.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    link.click();
  } finally {
    urlApi.revokeObjectURL?.(objectUrl);
  }
};

export const openDatasetAccess = ({
  resourceUrl,
  windowRef,
} = {}) => {
  return openExternalLink(resourceUrl, windowRef);
};

export const downloadCatalogResource = async ({
  session,
  dataset,
  resourceUrl,
  fileName,
  eventType,
  statisticsConfig,
  trackEvent = trackCatalogEvent,
  openLink = openExternalLink,
  browser,
} = {}) => {
  let blob;
  try {
    const response = await fetchCatalogResource(session, resourceUrl);
    if (!response.ok) throw new Error("Download failed.");
    blob = await response.blob();
  } catch (error) {
    console.error("Download error:", error);
    openLink(resourceUrl);
    return false;
  }

  // Recording starts only after the protected resource was fetched as a blob.
  startTracking(trackEvent, {
    session,
    statisticsConfig,
    eventType,
    dataset,
    resourceUrl,
  });

  try {
    triggerBrowserDownload(blob, fileName, browser);
  } catch (error) {
    console.error("Browser download error:", error);
    openLink(resourceUrl);
  }
  return true;
};
