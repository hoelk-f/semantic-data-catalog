import React from 'react';

const DatasetDeleteModal = ({ onClose }) => {
  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-custom-width" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Delete Dataset</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body text-center">
            <p>This feature is currently under development and is not available yet.</p>
            <i className="fa-solid fa-wrench wrench-icon"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDeleteModal;
