import React, { useState } from 'react';

const DatasetRequestModal = ({ dataset, onClose }) => {
  const [requestMessage, setRequestMessage] = useState('');

  const handleRequestSubmit = () => {
    alert(`Request sent: ${requestMessage}`);
    onClose();
  };

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-custom-width" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Request Access to Dataset</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <p>
              Request access for <strong>{dataset.name}</strong> to <strong>{dataset.contact.email}</strong>.
            </p>
            <textarea
              className="form-control"
              rows="3"
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Enter your request message here"
            ></textarea>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-primary" onClick={handleRequestSubmit}>Send Request</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetRequestModal;
