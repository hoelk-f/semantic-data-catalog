import React from 'react';

const DatasetDetailModal = ({ dataset, onClose }) => {
  if (!dataset) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-custom-width" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Dataset Details</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <ul className="list-group">
              <li className="list-group-item">
                <strong>ID:</strong> {dataset.id}
              </li>
              <li className="list-group-item">
                <strong>Name:</strong> {dataset.name}
              </li>
              <li className="list-group-item">
                <strong>Description:</strong> {dataset.description}
              </li>
              <li className="list-group-item">
                <strong>Creation Date:</strong> {formatDate(dataset.creation_date)}
              </li>
              <li className="list-group-item">
                <strong>Last Modified Date:</strong> {formatDate(dataset.last_modified_date)}
              </li>
              <li className="list-group-item">
                <strong>Owner:</strong> {dataset.owner.name} ({dataset.owner.email})
              </li>
              <li className="list-group-item">
                <strong>Contact:</strong> {dataset.contact.name} ({dataset.contact.email})
              </li>
              <li className="list-group-item">
                <strong>Is Public:</strong> {dataset.is_public ? (
                  <i className="fa-solid fa-check"></i>
                ) : (
                  <i className="fa-solid fa-xmark"></i>
                )}
              </li>
              <li className="list-group-item">
                <strong>File Path:</strong> {dataset.file_path}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDetailModal;
