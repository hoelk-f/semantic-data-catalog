import React from 'react';
import axios from 'axios';

const DatasetDeleteModal = ({ onClose, datasetId, fetchDatasets }) => {

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:8000/datasets/${datasetId}`);
      fetchDatasets();
      onClose();
    } catch (error) {
      console.error("Error deleting dataset:", error);
    }
  };

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
            <p>Are you sure you want to delete this dataset?</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDeleteModal;