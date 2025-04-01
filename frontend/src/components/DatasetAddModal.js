import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { getSolidDataset, getContainedResourceUrlAll } from "@inrupt/solid-client";

const DatasetAddModal = ({ onClose, fetchDatasets }) => {
  const [newDataset, setNewDataset] = useState({
    title: '',
    description: '',
    issued: '',
    modified: '',
    publisher_id: '',
    contact_point_id: '',
    access_url_dataset: '',
    access_url_semantic_model: '',
    file_format: '',
    theme: '',
    is_public: true
  });

  const [datasetPodFiles, setDatasetPodFiles] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [modelPodFiles, setModelPodFiles] = useState([]);
  const [agents, setAgents] = useState([]);
  const session = getDefaultSession();

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get("http://localhost:8000/agents");
        setAgents(response.data);
      } catch (err) {
        console.error("Failed to load agents:", err);
      }
    };

    const fetchCatalogs = async () => {
      try {
        const res = await axios.get("http://localhost:8000/catalogs");
        setCatalogs(res.data);
    
        if (res.data.length > 0) {
          setNewDataset(prev => ({
            ...prev,
            catalog_id: res.data[0].id
          }));newDataset.catalog_id
        }
      } catch (err) {
        console.error("Failed to load catalogs:", err);
      }
    };

    const loadPodFiles = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      try {
        const webId = session.info.webId;
        const podRoot = webId.split("/profile/")[0];
        const fileContainer = `${podRoot}/public/`;

        const dataset = await getSolidDataset(fileContainer, { fetch: session.fetch });
        const allFiles = getContainedResourceUrlAll(dataset);

        const datasetFiles = allFiles.filter(url => url.endsWith(".csv") || url.endsWith(".json"));
        const modelFiles = allFiles.filter(url => url.endsWith(".ttl"));

        setDatasetPodFiles(datasetFiles);
        setModelPodFiles(modelFiles);
      } catch (err) {
        console.error("Failed to load pod files:", err);
      }
    };

    fetchCatalogs();
    fetchAgents();
    loadPodFiles();
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
  
    let updatedFields = {
      [name]: type === 'checkbox' ? checked : value,
    };
  
    if (name === "access_url_dataset") {
      if (value.endsWith(".csv")) {
        updatedFields.file_format = "text/csv";
      } else if (value.endsWith(".json")) {
        updatedFields.file_format = "application/json";
      } else {
        updatedFields.file_format = "unknown"; 
      }
    }
  
    setNewDataset(prev => ({
      ...prev,
      ...updatedFields,
    }));
  };

  const handleSaveDataset = async () => {
    try {
      const formData = new FormData();
  
      Object.entries(newDataset).forEach(([key, value]) => {
        formData.append(key, value);
      });
  
      const res = await fetch("/assets/files/other.ttl");
      if (!res.ok) throw new Error("Failed to fetch default semantic model file.");
      
      const blob = await res.blob();
      const file = new File([blob], "other.ttl", { type: "text/turtle" });
  
      formData.append("semantic_model_file", file);
      formData.append("semantic_model_file_name", file.name);
  
      await axios.post("http://localhost:8000/datasets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
  
      fetchDatasets();
      onClose();
    } catch (error) {
      console.error("Error adding dataset:", error);
    }
  };

  return (
    <div className="modal" style={{ display: 'block' }}>
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Add New Dataset</h5>
          <button type="button" className="close" onClick={onClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <div className="modal-body">
          <form className="dataset-form-grid">
            {/* Left Column */}
            <div className="form-column">
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

              <label htmlFor="datasetAccessUrl">Dataset File (CSV/JSON):</label>
              <select id="datasetAccessUrl" name="access_url_dataset" value={newDataset.access_url_dataset} onChange={handleInputChange}>
                <option value="">Select File</option>
                {datasetPodFiles.map(url => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>

              <label htmlFor="datasetDownloadUrl">Semantic Model File (TTL):</label>
              <select id="datasetDownloadUrl" name="access_url_semantic_model" value={newDataset.access_url_semantic_model} onChange={handleInputChange}>
                <option value="">Select File</option>
                {modelPodFiles.map(url => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>

              <label htmlFor="theme">Theme:</label>
              <input type="text" id="theme" name="theme" value={newDataset.theme} onChange={handleInputChange} />

            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-success" onClick={handleSaveDataset}>
            Save Dataset
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetAddModal;
