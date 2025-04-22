import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThing,
  getStringNoLocale,
  getUrl,
  getUrlAll
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";

const DatasetAddModal = ({ onClose, fetchDatasets, fetchTotalPages }) => {
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
    is_public: true,
    catalog_id: null
  });

  const [datasetPodFiles, setDatasetPodFiles] = useState([]);
  const [modelPodFiles, setModelPodFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const session = getDefaultSession();
  const [solidUserName, setSolidUserName] = useState('');
  const [webId, setWebId] = useState('');

  useEffect(() => {
    const fetchCatalogId = async () => {
      try {
        const res = await axios.get("http://localhost:8000/catalogs");
        if (res.data.length > 0) {
          const catalog = res.data[0];
          setNewDataset(prev => ({ ...prev, catalog_id: catalog.id }));
        }
      } catch (error) {
        console.error("Error fetching catalog ID:", error);
      }
    };

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

      try {
        const podRoot = session.info.webId.split("/profile/")[0];
        const fileContainer = `${podRoot}/public/`;

        const dataset = await getSolidDataset(fileContainer, { fetch: session.fetch });
        const allFiles = getContainedResourceUrlAll(dataset);

        setDatasetPodFiles(allFiles.filter(f => f.endsWith(".csv") || f.endsWith(".json")));
        setModelPodFiles(allFiles.filter(f => f.endsWith(".ttl")));
      } catch (err) {
        console.error("Error loading pod files:", err);
      }
    };

    fetchCatalogId();
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

      const formData = new FormData();
      Object.entries(newDataset).forEach(([key, value]) => formData.append(key, value));
      formData.append("webid", webId);

      await axios.post("http://localhost:8000/datasets", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const pages = await fetchTotalPages();
      await fetchDatasets(pages);
      onClose();
    } catch (err) {
      console.error("Error saving dataset:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderInputWithIcon = (label, name, type = 'text', icon = 'fa-circle', disabled = false) => (
    <div className="form-group position-relative mb-3">
      <i className={`fa-solid ${icon}`} style={{
        position: 'absolute',
        left: '10px',
        top: type === 'textarea' ? '12px' : (type === 'date' ? '10px' : '50%'),
        transform: type === 'textarea' || type === 'date' ? 'none' : 'translateY(-50%)',
        color: '#aaa',
        zIndex: 2,
      }}></i>
      {type === 'textarea' ? (
        <textarea
          className="form-control"
          name={name}
          value={newDataset[name]}
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
          value={newDataset[name]}
          onChange={handleInputChange}
          placeholder={label}
          disabled={disabled}
          style={{ paddingLeft: '30px' }}
        />
      )}
    </div>
  );

  const renderSelectWithIcon = (label, name, options, icon) => (
    <div className="form-group position-relative mb-3">
      <i className={`fa-solid ${icon}`} style={{
        position: 'absolute',
        left: '10px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: '#aaa',
        zIndex: 2,
      }}></i>
      <select
        className="form-control"
        name={name}
        value={newDataset[name]}
        onChange={handleInputChange}
        style={{ paddingLeft: '30px' }}
      >
        <option value="">{label}</option>
        {options.map(url => <option key={url} value={url}>{url}</option>)}
      </select>
    </div>
  );

  const renderFileCards = (label, name, files, icon) => (
    <div className="mb-3">
      <label className="font-weight-bold mb-2">{label}</label>
      <div className="d-flex flex-wrap" style={{ gap: '12px' }}>
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
              className={`card p-2 shadow-sm ${isSelected ? 'border-primary' : ''}`}
              style={{
                cursor: 'pointer',
                minWidth: '180px',
                maxWidth: '200px',
                borderWidth: isSelected ? '2px' : '1px',
                transition: 'border-color 0.2s',
              }}
            >
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
    <div className="modal show" style={{ display: 'block' }}>
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
              <label htmlFor="issued" style={{ marginBottom: '1px', fontWeight: 500 }}>Issued Date</label>
              {renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus")}

              <label htmlFor="modified" style={{ marginBottom: '1px', fontWeight: 500 }}>Modified Date</label>
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
              {renderFileCards("Select Semantic Model File (TTL)", "access_url_semantic_model", modelPodFiles, "fa-project-diagram")}
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
