import React, { useState, useEffect } from 'react';
import { Parser } from 'n3';
import { session } from "../solidSession";
import RDFGraph from "./RDFGraph";
import RequestDatasetModal from "./RequestDatasetModal";
import RequestSuccessModal from "./RequestSuccessModal";
import SemanticModelModal from "./SemanticModelModal";
import { getFileWithAcl, getAgentAccess } from "@inrupt/solid-client";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

const handleFileDownload = async (url, fileName) => {
  try {
    const res = await session.fetch(url);
    if (!res.ok) throw new Error("Download failed.");
    const blob = await res.blob();

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    console.error("Download error:", err);
    alert("Failed to download file.");
  }
};

const getPendingRequestKey = (dataset, sessionWebId) => {
  if (!dataset || !sessionWebId) return null;
  const datasetKey =
    dataset.identifier ||
    dataset.datasetUrl ||
    dataset.access_url_dataset ||
    dataset.title;
  if (!datasetKey) return null;
  return `sdm.request.pending.${sessionWebId}.${datasetKey}`;
};

const isPendingFromDataset = (dataset) => {
  if (!dataset) return false;
  const raw =
    dataset.request_status ||
    dataset.requestStatus ||
    dataset.access_request_status ||
    dataset.accessRequestStatus ||
    dataset.requestState;
  if (!raw) return false;
  const status = String(raw).toLowerCase();
  return status === "pending" || status === "waiting" || status === "requested";
};

const DatasetDetailModal = ({ dataset, onClose, sessionWebId, userName, userEmail, datasets = [] }) => {
  const [triples, setTriples] = useState([]);
  const [canAccessDataset, setCanAccessDataset] = useState(false);
  const [canAccessModel, setCanAccessModel] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [showSemanticModal, setShowSemanticModal] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
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

  useEffect(() => {
    let cancelled = false;
    const loadTriples = async () => {
    if (isSeries || !dataset?.access_url_semantic_model || !canAccessModel) {
      setTriples([]);
      return;
    }

      try {
        const res = await session.fetch(dataset.access_url_semantic_model);
        if (!res.ok) {
          setTriples([]);
          return;
        }
        const turtle = await res.text();
        const parser = new Parser();
        const quads = [];
        parser.parse(turtle, (error, quad) => {
          if (error || cancelled) return;
          if (quad) {
            quads.push(quad);
          } else {
            const mapped = quads.map((q) => ({
              subject: q.subject.value,
              predicate: q.predicate.value,
              object: q.object.value,
              fullPredicate: q.predicate.value,
            }));
            setTriples(mapped);
          }
        });
      } catch (err) {
        console.error("Failed to load semantic model:", err);
        setTriples([]);
      }
    };

    loadTriples();
    return () => {
      cancelled = true;
    };
  }, [dataset, canAccessModel]);

  useEffect(() => {
    const checkAccess = async () => {
    if (!dataset) return;
    if (isSeries) {
      setCanAccessDataset(false);
      setCanAccessModel(false);
      return;
    }
    if (dataset.is_public || dataset.webid === sessionWebId) {
      setCanAccessDataset(true);
      setCanAccessModel(true);
      return;
    }
      if (!session.info.isLoggedIn || !sessionWebId) {
        setCanAccessDataset(false);
        setCanAccessModel(false);
        return;
      }

      const hasAclAccess = async (url) => {
        if (!url) return false;
        try {
          const file = await getFileWithAcl(url, { fetch: session.fetch });
          const access = getAgentAccess(file, sessionWebId);
          return access && Object.values(access).some(Boolean);
        } catch (err) {
          if (err.statusCode !== 403 && err.statusCode !== 401) {
            console.error("Failed to check ACL for", url, err);
          }
          // Fallback: resource may be readable while ACL is not.
          try {
            const res = await session.fetch(url, { method: "HEAD" });
            return res.ok;
          } catch (fetchErr) {
            return false;
          }
        }
      };

      const datasetAccess = await hasAclAccess(dataset.access_url_dataset);
      let modelAccess = datasetAccess;
      if (!modelAccess) {
        modelAccess = await hasAclAccess(dataset.access_url_semantic_model);
      }
      setCanAccessDataset(datasetAccess);
      setCanAccessModel(modelAccess);
    };

    checkAccess();
  }, [dataset, sessionWebId]);

  useEffect(() => {
    if (!dataset) {
      setRequestPending(false);
      return;
    }
    const pendingFromDataset = isPendingFromDataset(dataset);
    if (pendingFromDataset) {
      setRequestPending(true);
      return;
    }
    const storageKey = getPendingRequestKey(dataset, sessionWebId);
    if (storageKey && typeof window !== "undefined") {
      setRequestPending(window.localStorage.getItem(storageKey) === "pending");
      return;
    }
    setRequestPending(false);
  }, [dataset, sessionWebId]);

  if (!dataset) return null;
  const hasUserAccess = dataset.is_public || canAccessDataset || canAccessModel;
  const canRequestAccess = !isSeries && !dataset.is_public && !hasUserAccess && Boolean(dataset.webid);
  const requestButtonDisabled = canRequestAccess && requestPending;

  return (
    <>
      <div className="modal show modal-show dataset-detail-modal">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">
                <i className="fa-solid fa-circle-info mr-2"></i>{' '}
                {isSeries ? "Dataset Series Details" : "Dataset Details"}
              </h5>
              <div className="d-flex align-items-center">
                {canRequestAccess && (
                  <button
                    className="btn btn-light mr-2"
                    onClick={() => setShowRequestModal(true)}
                    disabled={requestButtonDisabled}
                    title={
                      requestButtonDisabled
                        ? "Request already sent. Waiting for the dataset owner."
                        : "Request access to this dataset"
                    }
                  >
                    {requestButtonDisabled ? "Request Pending" : "Request Dataset"}
                  </button>
                )}
                <button type="button" className="close" onClick={onClose}><span>&times;</span></button>
              </div>
            </div>

            <div className="modal-body d-flex">
              <div className="dataset-detail-left">
                <ul className="list-group">
                  <li className="list-group-item">
                    <i className="fa-solid fa-heading mr-2"></i><strong>Title:</strong> {dataset.title}
                  </li>
                  <li className="list-group-item">
                    <i className="fa-solid fa-align-left mr-2"></i><strong>Description:</strong> {dataset.description}
                  </li>
                  <li className="list-group-item">
                    <i className="fa-solid fa-tags mr-2"></i><strong>Theme:</strong> {formatTheme(dataset.theme)}
                  </li>
                  <li className="list-group-item">
                    <i className="fa-solid fa-calendar-plus mr-2"></i><strong>Issued Date:</strong> {formatDate(dataset.issued)}
                  </li>
                  <li className="list-group-item">
                    <i className="fa-solid fa-calendar-check mr-2"></i><strong>Modified Date:</strong> {formatDate(dataset.modified)}
                  </li>
                  <li className="list-group-item">
                    <i className="fa-solid fa-user mr-2"></i><strong>Publisher:</strong> {dataset.publisher}
                  </li>
                  <li className="list-group-item">
                    <i className="fa-solid fa-envelope mr-2"></i><strong>Contact:</strong>{' '}
                    {dataset.contact_point ? (
                      <a href={`mailto:${dataset.contact_point}`}>{dataset.contact_point}</a>
                    ) : (
                      <span className="text-muted">N/A</span>
                    )}
                  </li>

                  {isSeries ? (
                    <li className="list-group-item">
                      <i className="fa-solid fa-layer-group mr-2"></i><strong>Series Members:</strong>
                      <div className="mt-3">
                        {(dataset.seriesMembers || []).length === 0 ? (
                          <span className="text-muted">No members listed.</span>
                        ) : (
                          <div className="d-flex flex-column gap-3">
                            {dataset.seriesMembers.map((url) => {
                              const resolved = resolveSeriesMember(url);
                              const info = datasetLookup.get(url);
                              return (
                                <div key={url} className="card shadow-sm border-0 p-3">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <div className="font-weight-bold">{resolved.title}</div>
                                      {info?.description && (
                                        <div className="text-muted small mt-1">{info.description}</div>
                                      )}
                                    </div>
                                    <span className="badge badge-light">
                                      {info?.is_public ? "Public" : "Restricted"}
                                    </span>
                                  </div>
                                  <div className="small text-muted mt-2">
                                    {info?.publisher && (
                                      <div><strong>Publisher:</strong> {info.publisher}</div>
                                    )}
                                    {info?.issued && (
                                      <div><strong>Issued:</strong> {formatDate(info.issued)}</div>
                                    )}
                                    {info?.modified && (
                                      <div><strong>Modified:</strong> {formatDate(info.modified)}</div>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <a href={resolved.url} target="_blank" rel="noopener noreferrer">
                                      Open dataset
                                    </a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </li>
                  ) : (
                    <>
                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="fa-solid fa-file-csv mr-2"></i><strong>Access URL Dataset:</strong>{' '}
                          {canAccessDataset ? (
                            <a href={dataset.access_url_dataset} target="_blank" rel="noopener noreferrer">
                              {dataset.access_url_dataset.split('/').pop()}
                            </a>
                          ) : (
                            <span className="text-muted">Restricted</span>
                          )}
                        </div>
                        {canAccessDataset && (
                          <button
                            className="btn btn-link text-dark"
                            onClick={() =>
                              handleFileDownload(dataset.access_url_dataset, dataset.access_url_dataset.split('/').pop())
                            }
                            title="Download Dataset"
                          >
                            <i className="fa-solid fa-download"></i>
                          </button>
                        )}
                      </li>

                      <li className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i className="fa-solid fa-project-diagram mr-2"></i><strong>Access URL Semantic Model:</strong>{' '}
                          {canAccessModel ? (
                            <a href={dataset.access_url_semantic_model} target="_blank" rel="noopener noreferrer">
                              {dataset.access_url_semantic_model.split('/').pop()}
                            </a>
                          ) : (
                            <span className="text-muted">Restricted</span>
                          )}
                        </div>
                        {canAccessModel && (
                          <button
                            className="btn btn-link text-dark"
                            onClick={() =>
                              handleFileDownload(dataset.access_url_semantic_model, dataset.access_url_semantic_model.split('/').pop())
                            }
                            title="Download Semantic Model"
                          >
                            <i className="fa-solid fa-download"></i>
                          </button>
                        )}
                      </li>
                      <li className="list-group-item">
                        <i className="fa-solid fa-lock mr-2"></i><strong>Access Rights:</strong>{' '}
                        {dataset.is_public ? (
                          <span><i className="fa-solid fa-globe" title="Public"></i> Public</span>
                        ) : hasUserAccess ? (
                          <span><i className="fa-solid fa-lock-open text-success" title="Restricted (You have access)"></i> Restricted (You have access)</span>
                        ) : (
                          <span><i className="fa-solid fa-lock text-danger" title="Restricted"></i> Restricted</span>
                        )}
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div
                className="dataset-detail-right d-flex align-items-center justify-content-center ml-3"
                title="Double-click to enlarge"
              >
                {triples.length > 0 ? (
                  <RDFGraph triples={triples} onDoubleClick={() => setShowSemanticModal(true)} />
                ) : (
                  <p className="text-muted">
                    {isSeries ? "No semantic model for dataset series." : "No RDF triples found."}
                  </p>
                )}
              </div>
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
          onSuccess={() => {
            setRequestPending(true);
            setShowRequestSuccess(true);
          }}
        />
      )}
      {showRequestSuccess && !isSeries && (
        <RequestSuccessModal onClose={() => setShowRequestSuccess(false)} />
      )}
      {showSemanticModal && !isSeries && (
        <SemanticModelModal triples={triples} onClose={() => setShowSemanticModal(false)} />
      )}
    </>
  );
};

export default DatasetDetailModal;
