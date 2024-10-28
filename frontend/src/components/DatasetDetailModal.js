import React, { useState } from 'react';
import DatasetRequestModal from './DatasetRequestModal';

const DatasetDetailModal = ({ dataset, onClose }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);

  if (!dataset) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-custom-width" role="document">
        <div className="modal-content">
          <div className="modal-header d-flex align-items-center justify-content-between">
            <h5 className="modal-title">Dataset Details</h5>
            <div className="d-flex align-items-center">
              {!dataset.is_public && (
                <button
                  className="btn btn-primary mr-2"
                  onClick={() => setShowRequestModal(true)}
                >
                  Request Dataset
                </button>
              )}
              <button type="button" className="close" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>

          <div className="modal-body d-flex">
            <div style={{ width: '60%' }}>
              <ul className="list-group">
                <li className="list-group-item"><strong>ID:</strong> {dataset.id}</li>
                <li className="list-group-item"><strong>Name:</strong> {dataset.name}</li>
                <li className="list-group-item"><strong>Description:</strong> {dataset.description}</li>
                <li className="list-group-item"><strong>Creation Date:</strong> {formatDate(dataset.creation_date)}</li>
                <li className="list-group-item"><strong>Last Modified Date:</strong> {formatDate(dataset.last_modified_date)}</li>
                <li className="list-group-item"><strong>Owner:</strong> {dataset.owner.name}</li>
                <li className="list-group-item"><strong>Contact:</strong> {dataset.contact.name}</li>
                <li className="list-group-item">
                  <strong>Is Public:</strong> {dataset.is_public ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <i className="fa-solid fa-xmark"></i>
                  )}
                </li>
                <li className="list-group-item"><strong>File Path:</strong> {dataset.file_path}</li>
              </ul>
            </div>

            <div className="d-flex align-items-center justify-content-center" style={{ width: '40%' }}>
              <div className="text-center">
                <i className="fa-solid fa-diagram-project fa-5x" style={{ color: '#6c757d' }}></i>
                <p className="mt-2">Semantic Model Visualization Placeholder</p>
              </div>
            </div>
          </div>

          <div className="modal-footer custom-footer">
            <h5 className="mb-2">Similar Datasets</h5>
            <p className="text-muted mb-0">No similar datasets found.</p>
          </div>
        </div>
      </div>

      {showRequestModal && (
        <DatasetRequestModal
          dataset={dataset}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
};

export default DatasetDetailModal;
