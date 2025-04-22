import React, { useState, useEffect } from 'react';
import DatasetRequestModal from './DatasetRequestModal';
import { Parser } from 'n3';
import RDFGraph from "./RDFGraph";

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
    const res = await fetch(url);
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

const DatasetDetailModal = ({ dataset, onClose }) => {
  const [triples, setTriples] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    if (!dataset?.semantic_model_file) return;
    const parser = new Parser();
    const quads = [];

    parser.parse(dataset.semantic_model_file, (error, quad) => {
      if (error) return;
      if (quad) {
        quads.push(quad);
      } else {
        const mapped = quads.map(q => ({
          subject: q.subject.value,
          predicate: q.predicate.value,
          object: q.object.value,
          fullPredicate: q.predicate.value
        }));
        setTriples(mapped);
      }
    });
  }, [dataset]);

  if (!dataset) return null;

  return (
    <div className="modal show" style={{ display: 'block' }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h5 className="modal-title">
              <i className="fa-solid fa-circle-info mr-2"></i> Dataset Details
            </h5>
            <div className="d-flex align-items-center">
              {!dataset.is_public && (
                <button className="btn btn-primary mr-2" onClick={() => setShowRequestModal(true)}>
                  <i className="fa-solid fa-lock mr-1"></i> Request Access
                </button>
              )}
              <button type="button" className="close" onClick={onClose}><span>&times;</span></button>
            </div>
          </div>

          <div className="modal-body d-flex">
            {/* Left: dataset metadata */}
            <div style={{ width: '60%' }}>
              <ul className="list-group">
                <li className="list-group-item">
                  <i className="fa-solid fa-heading mr-2"></i><strong>Title:</strong> {dataset.title}
                </li>
                <li className="list-group-item">
                  <i className="fa-solid fa-align-left mr-2"></i><strong>Description:</strong> {dataset.description}
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
                    <a href={dataset.access_url_dataset} target="_blank" rel="noopener noreferrer">
                      {dataset.access_url_dataset.split('/').pop()}
                    </a>
                  </div>
                  <button
                    className="btn btn-link text-dark"
                    onClick={() =>
                      handleFileDownload(dataset.access_url_dataset, dataset.access_url_dataset.split('/').pop())
                    }
                    title="Download Dataset"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                </li>

                <li className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <i className="fa-solid fa-project-diagram mr-2"></i><strong>Access URL Semantic Model:</strong>{' '}
                    <a href={dataset.access_url_semantic_model} target="_blank" rel="noopener noreferrer">
                      {dataset.access_url_semantic_model.split('/').pop()}
                    </a>
                  </div>
                  <button
                    className="btn btn-link text-dark"
                    onClick={() =>
                      handleFileDownload(dataset.access_url_semantic_model, dataset.access_url_semantic_model.split('/').pop())
                    }
                    title="Download Semantic Model"
                  >
                    <i className="fa-solid fa-download"></i>
                  </button>
                </li>

                <li className="list-group-item">
                  <i className="fa-solid fa-tags mr-2"></i><strong>Theme:</strong> {dataset.theme}
                </li>
                <li className="list-group-item">
                  <i className="fa-solid fa-lock mr-2"></i><strong>Access Rights:</strong>{' '}
                  {dataset.is_public ? (
                    <span><i className="fa-solid fa-globe" title="Public"></i></span>
                  ) : (
                    <span><i className="fa-solid fa-xmark text-danger" title="Private"></i> Private</span>
                  )}
                </li>
              </ul>
            </div>

            {/* Right: RDF Graph */}
            <div style={{ width: '40%', maxHeight: '566px', overflowY: 'hidden', border: '1px solid #dee2e6', borderRadius: '6px'}} className="d-flex align-items-center justify-content-center ml-3">
              {triples.length > 0 ? <RDFGraph triples={triples} /> : <p className="text-muted">Keine RDF-Triples gefunden.</p>}
            </div>
          </div>

        </div>
      </div>

      {showRequestModal && (
        <DatasetRequestModal dataset={dataset} onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  );
};

export default DatasetDetailModal;
