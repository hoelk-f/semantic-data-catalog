import React, { useState } from 'react';
import axios from 'axios';

const RequestDatasetModal = ({ dataset, sessionWebId, onClose }) => {
  const [message, setMessage] = useState('');

  const handleRequest = async () => {
    try {
      await axios.post(`/api/datasets/${dataset.identifier}/request-access`, {
        webid: sessionWebId,
        ...(message ? { message } : {})
      });
      alert('Access request sent successfully.');
      onClose();
    } catch (error) {
      console.error('Error requesting dataset access:', error);
    }
  };

  return (
    <div className="modal fade show modal-show" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-envelope-open-text mr-2"></i> Request Dataset Access
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <p className="mb-3">You can provide an optional message to the dataset owner:</p>
            <textarea
              className="form-control"
              placeholder="Optional message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="modal-footer justify-content-end">
            <button type="button" className="btn btn-primary" onClick={handleRequest}>
              Request Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDatasetModal;
