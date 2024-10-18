import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DatasetEditModal = ({ dataset, onClose, fetchDatasets }) => {
  const [editedDataset, setEditedDataset] = useState(null);

  useEffect(() => {
    if (dataset) {
      setEditedDataset({
        name: dataset.name || '',
        description: dataset.description || '',
        owner_id: dataset.owner ? dataset.owner.id : '',
        contact_id: dataset.contact ? dataset.contact.id : '',
        is_public: dataset.is_public ? 'yes' : 'no',
        file_path: dataset.file_path || ''
      });
    }
  }, [dataset]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDataset(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSaveDataset = async () => {
    try {
      await axios.put(`http://localhost:8000/datasets/${dataset.id}`, editedDataset);
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
          <form id="datasetForm">
            <label htmlFor="datasetName">Dataset Name:</label>
            <input 
              type="text" 
              id="datasetName" 
              name="name" 
              value={editedDataset.name} 
              onChange={handleInputChange} 
            />

            <label htmlFor="datasetDescription">Description:</label>
            <textarea 
              id="datasetDescription" 
              name="description" 
              value={editedDataset.description} 
              onChange={handleInputChange} 
            />

            <label htmlFor="owner">Owner:</label>
            <select 
              id="owner" 
              name="owner_id" 
              value={editedDataset.owner_id} 
              onChange={handleInputChange}>
              <option value="1">Alice Example</option>
              <option value="2">Bob Example</option>
            </select>

            <label htmlFor="contact">Contact:</label>
            <select 
              id="contact" 
              name="contact_id" 
              value={editedDataset.contact_id} 
              onChange={handleInputChange}>
              <option value="1">Alice Example</option>
              <option value="2">Bob Example</option>
            </select>

            <label htmlFor="isPublic">Is Public:</label>
            <select 
              id="isPublic" 
              name="is_public" 
              value={editedDataset.is_public} 
              onChange={handleInputChange}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>

            <label htmlFor="filePath">File Path:</label>
            <input 
              type="text" 
              id="filePath" 
              name="file_path" 
              value={editedDataset.file_path} 
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

export default DatasetEditModal;
