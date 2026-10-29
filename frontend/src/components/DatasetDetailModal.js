import { readAccessRequestState } from "../accessRequestState";
import React, { useState, useEffect, useCallback } from 'react';
import { describeModelReference, parseReferenceTriples } from "../modelReference";
import { session } from "../solidSession";
import RDFGraph from "./RDFGraph";
import RequestDatasetModal from "./RequestDatasetModal";
import RequestSuccessModal from "./RequestSuccessModal";
import {
  getSolidDataset,
  getThing,
  getThingAll,
  getStringNoLocale,
  getUrl,
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";
import {
  downloadCatalogResource,
  openExternalLink,
  openDatasetAccess,
} from "../catalogActions";
import { CATALOG_EVENT_TYPES } from "../statistics";
import {
  getCatalogWebHref,
  getContactPointHref,
} from "../catalogContact";
import { getSolidProfileEmail } from "../solidProfileContact";
import "./DatasetDetailModal.css";

const getPodRootFromWebId = (webId) => {
  if (!webId) return "";
  try {
    const url = new URL(webId);
    const segments = url.pathname.split("/").filter(Boolean);
    const profileIndex = segments.indexOf("profile");
    const baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments;
    const basePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";
    return `${url.origin}${basePath}`;
  } catch {
    return "";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const getResourceLabel = (url, { fallback = "Open resource" } = {}) => {
  if (!url) return fallback;
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment.includes(".")) {
      return decodeURIComponent(lastSegment);
    }
    return parsed.hostname || fallback;
  } catch {
    return url;
  }
};

const DatasetDetailModal = ({
  dataset,
  onClose,
  sessionWebId,
  userName,
  userEmail,
  datasets = [],
  onEditClick,
  onDeleteClick,
  statisticsConfig,
  presentation = "modal",
}) => {
  const [showVisualization, setShowVisualization] = useState(false);
  const [modelReference, setModelReference] = useState(null);
  const modelUrl = dataset?.access_url_semantic_model || "";
  const currentModel = modelReference?.url === modelUrl ? modelReference : null;
  const triples = currentModel?.triples || [];
  const modelPresentation = currentModel?.presentation || describeModelReference(modelUrl);
  const [canAccessDataset, setCanAccessDataset] = useState(false);
  const [canAccessModel, setCanAccessModel] = useState(false);
  const [ownerProfile, setOwnerProfile] = useState({
    name: "",
    email: "",
    photo: "",
    webId: "",
  });
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const nestedDialogOpen = showRequestModal || showRequestSuccess;

  const [requestState, setRequestState] = useState({ status: "loading" });
  const [requestAttempt, setRequestAttempt] = useState(0);
  const refreshRequest = useCallback(() => setRequestAttempt(value => value + 1), []);
  const requestPending = requestState.status === "pending";

  const isSeries = dataset?.datasetType === "series";
  const datasetLookup = new Map(
    (datasets || []).map((item) => [item.datasetUrl, item])
  );
  const resolveSeriesMember = (url) => {
    const match = datasetLookup.get(url);
    if (!match) return { title: url, url };
    return {
      title: match.title || match.identifier || url,
      url,
    };
  };

  const formatTheme = (value) => {
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) {
      try {
        const url = new URL(value);
        if (url.hash) return url.hash.replace("#", "");
        const parts = url.pathname.split("/").filter(Boolean);
        return parts[parts.length - 1] || value;
      } catch {
        return value;
      }
    }
    if (value.includes(":")) {
      return value.split(":").pop();
    }
    return value;
  };

  const isPodManagedUrl = (url) => {
    if (!url) return false;
    const ownerRoot = getPodRootFromWebId(dataset?.webid);
    return Boolean(ownerRoot && url.startsWith(ownerRoot));
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setShowVisualization(false);
    setModelReference(null);
    if (isSeries || !modelUrl || !canAccessModel) return undefined;
    const loadReference = async () => {
      try {
        const response = await session.fetch(modelUrl, { signal: controller.signal });
        if (!response.ok) return;
        const contentType = response.headers?.get("content-type") || "";
        let presentation = describeModelReference(modelUrl, { contentType });
        let mapped = [];
        if (!["application/pdf", "text/html"].includes(presentation.mime)) {
          const text = await response.text();
          presentation = describeModelReference(modelUrl, { contentType, text });
          mapped = parseReferenceTriples(text, response.url || modelUrl, presentation.mime);
          if (mapped.length && !presentation.mime) presentation = { ...presentation, content: "Content: RDF model", format: "RDF", code: "RDF", action: "download" };
        } else {
          await response.body?.cancel();
        }
        if (!cancelled) setModelReference({ url: modelUrl, presentation, triples: mapped });
      } catch {
        // CORS, unavailable resources and unsupported formats keep the neutral URL-based label.
      }
    };
    loadReference();
    return () => { cancelled = true; controller.abort(); };
  }, [modelUrl, canAccessModel, isSeries]);

  useEffect(() => {
    let cancelled = false;
    setCanAccessDataset(false);
    setCanAccessModel(false);
    const checkAccess = async () => {
      if (!dataset || isSeries) return;
      if (dataset.is_public || dataset.webid === sessionWebId) {
        setCanAccessDataset(true);
        setCanAccessModel(true);
        return;
      }
      if (!session.info.isLoggedIn || !sessionWebId) return;
      // Read access is determined by the resource response, not by being able
      // to inspect somebody else's ACL. HEAD also avoids downloading the data.
      const canRead = async (url) => {
        if (!url || !isPodManagedUrl(url)) return false;
        try { return (await session.fetch(url, { method: "HEAD" })).ok; }
        catch { return false; }
      };
      const [datasetAccess, modelAccess] = await Promise.all([
        canRead(dataset.access_url_dataset), canRead(dataset.access_url_semantic_model),
      ]);
      if (!cancelled) {
        setCanAccessDataset(datasetAccess);
        setCanAccessModel(modelAccess);
      }
    };
    checkAccess();
    return () => { cancelled = true; };
  }, [dataset, sessionWebId, isSeries, requestAttempt]);

  useEffect(() => {
    let cancelled = false;
    if (!dataset || isSeries || dataset.is_public || dataset.webid === sessionWebId || !sessionWebId) {
      setRequestState({ status: "none" });
      return undefined;
    }
    setRequestState({ status: "loading" });
    readAccessRequestState({ session, dataset }).then(result => {
      if (!cancelled) setRequestState(result);
    });
    return () => { cancelled = true; };
  }, [dataset, sessionWebId, isSeries, requestAttempt]);

  useEffect(() => {
    window.addEventListener("focus", refreshRequest);
    return () => window.removeEventListener("focus", refreshRequest);
  }, [refreshRequest]);

  useEffect(() => {
    let cancelled = false;
    let photoObjectUrl = "";
    const ownerWebId = dataset?.webid || "";

    const fallbackProfile = {
      name: dataset?.publisher || "Solid Pod User",
      email: getContactPointHref(
        dataset?.contact_point,
        dataset?.contact_point_type
      ).startsWith("mailto:")
        ? dataset.contact_point
        : "No email provided",
      photo: "",
      webId: ownerWebId,
    };

    const loadOwnerProfile = async () => {
      if (!ownerWebId) {
        setOwnerProfile(fallbackProfile);
        return;
      }

      try {
        const profileDocUrl = ownerWebId.split("#")[0] || ownerWebId;
        const profileDataset = await getSolidDataset(profileDocUrl, { fetch: session.fetch });
        const profile =
          getThing(profileDataset, ownerWebId) ||
          getThingAll(profileDataset).find((thing) => thing.url === ownerWebId);
        if (!profile) {
          if (!cancelled) setOwnerProfile(fallbackProfile);
          return;
        }

        const name =
          getStringNoLocale(profile, FOAF.name) ||
          getStringNoLocale(profile, VCARD.fn) ||
          fallbackProfile.name;
        const email = getSolidProfileEmail(profileDataset, profile) || fallbackProfile.email;
        const photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
        let photo = "";
        if (photoRef) {
          try {
            const photoUrl = new URL(photoRef, profileDocUrl).toString();
            const photoResponse = await session.fetch(photoUrl);
            if (photoResponse.ok) {
              const photoBlob = await photoResponse.blob();
              photoObjectUrl = URL.createObjectURL(photoBlob);
              if (cancelled) {
                URL.revokeObjectURL(photoObjectUrl);
                return;
              }
              photo = photoObjectUrl;
            }
          } catch {
            photo = "";
          }
        }

        if (!cancelled) {
          setOwnerProfile({
            name,
            email,
            photo,
            webId: ownerWebId,
          });
        }
      } catch (err) {
        console.error("Failed to load dataset owner profile:", err);
        if (!cancelled) setOwnerProfile(fallbackProfile);
      }
    };

    loadOwnerProfile();
    return () => {
      cancelled = true;
      if (photoObjectUrl) {
        URL.revokeObjectURL(photoObjectUrl);
      }
    };
  }, [dataset]);

  if (!dataset) return null;
  const hasSemanticModel = Boolean(dataset.access_url_semantic_model);
  const datasetLinkType = dataset.distribution_access_type === "access" ? "access" : "download";
  const datasetFileName = getResourceLabel(dataset.access_url_dataset, {
    fallback: "Dataset resource",
  });
  const modelFileName = getResourceLabel(dataset.access_url_semantic_model, {
    fallback: "Model, schema or specification",
  });
  const datasetFileType = datasetLinkType === "access"
    ? "URL"
    : (datasetFileName.split(".").pop() || "DATA").slice(0, 5).toUpperCase();
  const modelFileType = modelPresentation.code;
  const datasetActionIsDownload = datasetLinkType === "download";
  const modelActionIsDownload = modelPresentation.action === "download";
  const hasUserAccess = dataset.is_public || canAccessDataset;
  const canRequestAccess = !isSeries && !dataset.is_public && !hasUserAccess && Boolean(dataset.webid);
  const requestButtonDisabled = canRequestAccess && (requestPending || requestState.status === "loading");
  const canManageDataset = Boolean(dataset.webid && sessionWebId && dataset.webid === sessionWebId);
  const titleValue = dataset.title || "Untitled dataset";
  const descriptionValue = dataset.description || "No description provided.";
  const themeValues = String(dataset.theme || "")
    .split(/[,;|]/)
    .map((value) => value.trim())
    .filter(Boolean);
  const accessRightsValue = dataset.is_public
    ? "Public"
    : hasUserAccess
      ? "Restricted (you have access)"
      : "Restricted";
  const contactPointHref = getContactPointHref(
    dataset.contact_point,
    dataset.contact_point_type
  );
  const contactPointIsWeb = contactPointHref.startsWith("http");
  const publisherHref = getCatalogWebHref(dataset.publisher_url);
  const detailRows = [
    { predicate: "dct:identifier", value: dataset.identifier },
    { predicate: "dct:issued", value: formatDate(dataset.issued) },
    { predicate: "dct:modified", value: formatDate(dataset.modified) },
    {
      predicate: "dct:publisher",
      value: publisherHref ? (
        <a href={publisherHref} target="_blank" rel="noopener noreferrer">
          {dataset.publisher || publisherHref}
        </a>
      ) : dataset.publisher,
    },
    {
      predicate: "dcat:contactPoint",
      value: dataset.contact_point ? (
        contactPointHref ? (
          <a
            href={contactPointHref}
            target={contactPointIsWeb ? "_blank" : undefined}
            rel={contactPointIsWeb ? "noopener noreferrer" : undefined}
          >
            {dataset.contact_point}
          </a>
        ) : dataset.contact_point
      ) : null,
    },
    {
      predicate: "dct:creator",
      value: dataset.webid ? (
        <a href={dataset.webid} target="_blank" rel="noopener noreferrer">
          {dataset.webid}
        </a>
      ) : null,
    },
    { predicate: "dct:accessRights", value: accessRightsValue, isUiCopy: true },
    {
      predicate: "dcat:distribution",
      value: isSeries ? "Dataset series" : datasetLinkType === "access" ? "Access URL" : "Download URL",
      isUiCopy: true,
    },
  ];

  if (!isSeries && dataset.access_url_dataset) {
    detailRows.push({
      predicate: datasetLinkType === "access" ? "dcat:accessURL" : "dcat:downloadURL",
      value: (
        <a
          href={dataset.access_url_dataset}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.preventDefault();
            triggerDatasetAction();
          }}
        >
          {dataset.access_url_dataset}
        </a>
      ),
    });
  }

  if (!isSeries && hasSemanticModel) {
    detailRows.push({
      predicate: "dct:conformsTo",
      value: (
        <a
          href={dataset.access_url_semantic_model}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.preventDefault();
            triggerModelAction();
          }}
        >
          {dataset.access_url_semantic_model}
        </a>
      ),
    });
  }

  if (isSeries) {
    detailRows.push({
      predicate: "dcat:seriesMember",
      value: `${(dataset.seriesMembers || []).length} member${(dataset.seriesMembers || []).length === 1 ? "" : "s"}`,
    });
  }

  const renderDetailValue = (value) => {
    if (value === 0) return value;
    return value || <span className="text-muted">N/A</span>;
  };
  const triggerDatasetAction = () => {
    if (datasetActionIsDownload) {
      downloadCatalogResource({
        session,
        dataset,
        resourceUrl: dataset.access_url_dataset,
        fileName: datasetFileName,
        eventType: CATALOG_EVENT_TYPES.datasetDownload,
        statisticsConfig,
      });
      return;
    }
    openDatasetAccess({
      resourceUrl: dataset.access_url_dataset,
    });
  };
  const triggerModelAction = () => {
    if (modelActionIsDownload) {
      downloadCatalogResource({
        session,
        dataset,
        resourceUrl: dataset.access_url_semantic_model,
        fileName: modelFileName,
        eventType: CATALOG_EVENT_TYPES.semanticModelDownload,
        statisticsConfig,
      });
      return;
    }
    openExternalLink(dataset.access_url_semantic_model);
  };
  const handleEditAction = () => {
    onEditClick?.(dataset);
  };
  const handleDeleteAction = () => {
    onDeleteClick?.(dataset);
  };

  const metadataLabels = {
    "dct:identifier": "Identifier", "dct:issued": "Issued Date", "dct:modified": "Modified Date",
    "dct:publisher": "Publisher", "dcat:contactPoint": "Contact point", "dct:creator": "Pod owner",
    "dct:accessRights": "Access Rights", "dcat:distribution": "Resource type",
    "dcat:accessURL": "Access URL", "dcat:downloadURL": "Download URL",
    "dct:conformsTo": "Model, schema or specification", "dcat:seriesMember": "Members",
  };

  return (
    <div className={presentation === "inline" ? "catalog-detail-content" : undefined}>
      <div inert={nestedDialogOpen ? true : undefined} className={presentation === "inline" ? "catalog-detail-inline" : "modal show modal-show dataset-add-modal dataset-detail-modal"}>
        <div className="modal-dialog modal-xl dataset-detail-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fa-solid fa-database mr-2"></i> Detail Dataset
              </h5>
              <div className="dataset-detail-header-actions">
                {canManageDataset && (
                  <>
                    <button
                      type="button"
                      className="dataset-detail-action-button dataset-detail-action-button--edit"
                      onClick={handleEditAction}
                    >
                      <i className="fa-regular fa-pen-to-square"></i>
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      className="dataset-detail-action-button dataset-detail-action-button--delete"
                      onClick={handleDeleteAction}
                    >
                      <i className="fa-solid fa-trash"></i>
                      <span>Delete</span>
                    </button>
                  </>
                )}
                {canRequestAccess && (
                  <button
                    type="button"
                    className="btn btn-light dataset-detail-request-button"
                    onClick={() => setShowRequestModal(true)}
                    disabled={requestButtonDisabled}
                    title={
                      requestButtonDisabled
                        ? "Request already sent. Waiting for the dataset owner."
                        : "Request access to this dataset"
                    }
                  >
                    {requestState.status === "loading" ? "Checking request status..." : requestPending ? "Request Pending" : ["revoked", "denied", "expired", "archived", "unknown"].includes(requestState.status) ? "Request again" : "Request Dataset"}
                  </button>
                )}
              </div>
              <button type="button" className="close" onClick={onClose} aria-label="Close"><span>&times;</span></button>
            </div>

            <div className="modal-body dataset-detail-body">
              {!isSeries && !dataset.is_public && dataset.webid !== sessionWebId && (
                <div className="dataset-request-status" role="status">
                  <span>{({ loading: "Checking request status...", pending: "Request pending", approved: "Request approved", revoked: "Access revoked", denied: "Request denied", expired: "Access expired", archived: "Request closed", unknown: "Request status could not be confirmed. You can check again or send a new request." })[requestState.status]}</span>
                  <button type="button" className="btn btn-light" onClick={refreshRequest} disabled={requestState.status === "loading"}>Check request status</button>
                </div>
              )}

              <section className="dataset-detail-hero">
                <div className="detail-predicate-label">dct:title</div>
                <h2 translate={dataset.title ? "no" : undefined}>{titleValue}</h2>
                {presentation === "inline" && <div className="catalog-detail-access">
                  <span className={`catalog-access catalog-access--${isSeries ? "series" : dataset.is_public ? "public" : hasUserAccess ? "available" : "restricted"}`}>
                    {isSeries ? "Dataset Series" : accessRightsValue}
                  </span>
                </div>}
                <div className="dataset-detail-description">
                  <div className="detail-predicate-label">dct:description</div>
                  <p translate={dataset.description ? "no" : undefined}>{descriptionValue}</p>
                </div>
              </section>

              <div className="pod-info-card dataset-detail-owner-card">
                <div className="pod-info-left">
                  {ownerProfile.photo ? (
                    <img src={ownerProfile.photo} alt="Dataset owner" className="pod-avatar" />
                  ) : (
                    <div className="pod-avatar pod-avatar--placeholder">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                  <div>
                    <div className="pod-name" translate={ownerProfile.name ? "no" : undefined}>{ownerProfile.name || "Solid Pod User"}</div>
                    <div className="pod-meta">{ownerProfile.email || "No email provided"}</div>
                    <div className="pod-meta pod-webid">
                      <i className="fa-solid fa-link"></i>
                      <span>{ownerProfile.webId || "No WebID"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {!isSeries && (
                <section className="dataset-detail-section dataset-detail-card">
                  <h3>Files and Sources</h3>
                  <div className="detail-file-list">
                    <div className={`detail-file-row ${!canAccessDataset ? "is-restricted" : ""}`}>
                      <div className="detail-file-icon">
                        <span className="detail-file-icon-code">{datasetFileType}</span>
                      </div>
                      <div className="detail-file-main">
                        <div className="detail-file-title" translate={dataset.access_url_dataset ? "no" : undefined}>{datasetFileName}</div>
                        <div className="detail-file-meta">Content: Dataset file</div>
                        <div className="detail-file-meta">
                          Access: {canAccessDataset ? accessRightsValue : "Restricted"}
                        </div>
                      </div>
                      <button
                        className="detail-download-button"
                        onClick={triggerDatasetAction}
                        disabled={!canAccessDataset || !dataset.access_url_dataset}
                      >
                        {datasetActionIsDownload ? "Download" : "Open"}
                      </button>
                    </div>

                    {hasSemanticModel && (
                      <div className={`detail-file-row ${!canAccessModel ? "is-restricted" : ""}`}>
                        <div className="detail-file-icon semantic">
                          <span className="detail-file-icon-code">{modelFileType}</span>
                        </div>
                        <div className="detail-file-main">
                          <div className="detail-file-title" translate="no">{modelFileName}</div>
                          <div className="detail-file-meta">{modelPresentation.content}</div>
                          <div className="detail-file-meta">
                            <span>Format:</span>{" "}<span translate={modelPresentation.format === "Not specified" ? undefined : "no"}>{modelPresentation.format}</span>
                          </div>
                        </div>
                        <button
                          className="detail-download-button"
                          onClick={triggerModelAction}
                          disabled={!canAccessModel}
                        >
                          {modelActionIsDownload ? "Download" : "Open"}
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              )}

              <section className="dataset-detail-section dataset-detail-card">
                <h3>Categories</h3>
                <div className="detail-predicate-label">dcat:theme</div>
                {themeValues.length > 0 ? (
                  <div className="detail-theme-list">
                    {themeValues.map((themeValue) => (
                      <span className="detail-theme-chip" translate="no" key={themeValue}>
                        {formatTheme(themeValue)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </section>

              <section className="dataset-detail-section dataset-detail-card">
                <table className="detail-metadata-table">
                  <tbody>
                    {detailRows.map((row) => (
                      <tr key={row.predicate}>
                        <th scope="row">{presentation === "inline" ? metadataLabels[row.predicate] || row.predicate : row.predicate}</th>
                        <td translate={row.isUiCopy ? undefined : "no"}>{renderDetailValue(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {isSeries && (
                <section className="dataset-detail-section dataset-detail-card">
                  <h3>dcat:seriesMember</h3>
                  {(dataset.seriesMembers || []).length === 0 ? (
                    <span className="text-muted">No members listed.</span>
                  ) : (
                    <div className="detail-series-list">
                      {dataset.seriesMembers.map((url) => {
                        const resolved = resolveSeriesMember(url);
                        const info = datasetLookup.get(url);
                        return (
                          <div key={url} className="detail-series-row">
                            <div>
                              <div className="detail-series-title" translate="no">{resolved.title}</div>
                              {info?.description && (
                                <div className="detail-series-description" translate="no">{info.description}</div>
                              )}
                            </div>
                            <a href={resolved.url} target="_blank" rel="noopener noreferrer">
                              Open dataset
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              )}

              {!isSeries && canAccessModel && triples.length > 0 && (
                <section className="dataset-detail-section dataset-detail-card dataset-detail-visualization">
                  <details open={showVisualization} onToggle={(event) => setShowVisualization(event.currentTarget.open)}>
                  <summary>Semantic Model Visualization</summary>
                  <div className="detail-graph-wide">
                    {showVisualization && <RDFGraph triples={triples} />}
                  </div>
                  </details>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
      {showRequestModal && !isSeries && (
        <RequestDatasetModal
          dataset={dataset}
          sessionWebId={sessionWebId}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setShowRequestModal(false)}
          onSuccess={(result) => {
            setRequestState(result || { status: "unknown" });
            setShowRequestSuccess(true);
          }}
        />
      )}
      {showRequestSuccess && !isSeries && (
        <RequestSuccessModal onClose={() => setShowRequestSuccess(false)} />
      )}
    </div>
  );
};

export default DatasetDetailModal;
