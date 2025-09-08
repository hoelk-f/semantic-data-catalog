import React from 'react';

const RequestSuccessModal = ({ onClose }) => {
  return (
    <div className="modal fade show modal-show" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-paper-plane mr-2"></i> Request Sent
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body text-center">
            <i className="fa-solid fa-circle-check fa-4x text-success mb-3"></i>
            <p>Your access request email has been sent successfully.</p>
          </div>

          <div className="modal-footer justify-content-end">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestSuccessModal;

