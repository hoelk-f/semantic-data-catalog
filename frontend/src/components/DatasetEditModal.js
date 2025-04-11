import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { getSolidDataset, getContainedResourceUrlAll } from "@inrupt/solid-client";
import { getThing, getStringNoLocale, getUrl, getUrlAll } from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";

const DatasetEditModal = ({ dataset, onClose, fetchDatasets }) => {
  const session = getDefaultSession();
  const [webId, setWebId] = useState('');
  const [solidUserName, setSolidUserName] = useState('');
  const [datasetPodFiles, setDatasetPodFiles] = useState([]);
  const [modelPodFiles, setModelPodFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editedDataset, setEditedDataset] = useState(null);

  useEffect(() => {
    if (!dataset) return;

    setEditedDataset({
      identifier: dataset.identifier || '',
      title: dataset.title || '',
      description: dataset.description || '',
      issued: dataset.issued ? dataset.issued.split('T')[0] : '',
      modified: dataset.modified ? dataset.modified.split('T')[0] : '',
      publisher: dataset.publisher || '',
      contact_point: dataset.contact_point || '',
      access_url_dataset: dataset.access_url_dataset || '',
      access_url_semantic_model: dataset.access_url_semantic_model || '',
      file_format: dataset.file_format || '',
      theme: dataset.theme || '',
      is_public: dataset.is_public || false,
      semantic_model_file: null
    });
  }, [dataset]);

  useEffect(() => {
    const fetchSolidProfile = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      try {
        const profileDataset = await getSolidDataset(session.info.webId, { fetch: session.fetch });
        const profile = getThing(profileDataset, session.info.webId);

        const name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || "Solid Pod User";

        const emailNodes = getUrlAll(profile, VCARD.hasEmail);
        let email = "";

        if (emailNodes && emailNodes.length > 0) {
          const emailNode = emailNodes[0];
          const emailThing = getThing(profileDataset, emailNode);
          if (emailThing) {
            const mailtoUri = getUrl(emailThing, VCARD.value);
            if (mailtoUri && mailtoUri.startsWith("mailto:")) {
              email = mailtoUri.replace("mailto:", "");
            }
          }
        }

        setSolidUserName(name);
        setWebId(session.info.webId);
      } catch (err) {
        console.error("Failed to read pod owner profile:", err);
      }
    };

    const loadPodFiles = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      try {
        const podRoot = session.info.webId.split("/profile/")[0];
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

    fetchSolidProfile();
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

    setEditedDataset(prev => ({
      ...prev,
      ...updatedFields,
    }));
  };

  const handleSaveDataset = async () => {
    try {
      setLoading(true);

      const formData = new FormData();
      Object.entries(editedDataset).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, value);
        }
      });

      formData.append("catalog_id", "1");

      await axios.put(`http://localhost:8000/datasets/${editedDataset.identifier}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchDatasets();
      onClose();
    } catch (error) {
      console.error("Error updating dataset:", error);
    } finally {
      setLoading(false);
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
          {loading && (
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <i className="fas fa-spinner fa-spin"></i> Updating dataset...
            </div>
          )}
          <form className="dataset-form-grid">
            {/* Left Column */}
            <div className="form-column">
              <label htmlFor="datasetTitle">Title:</label>
              <input type="text" name="title" value={editedDataset.title} onChange={handleInputChange} />

              <label htmlFor="datasetDescription">Description:</label>
              <textarea name="description" value={editedDataset.description} onChange={handleInputChange} rows={2} style={{ resize: "vertical" }} />

              <label htmlFor="datasetIssued">Issued Date:</label>
              <input type="date" name="issued" value={editedDataset.issued} onChange={handleInputChange} />

              <label htmlFor="datasetModified">Modified Date:</label>
              <input type="date" name="modified" value={editedDataset.modified} onChange={handleInputChange} />

              <label htmlFor="theme">Theme:</label>
              <input type="text" name="theme" value={editedDataset.theme} onChange={handleInputChange} />
            </div>

            {/* Right Column */}
            <div className="form-column">
              <label htmlFor="publisher">Publisher:</label>
              <input type="text" name="publisher" value={solidUserName} disabled />

              <label htmlFor="contact_point">Contact:</label>
              <input type="text" name="contact_point" value={editedDataset.contact_point} disabled />

              <label htmlFor="webId">WebID:</label>
              <input type="text" name="webId" value={webId} disabled />

              <label htmlFor="access_url_dataset">Dataset File (CSV/JSON):</label>
              <select name="access_url_dataset" value={editedDataset.access_url_dataset} onChange={handleInputChange}>
                <option value="">Select File</option>
                {datasetPodFiles.map(url => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>

              <label htmlFor="access_url_semantic_model">Semantic Model File (TTL):</label>
              <select name="access_url_semantic_model" value={editedDataset.access_url_semantic_model} onChange={handleInputChange}>
                <option value="">Select File</option>
                {modelPodFiles.map(url => (
                  <option key={url} value={url}>{url}</option>
                ))}
              </select>

              <label htmlFor="is_public">Is Public:</label>
              <input type="checkbox" name="is_public" checked={editedDataset.is_public} onChange={handleInputChange} />
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-success" onClick={handleSaveDataset}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatasetEditModal;
