import React, { useState } from 'react';
import axios from 'axios';

const DatasetAddModal = ({ onClose, fetchDatasets }) => {
  const [newDataset, setNewDataset] = useState({
    identifier: '',
    title: '',
    description: '',
    issued: '',
    modified: '',
    publisher_id: '',
    contact_point_id: '',
    access_url: '',
    download_url: '',
    file_format: '',
    theme: '',
    is_public: false,
    semantic_model_file: null
  });

  const agents = [
    { id: 1, name: "Florian Hölken" },
    { id: 2, name: "André Pomp" },
    { id: 3, name: "Alexander Paulus" },
    { id: 4, name: "Ali Bahja" },
    { id: 5, name: "Andreas Burgdorf" },
    { id: 6, name: "Jakob Deich" },
    { id: 7, name: "Lara Baumanns" },
    { id: 8, name: "Miguel Gomes" },
    { id: 9, name: "Andre Bröcker" },
    { id: 10, name: "Sebastian Chmielewski" }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDataset(prevState => ({
      ...prevState,
      [name]: name === 'is_public' ? e.target.checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setNewDataset(prevState => ({
      ...prevState,
      semantic_model_file: file
    }));
  };

  const handleSaveDataset = async () => {
    try {
      const formData = new FormData();
  
      Object.keys(newDataset).forEach((key) => {
        if (key === "semantic_model_file" && newDataset[key]) {
          formData.append(key, newDataset[key]);
        } else {
          formData.append(key, newDataset[key]);
        }
      });

      formData.append("catalog_id", "1");

      await axios.post("http://localhost:8000/datasets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      window.location.reload();
    } catch (error) {
      console.error("Error adding dataset:", error);
    }
  };

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Add New Dataset</h5>
          <button type="button" className="close" onClick={onClose} aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <form id="datasetForm" className="dataset-form-grid">
            {/* Left Column */}
            <div className="form-column">
              <label htmlFor="datasetIdentifier">Identifier:</label>
              <input type="text" id="datasetIdentifier" name="identifier" value={newDataset.identifier} onChange={handleInputChange} />

              <label htmlFor="datasetTitle">Title:</label>
              <input type="text" id="datasetTitle" name="title" value={newDataset.title} onChange={handleInputChange} />

              <label htmlFor="datasetDescription">Description:</label>
              <input id="datasetDescription" name="description" value={newDataset.description} onChange={handleInputChange} />

              <label htmlFor="datasetIssued">Issued Date:</label>
              <input type="date" id="datasetIssued" name="issued" value={newDataset.issued} onChange={handleInputChange} />

              <label htmlFor="datasetModified">Modified Date:</label>
              <input type="date" id="datasetModified" name="modified" value={newDataset.modified} onChange={handleInputChange} />

              <label htmlFor="publisherId">Publisher:</label>
              <select id="publisherId" name="publisher_id" value={newDataset.publisher_id} onChange={handleInputChange}>
                <option value="">Select Publisher</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <label htmlFor="contactPointId">Contact:</label>
              <select id="contactPointId" name="contact_point_id" value={newDataset.contact_point_id} onChange={handleInputChange}>
                <option value="">Select Contact</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>

              <label htmlFor="datasetAccessUrl">Access URL:</label>
              <input type="url" id="datasetAccessUrl" name="access_url" value={newDataset.access_url} onChange={handleInputChange} />

              <label htmlFor="datasetDownloadUrl">Download URL:</label>
              <input type="url" id="datasetDownloadUrl" name="download_url" value={newDataset.download_url} onChange={handleInputChange} />

              <label htmlFor="fileFormat">File Format:</label>
              <input type="text" id="fileFormat" name="file_format" value={newDataset.file_format} onChange={handleInputChange} />

              <label htmlFor="theme">Theme:</label>
              <input type="text" id="theme" name="theme" value={newDataset.theme} onChange={handleInputChange} />

              <label htmlFor="isPublic">Is Public:</label>
              <input type="checkbox" id="isPublic" name="is_public" checked={newDataset.is_public} onChange={handleInputChange} />

              <label htmlFor="semanticModelFile">Semantic Model:</label>
              <input type="file" id="semanticModelFile" name="semantic_model_file" onChange={handleFileChange} />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" id="saveDatasetButton" className="modal-button btn btn-success" onClick={handleSaveDataset}>
            Save Dataset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetAddModal;
