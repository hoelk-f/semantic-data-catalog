import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getContainedResourceUrlAll, getSolidDataset } from "@inrupt/solid-client";
import { session } from "../solidSession";

const DATASET_EXTENSIONS = ["csv", "json", "geojson", "ttl", "jsonld", "rdf", "xml", "pdf", "docx", "txt"];
const SEMANTIC_MODEL_EXTENSIONS = ["ttl"];

const getPodRootFromWebId = (webId) => {
  if (!webId) return "";

  try {
    const url = new URL(webId);
    const segments = url.pathname.split("/").filter(Boolean);
    const profileIndex = segments.indexOf("profile");
    const baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments.slice(0, -1);
    const basePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";
    return `${url.origin}${basePath}`;
  } catch {
    const base = webId.split("/profile/")[0];
    return base.endsWith("/") ? base : `${base}/`;
  }
};

const normalizeContainerUrl = (url) => (url && url.endsWith("/") ? url : `${url}/`);

const getResourceName = (url, containerUrl = "") => {
  const relative = containerUrl && url.startsWith(containerUrl)
    ? url.slice(containerUrl.length)
    : url.split("/").filter(Boolean).pop() || url;
  return decodeURIComponent(relative.replace(/\/$/, ""));
};

const getExtension = (url) => {
  const cleanUrl = url.split(/[?#]/)[0];
  const name = cleanUrl.split("/").filter(Boolean).pop() || "";
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

const isCatalogResource = (url) => url.includes("/catalog/");

const compareEntries = (a, b) => {
  if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

export const isTtlResource = (value) => getExtension(value) === "ttl";

export default function PodResourcePicker({
  multiple = false,
  resourceType = "dataset",
  selectedUrl = "",
  selectedUrls = [],
  onSelect,
  webId,
}) {
  const effectiveWebId = webId || session.info.webId;
  const allowedExtensions = useMemo(
    () => new Set(resourceType === "semanticModel" ? SEMANTIC_MODEL_EXTENSIONS : DATASET_EXTENSIONS),
    [resourceType]
  );
  const rootUrl = useMemo(() => getPodRootFromWebId(effectiveWebId), [effectiveWebId]);
  const cacheRef = useRef(new Map());
  const [currentUrl, setCurrentUrl] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const isSelectableResource = useCallback(
    (url) => allowedExtensions.has(getExtension(url)),
    [allowedExtensions]
  );

  const mapEntries = useCallback(
    (containerUrl, urls) =>
      urls
        .filter((url) => !isCatalogResource(url))
        .map((url) => {
          const isFolder = url.endsWith("/");
          return {
            url,
            name: getResourceName(url, containerUrl),
            isFolder,
            selectable: !isFolder && isSelectableResource(url),
          };
        })
        .filter((entry) => entry.isFolder || entry.selectable)
        .sort(compareEntries),
    [isSelectableResource]
  );

  const loadContainer = useCallback(
    async (containerUrl, force = false) => {
      if (!containerUrl) return;
      const normalizedUrl = normalizeContainerUrl(containerUrl);
      setCurrentUrl(normalizedUrl);
      setError("");

      if (!force && cacheRef.current.has(normalizedUrl)) {
        setEntries(cacheRef.current.get(normalizedUrl));
        return;
      }

      try {
        setLoading(true);
        const dataset = await getSolidDataset(normalizedUrl, { fetch: session.fetch });
        const containedUrls = getContainedResourceUrlAll(dataset);
        const nextEntries = mapEntries(normalizedUrl, Array.from(new Set(containedUrls)));
        cacheRef.current.set(normalizedUrl, nextEntries);
        setEntries(nextEntries);
      } catch (err) {
        console.error(`Failed to load pod container ${normalizedUrl}:`, err);
        setEntries([]);
        setError("This folder could not be loaded.");
      } finally {
        setLoading(false);
      }
    },
    [mapEntries]
  );

  useEffect(() => {
    cacheRef.current.clear();
    setSearchQuery("");
    if (!rootUrl) {
      setCurrentUrl("");
      setEntries([]);
      return;
    }
    loadContainer(rootUrl, true);
  }, [rootUrl, loadContainer]);

  const crumbs = useMemo(() => {
    if (!rootUrl || !currentUrl) return [];

    try {
      const root = new URL(rootUrl);
      const current = new URL(currentUrl);
      const rootPath = root.pathname.endsWith("/") ? root.pathname : `${root.pathname}/`;
      const currentPath = current.pathname.endsWith("/") ? current.pathname : `${current.pathname}/`;
      const relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : "";
      const parts = relativePath.split("/").filter(Boolean);
      const nextCrumbs = [{ name: "Pod Root", url: rootUrl }];
      parts.forEach((part, index) => {
        nextCrumbs.push({
          name: decodeURIComponent(part),
          url: `${rootUrl}${parts.slice(0, index + 1).join("/")}/`,
        });
      });
      return nextCrumbs;
    } catch {
      return [{ name: "Pod Root", url: rootUrl }];
    }
  }, [currentUrl, rootUrl]);

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return entries;
    return entries.filter((entry) => entry.name.toLowerCase().includes(query));
  }, [entries, searchQuery]);

  const selectedUrlList = useMemo(() => {
    const urls = multiple ? selectedUrls : [selectedUrl];
    return Array.from(new Set((urls || []).filter(Boolean)));
  }, [multiple, selectedUrl, selectedUrls]);
  const selectedUrlSet = useMemo(() => new Set(selectedUrlList), [selectedUrlList]);
  const hasSelectedUrls = selectedUrlList.length > 0;
  const selectedLabel = multiple && selectedUrlList.length > 1
    ? `Selected Datasets (${selectedUrlList.length})`
    : "Selected";

  const handleRefresh = () => {
    if (!currentUrl) return;
    cacheRef.current.delete(currentUrl);
    loadContainer(currentUrl, true);
  };

  const handleSelect = (url) => {
    if (!isSelectableResource(url)) return;
    if (!multiple) {
      onSelect?.(url);
      return;
    }

    const nextUrls = selectedUrlSet.has(url)
      ? selectedUrlList.filter((selected) => selected !== url)
      : [...selectedUrlList, url];
    onSelect?.(nextUrls, url);
  };

  const handleRemoveSelected = (url) => {
    if (!multiple) return;
    onSelect?.(selectedUrlList.filter((selected) => selected !== url), url);
  };

  return (
    <div className="pod-resource-picker">
      {hasSelectedUrls && (
        <div className="pod-picker-heading">
          <div className="pod-picker-selected">
            <i className="fa-solid fa-circle-check"></i>
            <div>
              <span>{selectedLabel}</span>
              <div className="pod-picker-selected-list">
                {selectedUrlList.map((url) => (
                  <div key={url} className="pod-picker-selected-item">
                    <div className="pod-picker-selected-text">
                      <strong>{getResourceName(url)}</strong>
                      <small>{url}</small>
                    </div>
                    {multiple && (
                      <button
                        type="button"
                        className="pod-picker-selected-remove"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveSelected(url);
                        }}
                        aria-label={`Remove ${getResourceName(url)}`}
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {rootUrl ? (
        <>
          <div className="pod-picker-toolbar">
            <div className="pod-picker-crumbs" translate="no">
              {crumbs.map((crumb, index) => (
                <React.Fragment key={crumb.url}>
                  {index > 0 && <i className="fa-solid fa-chevron-right pod-picker-crumb-separator"></i>}
                  {index === crumbs.length - 1 ? (
                    <span className="pod-picker-crumb-current">{crumb.name}</span>
                  ) : (
                    <button type="button" className="pod-picker-crumb-link" onClick={() => loadContainer(crumb.url)}>
                      {crumb.name}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="pod-picker-toolbar-actions">
              <div className="pod-picker-search">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search files..."
                />
                <i className="fa-solid fa-magnifying-glass"></i>
              </div>
              <button
                type="button"
                className="pod-picker-icon-button"
                onClick={handleRefresh}
                disabled={!currentUrl || loading}
                title="Refresh"
              >
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          </div>

          {error ? (
            <div className="pod-picker-state pod-picker-state--error">{error}</div>
          ) : loading ? (
            <div className="pod-picker-state">Loading...</div>
          ) : (
            <div className="pod-picker-table-wrap">
              <table className="pod-picker-table">
                <thead>
                  <tr>
                    <th>Name</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.map((entry) => {
                    const isSelected = selectedUrlSet.has(entry.url);
                    return (
                      <tr
                        key={entry.url}
                        className={`${entry.isFolder ? "pod-picker-folder" : "pod-picker-file"} ${isSelected ? "pod-picker-row-selected" : ""}`}
                        onClick={() => {
                          if (entry.isFolder) {
                            loadContainer(entry.url);
                          } else {
                            handleSelect(entry.url);
                          }
                        }}
                      >
                        <td>
                          <i className={`fa-solid ${entry.isFolder ? "fa-folder" : "fa-file"} pod-picker-entry-icon`}></i>
                          <span title={entry.name} translate="no">{entry.name}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {visibleEntries.length === 0 && (
                    <tr>
                      <td className="pod-picker-empty">No matching files in this folder.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="pod-picker-state pod-picker-state--error">No Solid Pod is available.</div>
      )}
    </div>
  );
}
