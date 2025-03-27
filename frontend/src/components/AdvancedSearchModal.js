import React from 'react';

const AdvancedSearchModal = ({ onClose }) => {
  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Semantic Search</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <div className="form-group">
              <textarea
                id="sparqlQuery"
                className="form-control"
                rows="12"
                placeholder="Enter your SPARQL query here..."
              ></textarea>
            </div>
          </div>

          <div className="text-right px-4">
            <button className="btn btn-primary">Send Query</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
