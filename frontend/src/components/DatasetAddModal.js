import React, { useState, useEffect } from 'react';
import { session } from "../solidSession";
import { createDataset, ensureCatalogStructure } from "../solidCatalog";
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThing,
  getStringNoLocale,
  getUrl,
  getUrlAll
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";

const DatasetAddModal = ({ onClose, fetchDatasets }) => {
  const [newDataset, setNewDataset] = useState({
    title: '',
    description: '',
    issued: '',
    modified: '',
    publisher: '',
    contact_point: '',
    access_url_dataset: '',
    access_url_semantic_model: '',
    file_format: '',
    theme: '',
    is_public: true
  });

  const [datasetPodFiles, setDatasetPodFiles] = useState([]);
  const [modelPodFiles, setModelPodFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use shared Solid session from solidSession.js
  const [solidUserName, setSolidUserName] = useState('');
  const [webId, setWebId] = useState('');

  useEffect(() => {
    const fetchSolidProfile = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      try {
        const profileDataset = await getSolidDataset(session.info.webId, { fetch: session.fetch });
        const profile = getThing(profileDataset, session.info.webId);

        const name = getStringNoLocale(profile, FOAF.name) ||
                     getStringNoLocale(profile, VCARD.fn) || "Solid Pod User";

        const emailNodes = getUrlAll(profile, VCARD.hasEmail);
        let email = "";

        if (emailNodes.length > 0) {
          const emailThing = getThing(profileDataset, emailNodes[0]);
          const mailto = getUrl(emailThing, VCARD.value);
          if (mailto?.startsWith("mailto:")) {
            email = mailto.replace("mailto:", "");
          }
        }

        setNewDataset(prev => ({
          ...prev,
          publisher: name,
          contact_point: email
        }));
        setSolidUserName(name);
        setWebId(session.info.webId);
        setNewDataset(prev => ({
          ...prev,
          webid: session.info.webId
        }));
      } catch (err) {
        console.error("Failed to read pod profile:", err);
      }
    };

    const loadPodFiles = async () => {
      if (!session.info.webId) return;

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
          console.error(`Error loading container ${containerUrl}:`, err);
        }
      };

      try {
        const podRoot = session.info.webId.split("/profile/")[0];
        const rootContainer = podRoot.endsWith('/') ? podRoot : `${podRoot}/`;
        await traverse(rootContainer);
        setDatasetPodFiles(datasetFiles);
        setModelPodFiles(modelFiles);
      } catch (err) {
        console.error("Error loading pod files:", err);
      }
    };

    fetchSolidProfile();
    loadPodFiles();
  }, [session]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewDataset(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'access_url_dataset' ? {
        file_format: value.endsWith('.csv') ? 'text/csv' :
                     value.endsWith('.json') ? 'application/json' : 'unknown'
      } : {})
    }));
  };

  const handleSaveDataset = async () => {
    try {
      setLoading(true);
      await ensureCatalogStructure(session, {
        title: solidUserName ? `${solidUserName}'s Catalog` : undefined,
      });
      await createDataset(session, {
        ...newDataset,
        webid: webId,
      });

      await fetchDatasets();
      onClose();
    } catch (err) {
      console.error("Error saving dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderInputWithIcon = (label, name, type = 'text', icon = 'fa-circle', disabled = false) => (
    <div className="form-group position-relative mb-3">
      <i className={`fa-solid ${icon} input-icon ${
        type === 'textarea' ? 'input-icon-textarea' :
        type === 'date' ? 'input-icon-date' : 'input-icon-text'
      }`}></i>
      {type === 'textarea' ? (
        <textarea
          className="form-control"
          name={name}
          value={newDataset[name] || ''}
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
          value={newDataset[name] || ''}
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
          const isSelected = newDataset[name] === fileUrl;
  
          return (
            <div
              key={fileUrl}
              onClick={() =>
                setNewDataset(prev => ({
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

  return (
    <div className="modal show modal-show">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-plus mr-2"></i> Add Dataset
            </h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>

          <div className="modal-body">
            {loading && (
              <div className="text-center mb-3">
                <i className="fa-solid fa-spinner fa-spin"></i> Saving dataset...
              </div>
            )}

            <div className="mb-4">
              <h6 className="text-muted">General Information</h6>
              {renderInputWithIcon("Title", "title", "text", "fa-heading")}
              {renderInputWithIcon("Description", "description", "textarea", "fa-align-left")}
              {renderInputWithIcon("Theme", "theme", "text", "fa-tags")}
              <label className="form-label-compact">Access Rights</label>
              <div className="form-group position-relative mb-3">
                <i className="fa-solid fa-lock input-icon input-icon-text"></i>
                <select
                  className="form-control"
                  name="is_public"
                  value={newDataset.is_public ? 'public' : 'restricted'}
                  onChange={(e) =>
                    setNewDataset(prev => ({ ...prev, is_public: e.target.value === 'public' }))
                  }
                  style={{ paddingLeft: '30px' }}
                >
                  <option value="public">Public</option>
                  <option value="restricted">Restricted</option>
                </select>
              </div>
              <label htmlFor="issued" className="form-label-compact">Issued Date</label>
              {renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus")}

              <label htmlFor="modified" className="form-label-compact">Modified Date</label>
              {renderInputWithIcon("Modified Date", "modified", "date", "fa-calendar-check")}
            </div>

            <div className="mb-4">
              <h6 className="text-muted">Solid Pod Information</h6>
              {renderInputWithIcon("Publisher", "publisher", "text", "fa-user", true)}
              {renderInputWithIcon("Contact", "contact_point", "text", "fa-envelope", true)}
              {renderInputWithIcon("WebID", "webid", "text", "fa-link", true)}
            </div>

            <div>
              <h6 className="text-muted">Files from Solid Pod</h6>
              {renderFileCards("Select Dataset File (CSV/JSON)", "access_url_dataset", datasetPodFiles, "fa-file-csv")}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="font-weight-bold mb-0">Select Semantic Model File (TTL)</label>
                <a
                  href="http://plasma.uni-wuppertal.de/modelings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm"
                >
                  <i className="fa-solid fa-plus mr-1"></i> Create Semantic Model
                </a>
              </div>
              {renderFileCards("", "access_url_semantic_model", modelPodFiles, "fa-project-diagram")}
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-success" onClick={handleSaveDataset}>
              <i className="fa-solid fa-floppy-disk mr-2"></i>Save Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetAddModal;
