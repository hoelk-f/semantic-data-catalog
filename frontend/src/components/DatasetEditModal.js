import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { session } from "../solidSession";
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThing,
  getStringNoLocale,
  getUrl,
  getUrlAll
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";

const DatasetEditModal = ({ dataset, onClose, fetchDatasets }) => {
  // Shared Solid session instance

  const [editedDataset, setEditedDataset] = useState(null);
  const [datasetPodFiles, setDatasetPodFiles] = useState([]);
  const [modelPodFiles, setModelPodFiles] = useState([]);
  const [solidUserName, setSolidUserName] = useState('');
  const [webId, setWebId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dataset) return;

    setEditedDataset({
      ...dataset,
      issued: dataset.issued?.split('T')[0] || '',
      modified: dataset.modified?.split('T')[0] || '',
    });
  }, [dataset]);

  useEffect(() => {
    const loadProfileAndFiles = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      try {
        const profile = getThing(await getSolidDataset(session.info.webId, { fetch: session.fetch }), session.info.webId);
        const name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || 'Solid Pod User';
        const emailNode = getUrlAll(profile, VCARD.hasEmail)[0];
        let email = '';
        if (emailNode) {
          const emailThing = getThing(await getSolidDataset(session.info.webId, { fetch: session.fetch }), emailNode);
          email = getUrl(emailThing, VCARD.value)?.replace('mailto:', '') || '';
        }

        setSolidUserName(name);
        setWebId(session.info.webId);
        setEditedDataset(prev => ({
          ...prev,
          publisher: name,
          contact_point: email,
          webid: session.info.webId
        }));

        const podRoot = session.info.webId.split("/profile/")[0];
        const rootContainer = podRoot.endsWith('/') ? podRoot : `${podRoot}/`;
        const datasetFiles = [];
        const modelFiles = [];

        const traverse = async (containerUrl) => {
          try {
            const dataset = await getSolidDataset(containerUrl, { fetch: session.fetch });
            const resources = getContainedResourceUrlAll(dataset);
            for (const res of resources) {
              if (res.endsWith('/')) {
                await traverse(res);
              } else if (res.endsWith('.csv') || res.endsWith('.json')) {
                datasetFiles.push(res);
              } else if (res.endsWith('.ttl')) {
                modelFiles.push(res);
              }
            }
          } catch (err) {
            console.error(`Failed to load container ${containerUrl}`, err);
          }
        };

        await traverse(rootContainer);
        setDatasetPodFiles(datasetFiles);
        setModelPodFiles(modelFiles);
      } catch (err) {
        console.error("Failed to load pod data", err);
      }
    };

    loadProfileAndFiles();
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedDataset(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'access_url_dataset' ? {
        file_format: value.endsWith('.csv') ? 'text/csv' :
                     value.endsWith('.json') ? 'application/json' : 'unknown'
      } : {})
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
  
      const formData = new FormData();
  
      if (editedDataset.access_url_semantic_model) {
        const response = await fetch(editedDataset.access_url_semantic_model);
        const blob = await response.blob();
        const filename = editedDataset.access_url_semantic_model.split('/').pop() || "model.ttl";
        const file = new File([blob], filename, { type: "text/turtle" });
        formData.append("semantic_model_file", file);
      }
  
      Object.entries(editedDataset).forEach(([key, val]) => {
        if (val !== null && val !== undefined && key !== "semantic_model_file") {
          formData.append(key, val);
        }
      });
  
      formData.append("catalog_id", "1");
  
      await axios.put(`/api/datasets/${editedDataset.identifier}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
  
      await fetchDatasets();
      onClose();
    } catch (err) {
      console.error("Error updating dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label, name, type = 'text', icon = 'fa-circle', disabled = false) => (
    <div className="form-group position-relative mb-3">
      <i className={`fa-solid ${icon} input-icon ${
        type === 'textarea' ? 'input-icon-textarea' :
        type === 'date' ? 'input-icon-date' : 'input-icon-text'
      }`} />
      {type === 'textarea' ? (
        <textarea
          className="form-control"
          name={name}
          value={editedDataset[name]}
          onChange={handleInputChange}
          placeholder={label}
          rows={2}
          disabled={disabled}
          style={{ paddingLeft: '30px' }}
        />
      ) : (
        <input
          className="form-control"
          type={type}
          name={name}
          value={editedDataset[name]}
          onChange={handleInputChange}
          placeholder={label}
          disabled={disabled}
          style={{ paddingLeft: '30px' }}
        />
      )}
    </div>
  );

  const renderFileCards = (label, name, files, icon) => (
    <div className="mb-3">
      <label className="font-weight-bold mb-2">{label}</label>
      <div className="d-flex flex-wrap file-card-container">
        {files.map((fileUrl) => {
          const fileName = fileUrl.split('/').pop();
          const isSelected = editedDataset[name] === fileUrl;
  
          return (
            <div
              key={fileUrl}
              onClick={() =>
                setEditedDataset(prev => ({
                  ...prev,
                  [name]: fileUrl,
                  ...(name === 'access_url_dataset' ? {
                    file_format: fileUrl.endsWith('.csv') ? 'text/csv' :
                                 fileUrl.endsWith('.json') ? 'application/json' : 'unknown'
                  } : {})
                }))
              }
                className={`card p-2 shadow-sm file-card ${isSelected ? 'file-card-selected border-primary' : ''}`}>
              <div className="d-flex align-items-center">
                <i className={`fa-solid ${icon} fa-lg text-secondary mr-2`}></i>
                <span className="text-truncate" title={fileName}>{fileName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (!editedDataset) return null;

  return (
    <div className="modal show modal-show">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Dataset
            </h5>
            <button type="button" className="close" onClick={onClose}><span>&times;</span></button>
          </div>

          <div className="modal-body">
            {loading && (
              <div className="text-center mb-3">
                <i className="fa-solid fa-spinner fa-spin"></i> Saving changes...
              </div>
            )}

            <div className="mb-4">
              <h6 className="text-muted">General Information</h6>
              {renderInput("Title", "title", "text", "fa-heading")}
              {renderInput("Description", "description", "textarea", "fa-align-left")}
              {renderInput("Theme", "theme", "text", "fa-tags")}
              <label htmlFor="issued" className="font-weight-bold">Issued Date</label>
              {renderInput("Issued Date", "issued", "date", "fa-calendar-plus")}
              <label htmlFor="modified" className="font-weight-bold">Modified Date</label>
              {renderInput("Modified Date", "modified", "date", "fa-calendar-check")}
            </div>

            <div className="mb-4">
              <h6 className="text-muted">Solid Pod Information</h6>
              {renderInput("Publisher", "publisher", "text", "fa-user", true)}
              {renderInput("Contact", "contact_point", "text", "fa-envelope", true)}
              {renderInput("WebID", "webid", "text", "fa-link", true)}
            </div>

            <div>
              <h6 className="text-muted">Files from Solid Pod</h6>
              {renderFileCards("Select Dataset File (CSV/JSON)", "access_url_dataset", datasetPodFiles, "fa-file-csv")}
              {renderFileCards("Select Semantic Model File (TTL)", "access_url_semantic_model", modelPodFiles, "fa-project-diagram")}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-success" onClick={handleSave}>
              <i className="fa-solid fa-floppy-disk mr-2"></i>Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetEditModal;
