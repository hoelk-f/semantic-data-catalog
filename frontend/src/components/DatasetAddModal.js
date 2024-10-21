import React, { useState } from 'react';
import axios from 'axios';

const DatasetAddModal = ({ onClose, fetchDatasets }) => {
  const [newDataset, setNewDataset] = useState({
    name: '',
    description: '',
    owner_id: '',
    contact_id: '',
    is_public: '',
    // file_path: ''
  });
  
  const [file, setFile] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDataset(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSaveDataset = async () => {
    if (file) {
      console.log("Selected file:", file);
    }

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
            <label htmlFor="datasetName">Dataset Name:</label>
            <input 
              type="text" 
              id="datasetName" 
              name="name" 
              value={newDataset.name} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetDescription">Description:</label>
            <textarea 
              id="datasetDescription" 
              name="description" 
              value={newDataset.description} 
              onChange={handleInputChange} 
            />

            <label htmlFor="owner">Owner:</label>
            <select 
              id="owner" 
              name="owner_id" 
              value={newDataset.owner_id} 
              onChange={handleInputChange}>
              <option value="1">Alice Example</option>
              <option value="2">Bob Example</option>
            </select>

            <label htmlFor="contact">Contact:</label>
            <select 
              id="contact" 
              name="contact_id" 
              value={newDataset.contact_id} 
              onChange={handleInputChange}>
              <option value="1">Alice Example</option>
              <option value="2">Bob Example</option>
            </select>

            <label htmlFor="isPublic">Is Public:</label>
            <select 
              id="isPublic" 
              name="is_public" 
              value={newDataset.is_public} 
              onChange={handleInputChange}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>

            <label htmlFor="fileUpload">Upload File:</label>
            <input 
              type="file" 
              id="fileUpload" 
              name="file" 
              onChange={handleFileChange}
            />

            {/* 
            <label htmlFor="filePath">File Path:</label>
            <input 
              type="text" 
              id="filePath" 
              name="file_path" 
              value={newDataset.file_path} 
              onChange={handleInputChange} 
            />
            */}

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
