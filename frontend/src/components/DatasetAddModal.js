import React, { useState } from 'react';
import axios from 'axios';

const DatasetAddModal = ({ onClose, fetchDatasets }) => {
  const [newDataset, setNewDataset] = useState({
    title: '',
    description: '',
    identifier: '',
    issued: '',
    modified: '',
    publisher_id: '',
    contact_point_id: '',
    access_url: '',
    download_url: '',
    file_format: '',
    theme: '',
    is_public: false
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDataset(prevState => ({
      ...prevState,
      [name]: name === 'is_public' ? e.target.checked : value
    }));
  };

  const handleSaveDataset = async () => {
    try {
      await axios.post('http://localhost:8000/datasets', newDataset);
      fetchDatasets();
      onClose();
    } catch (error) {
      console.error("Error creating dataset:", error);
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
          <form id="datasetForm">
            <label htmlFor="datasetTitle">Title:</label>
            <input 
              type="text" 
              id="datasetTitle" 
              name="title" 
              value={newDataset.title} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetDescription">Description:</label>
            <textarea 
              id="datasetDescription" 
              name="description" 
              value={newDataset.description} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetIdentifier">Identifier:</label>
            <input 
              type="text" 
              id="datasetIdentifier" 
              name="identifier" 
              value={newDataset.identifier} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetIssued">Issued Date:</label>
            <input 
              type="date" 
              id="datasetIssued" 
              name="issued" 
              value={newDataset.issued} 
              onChange={handleInputChange} 
            />

            <label htmlFor="publisherId">Publisher:</label>
            <input 
              type="number" 
              id="publisherId" 
              name="publisher_id" 
              value={newDataset.publisher_id} 
              onChange={handleInputChange} 
            />

            <label htmlFor="contactPointId">Contact Point:</label>
            <input 
              type="number" 
              id="contactPointId" 
              name="contact_point_id" 
              value={newDataset.contact_point_id} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetAccessUrl">Access URL:</label>
            <input 
              type="url" 
              id="datasetAccessUrl" 
              name="access_url" 
              value={newDataset.access_url} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetDownloadUrl">Download URL:</label>
            <input 
              type="url" 
              id="datasetDownloadUrl" 
              name="download_url" 
              value={newDataset.download_url} 
              onChange={handleInputChange} 
            />

            <label htmlFor="fileFormat">File Format:</label>
            <input 
              type="text" 
              id="fileFormat" 
              name="file_format" 
              value={newDataset.file_format} 
              onChange={handleInputChange} 
            />

            <label htmlFor="theme">Theme:</label>
            <input 
              type="text" 
              id="theme" 
              name="theme" 
              value={newDataset.theme} 
              onChange={handleInputChange} 
            />

            <label htmlFor="isPublic">Is Public:</label>
            <input 
              type="checkbox" 
              id="isPublic" 
              name="is_public" 
              checked={newDataset.is_public} 
              onChange={handleInputChange} 
            />

            <button 
              type="button" 
              id="saveDatasetButton" 
              className="modal-button btn btn-success" 
              onClick={handleSaveDataset}>
              Save Dataset
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DatasetAddModal;
