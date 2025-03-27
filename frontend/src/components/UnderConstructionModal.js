import React from 'react';

const UnderConstructionModal = ({ onClose }) => {
  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
        <div className="modal-header">
            <h5 className="modal-title">Under Construction</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>

        <div className="modal-body text-center">
            <i className="fa-solid fa-helmet-safety fa-8x mb-4"></i>
            <p className="lead">This feature is under construction</p>
        </div>

        </div>
      </div>
    </div>
  );
};

export default UnderConstructionModal;
