import React from 'react';
import RDFGraph from './RDFGraph';

const SemanticModelModal = ({ triples, onClose }) => (
  <div className="modal fade show modal-show" tabIndex="-1" role="dialog">
    <div className="modal-dialog modal-xl" role="document">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            <i className="fa-solid fa-project-diagram mr-2"></i> Semantic Model
          </h5>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="modal-body">
          {triples.length > 0 ? (
            <RDFGraph triples={triples} />
          ) : (
            <p className="text-muted">No RDF triples found.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default SemanticModelModal;
