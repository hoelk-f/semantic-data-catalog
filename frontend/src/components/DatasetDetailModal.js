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

const DatasetDetailModal = ({ dataset, onClose, sessionWebId, userName, userEmail }) => {
  const [triples, setTriples] = useState([]);
  const [canAccessDataset, setCanAccessDataset] = useState(false);
  const [canAccessModel, setCanAccessModel] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);
  const [showSemanticModal, setShowSemanticModal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadTriples = async () => {
      if (!dataset?.access_url_semantic_model || !canAccessModel) {
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
            console.warn("Failed to check access for", url, fetchErr);
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

  if (!dataset) return null;
  const hasUserAccess = dataset.is_public || canAccessDataset || canAccessModel;
  const canRequestAccess = !dataset.is_public && !hasUserAccess && Boolean(dataset.webid);

  return (
    <>
      <div className="modal show modal-show">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">
                <i className="fa-solid fa-circle-info mr-2"></i> Dataset Details
              </h5>
              <div className="d-flex align-items-center">
                {canRequestAccess && (
                  <button
                    className="btn btn-light mr-2"
                    onClick={() => setShowRequestModal(true)}
                  >
                    Request Dataset
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
                    <i className="fa-solid fa-tags mr-2"></i><strong>Theme:</strong> {dataset.theme}
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
                    <a href={`mailto:${dataset.contact_point}`}>{dataset.contact_point}</a>
                  </li>

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
                </ul>
              </div>

              <div
                className="dataset-detail-right d-flex align-items-center justify-content-center ml-3"
                title="Double-click to enlarge"
              >
                {triples.length > 0 ? (
                  <RDFGraph triples={triples} onDoubleClick={() => setShowSemanticModal(true)} />
                ) : (
                  <p className="text-muted">No RDF triples found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showRequestModal && (
        <RequestDatasetModal
          dataset={dataset}
          sessionWebId={sessionWebId}
          userName={userName}
          userEmail={userEmail}
          onClose={() => setShowRequestModal(false)}
          onSuccess={() => setShowRequestSuccess(true)}
        />
      )}
      {showRequestSuccess && (
        <RequestSuccessModal onClose={() => setShowRequestSuccess(false)} />
      )}
      {showSemanticModal && (
        <SemanticModelModal triples={triples} onClose={() => setShowSemanticModal(false)} />
      )}
    </>
  );
};

export default DatasetDetailModal;
