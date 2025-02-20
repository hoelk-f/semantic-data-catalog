import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DatasetEditModal = ({ dataset, onClose, fetchDatasets }) => {
  const [editedDataset, setEditedDataset] = useState(null);

  useEffect(() => {
    if (dataset) {
      setEditedDataset({
        identifier: dataset.identifier || '',
        title: dataset.title || '',
        description: dataset.description || '',
        issued: dataset.issued ? dataset.issued.split('T')[0] : '',
        modified: dataset.modified ? dataset.modified.split('T')[0] : '',
        publisher_id: dataset.publisher ? dataset.publisher.id : '',
        contact_point_id: dataset.contact_point ? dataset.contact_point.id : '',
        access_url: dataset.access_url || '',
        download_url: dataset.download_url || '',
        file_format: dataset.file_format || '',
        theme: dataset.theme || '',
        is_public: dataset.is_public || false,
        semantic_model_file: null
      });
    }
  }, [dataset]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDataset(prevState => ({
      ...prevState,
      [name]: name === 'is_public' ? e.target.checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setEditedDataset(prevState => ({
      ...prevState,
      semantic_model_file: file
    }));
  };

  const handleSaveDataset = async () => {
    try {
      const formData = new FormData();

      Object.keys(editedDataset).forEach((key) => {
        if (editedDataset[key] !== null && editedDataset[key] !== undefined) {
          formData.append(key, editedDataset[key]);
        }
      });

      formData.append("catalog_id", "1");

      await axios.put(`http://localhost:8000/datasets/${dataset.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchDatasets();
      onClose();
    } catch (error) {
      console.error("Error updating dataset:", error);
    }
  };

  if (!editedDataset) return null;

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Edit Dataset</h5>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <form id="datasetForm" className="dataset-form-grid">
            {/* Left Column */}
            <div className="form-column">
              <label htmlFor="datasetIdentifier">Identifier:</label>
              <input type="text" id="datasetIdentifier" name="identifier" value={editedDataset.identifier} onChange={handleInputChange} />

              <label htmlFor="datasetTitle">Title:</label>
              <input type="text" id="datasetTitle" name="title" value={editedDataset.title} onChange={handleInputChange} />

              <label htmlFor="datasetDescription">Description:</label>
              <textarea id="datasetDescription" name="description" value={editedDataset.description} onChange={handleInputChange} />

              <label htmlFor="datasetIssued">Issued Date:</label>
              <input type="date" id="datasetIssued" name="issued" value={editedDataset.issued} onChange={handleInputChange} />

              <label htmlFor="datasetModified">Modified Date:</label>
              <input type="date" id="datasetModified" name="modified" value={editedDataset.modified} onChange={handleInputChange} />

              <label htmlFor="publisherId">Publisher:</label>
              <select id="publisherId" name="publisher_id" value={editedDataset.publisher_id} onChange={handleInputChange}>
                <option value="">Select Publisher</option>
                {dataset.publisher && (
                  <option key={dataset.publisher.id} value={dataset.publisher.id}>
                    {dataset.publisher.name}
                  </option>
                )}
              </select>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <label htmlFor="contactPointId">Contact:</label>
              <select id="contactPointId" name="contact_point_id" value={editedDataset.contact_point_id} onChange={handleInputChange}>
                <option value="">Select Contact</option>
                {dataset.contact_point && (
                  <option key={dataset.contact_point.id} value={dataset.contact_point.id}>
                    {dataset.contact_point.name}
                  </option>
                )}
              </select>

              <label htmlFor="datasetAccessUrl">Access URL:</label>
              <input type="url" id="datasetAccessUrl" name="access_url" value={editedDataset.access_url} onChange={handleInputChange} />

              <label htmlFor="datasetDownloadUrl">Download URL:</label>
              <input type="url" id="datasetDownloadUrl" name="download_url" value={editedDataset.download_url} onChange={handleInputChange} />

              <label htmlFor="fileFormat">File Format:</label>
              <input type="text" id="fileFormat" name="file_format" value={editedDataset.file_format} onChange={handleInputChange} />

              <label htmlFor="theme">Theme:</label>
              <input type="text" id="theme" name="theme" value={editedDataset.theme} onChange={handleInputChange} />

              <label htmlFor="isPublic">Is Public:</label>
              <input type="checkbox" id="isPublic" name="is_public" checked={editedDataset.is_public} onChange={handleInputChange} />

              <label htmlFor="semanticModelFile">Semantic Model:</label>
              <input type="file" id="semanticModelFile" name="semantic_model_file" onChange={handleFileChange} />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" id="saveDatasetButton" className="modal-button btn btn-success" onClick={handleSaveDataset}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetEditModal;
