import React from 'react';
import { deleteDatasetEntry, deleteSeriesEntry } from "../solidCatalog";
import { session } from "../solidSession";

const DatasetDeleteModal = ({ onClose, dataset, fetchDatasets }) => {
  const handleDelete = async () => {
    try {
      if (!dataset) return;
      if (dataset.datasetType === "series") {
        await deleteSeriesEntry(session, dataset.datasetUrl, dataset.identifier);
      } else {
        await deleteDatasetEntry(session, dataset.datasetUrl, dataset.identifier);
      }
      await fetchDatasets();
      onClose();
    } catch (error) {
      console.error("Error deleting dataset:", error);
    }
  };

  return (
    <div className="modal fade show modal-show" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-trash mr-2"></i> Delete {dataset?.datasetType === "series" ? "Series" : "Dataset"}
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body text-center">
            <i className="fa-solid fa-triangle-exclamation fa-8x text-danger mb-4"></i>
            <p className="lead">
              Are you sure you want to delete this {dataset?.datasetType === "series" ? "series" : "dataset"}?
            </p>
          </div>

          <div className="modal-footer justify-content-end">
            <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetDeleteModal;
