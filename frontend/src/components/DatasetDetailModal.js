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

const DatasetDetailModal = ({ dataset, onClose }) => {
  const [triples, setTriples] = useState([]);
  const [showRequestModal, setShowRequestModal] = useState(false);

  if (!dataset) return null;

  useEffect(() => {
    if (!dataset.semantic_model_file) return;

    const parser = new Parser();
    const quads = [];

    parser.parse(dataset.semantic_model_file, (error, quad) => {
      if (error) return;
      if (quad) {
        quads.push(quad);
      } else {
        const fullURIs = quads.map((quad) => ({
          subject: quad.subject.value,
          predicate: quad.predicate.value,
          object: quad.object.value,
        }));

        setTriples(fullURIs);
      }
    });
  }, [dataset]);

  return (
    <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-custom-width" role="document">
        <div className="modal-content">
          <div className="modal-header d-flex align-items-center justify-content-between">
            <h5 className="modal-title">Dataset Details</h5>
            <div className="d-flex align-items-center">
              {!dataset.is_public && (
                <button className="btn btn-primary mr-2" onClick={() => setShowRequestModal(true)}>
                  Request Dataset
                </button>
              )}
              <button type="button" className="close" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>

          <div className="modal-body d-flex">
            {/* Dataset Details */}
            <div style={{ width: '60%' }}>
              <ul className="list-group">
                <li className="list-group-item"><strong>ID:</strong> {dataset.id}</li>
                <li className="list-group-item"><strong>Title:</strong> {dataset.title}</li>
                <li className="list-group-item"><strong>Description:</strong> {dataset.description}</li>
                <li className="list-group-item"><strong>Identifier:</strong> {dataset.identifier}</li>
                <li className="list-group-item"><strong>Issued Date:</strong> {formatDate(dataset.issued)}</li>
                <li className="list-group-item"><strong>Modified Date:</strong> {formatDate(dataset.modified)}</li>
                <li className="list-group-item"><strong>Publisher:</strong> {dataset.publisher.name}</li>
                <li className="list-group-item"><strong>Contact:</strong> {dataset.contact_point.name}</li>
                <li className="list-group-item"><strong>Access URL:</strong> <a href={dataset.access_url} target="_blank" rel="noopener noreferrer">{dataset.access_url}</a></li>
                <li className="list-group-item"><strong>Download URL:</strong> <a href={dataset.download_url} target="_blank" rel="noopener noreferrer">{dataset.download_url}</a></li>
                <li className="list-group-item"><strong>Theme:</strong> {dataset.theme}</li>
                <li className="list-group-item">
                  <strong>Is Public:</strong> {dataset.is_public ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <i className="fa-solid fa-xmark"></i>
                  )}
                </li>
              </ul>
            </div>

            {/* RDF Graph */}
            <div style={{ width: '40%' }} className="d-flex align-items-center justify-content-center">
              {triples.length > 0 ? <RDFGraph triples={triples} /> : <p>Keine RDF-Triples gefunden.</p>}
            </div>
          </div>

          <div className="modal-footer custom-footer">
            <h5 className="mb-2">Similar Datasets</h5>
            <p className="text-muted mb-0">No similar datasets found.</p>
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
