import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createContainerAt, getContainedResourceUrlAll, getSolidDataset } from "@inrupt/solid-client";
import { session } from "../solidSession";

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

const getContainerName = (url, rootUrl = "") => {
  if (rootUrl && normalizeContainerUrl(url) === normalizeContainerUrl(rootUrl)) return "Pod Root";
  const name = url.split("/").filter(Boolean).pop() || url;
  return decodeURIComponent(name);
};

const isCatalogContainer = (url) => url.includes("/catalog/");

const compareEntries = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" });

const getPathFromContainerUrl = (containerUrl, rootUrl) => {
  if (!containerUrl || !rootUrl) return "/";

  try {
    const root = new URL(normalizeContainerUrl(rootUrl));
    const current = new URL(normalizeContainerUrl(containerUrl));
    const rootPath = root.pathname.endsWith("/") ? root.pathname : `${root.pathname}/`;
    const currentPath = current.pathname.endsWith("/") ? current.pathname : `${current.pathname}/`;
    const relativePath = currentPath.startsWith(rootPath) ? currentPath.slice(rootPath.length) : "";
    const cleanPath = relativePath.replace(/^\/+|\/+$/g, "");
    return cleanPath ? `/${cleanPath}/` : "/";
  } catch {
    return "/";
  }
};

const sanitizeFolderName = (value) => value.trim().replace(/^\/+|\/+$/g, "");

export default function PodContainerPicker({
  onSelectPath,
  webId,
}) {
  const effectiveWebId = webId || session.info.webId;
  const rootUrl = useMemo(() => getPodRootFromWebId(effectiveWebId), [effectiveWebId]);
  const cacheRef = useRef(new Map());
  const [currentUrl, setCurrentUrl] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderModalError, setFolderModalError] = useState("");

  const mapEntries = useCallback(
    (containerUrl, urls) =>
      urls
        .filter((url) => url.endsWith("/"))
        .filter((url) => !isCatalogContainer(url))
        .map((url) => ({
          url: normalizeContainerUrl(url),
          name: getContainerName(url, containerUrl),
        }))
        .sort(compareEntries),
    []
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

  const openContainer = (containerUrl) => {
    if (!containerUrl) return;
    onSelectPath?.(getPathFromContainerUrl(containerUrl, rootUrl));
    loadContainer(containerUrl);
  };

  const handleRefresh = () => {
    if (!currentUrl) return;
    cacheRef.current.delete(currentUrl);
    loadContainer(currentUrl, true);
  };

  const handleOpenFolderModal = () => {
    setFolderName("");
    setFolderModalError("");
    setFolderModalOpen(true);
  };

  const handleCloseFolderModal = () => {
    if (creating) return;
    setFolderModalOpen(false);
    setFolderName("");
    setFolderModalError("");
  };

  const handleCreateFolder = async (event) => {
    event?.preventDefault();

    const nextFolderName = sanitizeFolderName(folderName);
    if (!nextFolderName) {
      setFolderModalError("Folder name is required.");
      return;
    }
    if (/[\\/#?]/.test(nextFolderName)) {
      setFolderModalError("Folder name cannot contain /, \\, #, or ?.");
      return;
    }
    if (!currentUrl) return;

    const targetUrl = `${normalizeContainerUrl(currentUrl)}${encodeURIComponent(nextFolderName)}/`;
    try {
      setCreating(true);
      setError("");
      setFolderModalError("");
      await createContainerAt(targetUrl, { fetch: session.fetch });
      cacheRef.current.delete(currentUrl);
      setFolderModalOpen(false);
      setFolderName("");
      onSelectPath?.(getPathFromContainerUrl(targetUrl, rootUrl));
      await loadContainer(targetUrl, true);
    } catch (err) {
      const status = err?.statusCode || err?.response?.status;
      if (status === 409 || status === 412) {
        setFolderModalOpen(false);
        setFolderName("");
        onSelectPath?.(getPathFromContainerUrl(targetUrl, rootUrl));
        await loadContainer(targetUrl, true);
        return;
      }
      console.error("Failed to create pod folder:", err);
      setFolderModalError("Folder could not be created.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="pod-container-picker">
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
                    <button type="button" className="pod-picker-crumb-link" onClick={() => openContainer(crumb.url)}>
                      {crumb.name}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>
            <div className="pod-picker-toolbar-actions pod-container-toolbar-actions">
              <button
                type="button"
                className="pod-picker-new-folder-button"
                onClick={handleOpenFolderModal}
                disabled={!currentUrl || loading || creating}
                title="New Folder"
              >
                <i className="fa-solid fa-folder-plus"></i>
                {creating ? "Creating..." : "New Folder"}
              </button>
              <button type="button" className="pod-picker-icon-button" onClick={handleRefresh} disabled={!currentUrl || loading} title="Refresh">
                <i className="fa-solid fa-rotate-right"></i>
              </button>
            </div>
          </div>

          {error && <div className="pod-picker-state pod-picker-state--error">{error}</div>}
          {!error && loading && <div className="pod-picker-state">Loading folders...</div>}
          {!error && !loading && (
            <div className="pod-picker-table-wrap pod-container-table-wrap">
              <table className="pod-picker-table">
                <thead>
                  <tr>
                    <th>Folder</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.url} className="pod-picker-folder" onClick={() => openContainer(entry.url)}>
                      <td>
                        <i className="fa-solid fa-folder pod-picker-entry-icon"></i>
                        <span title={entry.name} translate="no">{entry.name}</span>
                      </td>
                    </tr>
                  ))}
                  {entries.length === 0 && (
                    <tr>
                      <td className="pod-picker-empty">No subfolders in this folder.</td>
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
      {folderModalOpen && (
        <div className="pod-folder-modal-backdrop" role="presentation" onClick={handleCloseFolderModal}>
          <form
            className="pod-folder-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pod-folder-modal-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleCreateFolder}
          >
            <div className="pod-folder-modal-header">
              <h6 id="pod-folder-modal-title">
                <i className="fa-solid fa-folder-plus"></i>
                New Folder
              </h6>
              <button type="button" className="pod-folder-modal-close" onClick={handleCloseFolderModal} aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="pod-folder-modal-body">
              <label htmlFor="pod-folder-name">Folder name</label>
              <input
                id="pod-folder-name"
                type="text"
                value={folderName}
                onChange={(event) => setFolderName(event.target.value)}
                placeholder="e.g. raw-data"
                autoFocus
              />
              {folderModalError && <div className="pod-folder-modal-error">{folderModalError}</div>}
            </div>
            <div className="pod-folder-modal-footer">
              <button type="button" className="pod-folder-modal-secondary" onClick={handleCloseFolderModal} disabled={creating}>
                Cancel
              </button>
              <button type="submit" className="pod-folder-modal-primary" disabled={creating || !folderName.trim()}>
                {creating ? "Creating..." : "Create Folder"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
