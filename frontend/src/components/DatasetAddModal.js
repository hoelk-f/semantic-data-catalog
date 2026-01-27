import React, { useState, useEffect } from 'react';
import { session } from "../solidSession";
import { createDataset, ensureCatalogStructure } from "../solidCatalog";
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getThing,
  getStringNoLocale,
  getUrl,
  getUrlAll,
  createContainerAt
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
  const [datasetSource, setDatasetSource] = useState("upload");
  const [modelSource, setModelSource] = useState("upload");
  const [datasetUpload, setDatasetUpload] = useState({ file: null, url: "", error: "" });
  const [modelUpload, setModelUpload] = useState({ file: null, url: "", error: "" });
  const hasRequiredFields = Boolean(newDataset.access_url_dataset && newDataset.file_format);
  const [showSemanticModel, setShowSemanticModel] = useState(false);

  // Use shared Solid session from solidSession.js
  const [solidUserName, setSolidUserName] = useState('');
  const [solidUserPhoto, setSolidUserPhoto] = useState('');
  const [webId, setWebId] = useState('');
  const [datasetUploadPath, setDatasetUploadPath] = useState("/public/");
  const [modelUploadPath, setModelUploadPath] = useState("/public/");
  const [datasetType, setDatasetType] = useState("dataset");

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

        const photoRef = getUrl(profile, VCARD.hasPhoto) || getUrl(profile, FOAF.img);
        let photoUrl = "";
        if (photoRef) {
          try {
            const res = await session.fetch(photoRef);
            if (res.ok) {
              const blob = await res.blob();
              photoUrl = URL.createObjectURL(blob);
            } else {
              photoUrl = photoRef;
            }
          } catch (err) {
            photoUrl = photoRef;
          }
        }
        setSolidUserPhoto(photoUrl);
      } catch (err) {
        console.error("Failed to read pod profile:", err);
      }
    };

    const loadPodFiles = async () => {
      if (!session.info.webId) return;

      const datasetFiles = [];
      const modelFiles = [];
      const isCatalogResource = (url) => url.includes("/catalog/");

      const traverse = async (containerUrl) => {
        try {
          if (isCatalogResource(containerUrl)) return;
          const dataset = await getSolidDataset(containerUrl, { fetch: session.fetch });
          const resources = getContainedResourceUrlAll(dataset);
          for (const res of resources) {
            if (isCatalogResource(res)) {
              continue;
            }
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

  const getPodRoot = () => {
    if (!session.info.webId) return "";
    const base = session.info.webId.split("/profile/")[0];
    return base.endsWith("/") ? base : `${base}/`;
  };

  const normalizeUploadPath = (value, fallback = "/public/") => {
    if (!value) return fallback;
    let path = value.trim();
    if (!path.startsWith("/")) path = `/${path}`;
    if (!path.endsWith("/")) path = `${path}/`;
    return path;
  };

  const ensureContainer = async (containerUrl) => {
    try {
      await createContainerAt(containerUrl, { fetch: session.fetch });
    } catch (err) {
      if (err?.statusCode !== 409) {
        throw err;
      }
    }
  };

  const ensureUploadContainer = async (path) => {
    const root = getPodRoot();
    if (!root) throw new Error("Missing pod root.");
    const normalized = normalizeUploadPath(path);
    const uploads = `${root}${normalized.replace(/^\//, "")}`;
    const segments = normalized.split("/").filter(Boolean);
    let current = root;
    for (const segment of segments) {
      current = `${current}${segment}/`;
      await ensureContainer(current);
    }
    return uploads;
  };

  const uploadFile = async (file, pathOverride) => {
    if (!file) return "";
    const uploads = await ensureUploadContainer(pathOverride);
    const safeName = file.name || `upload-${Date.now()}`;
    const targetUrl = `${uploads}${safeName}`;
    const res = await session.fetch(targetUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }
    return targetUrl;
  };

  const handleDatasetFileSelect = async (event) => {
    const file = event?.target?.files?.[0];
    setDatasetUpload({ file: file || null, url: "", error: "" });
    if (!file) return;
    try {
      const url = await uploadFile(file, datasetUploadPath);
      setDatasetUpload({ file, url, error: "" });
      setNewDataset(prev => ({
        ...prev,
        access_url_dataset: url,
        file_format: url.endsWith('.csv') ? 'text/csv' :
          url.endsWith('.json') ? 'application/json' : 'application/octet-stream'
      }));
    } catch (err) {
      setDatasetUpload({ file, url: "", error: "Upload failed. Please try again." });
    }
  };

  const handleModelFileSelect = async (event) => {
    const file = event?.target?.files?.[0];
    setModelUpload({ file: file || null, url: "", error: "" });
    if (!file) return;
    try {
      const url = await uploadFile(file, modelUploadPath);
      setModelUpload({ file, url, error: "" });
      setNewDataset(prev => ({
        ...prev,
        access_url_semantic_model: url
      }));
    } catch (err) {
      setModelUpload({ file, url: "", error: "Upload failed. Please try again." });
    }
  };

  const handleDatasetDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await handleDatasetFileSelect({ target: { files: [file] } });
  };

  const handleModelDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    await handleModelFileSelect({ target: { files: [file] } });
  };

  const handleSaveDataset = async () => {
    try {
      if (!hasRequiredFields) {
        alert("Dataset file and media type are required.");
        return;
      }
      setLoading(true);
      if (datasetSource === "upload" && datasetUpload.file && !newDataset.access_url_dataset) {
        const url = await uploadFile(datasetUpload.file, datasetUploadPath);
        setNewDataset(prev => ({
          ...prev,
          access_url_dataset: url
        }));
      }
      if (showSemanticModel && modelSource === "upload" && modelUpload.file && !newDataset.access_url_semantic_model) {
        const url = await uploadFile(modelUpload.file, modelUploadPath);
        setNewDataset(prev => ({
          ...prev,
          access_url_semantic_model: url
        }));
      }
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
      alert(`Failed to save dataset: ${err?.message || err}`);
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

  const renderSourceToggle = (value, onChange) => (
    <div className="source-toggle">
      <button
        type="button"
        className={`toggle-btn ${value === "upload" ? "active" : ""}`}
        onClick={() => onChange("upload")}
      >
        Upload file
      </button>
      <button
        type="button"
        className={`toggle-btn ${value === "pod" ? "active" : ""}`}
        onClick={() => onChange("pod")}
      >
        Select from pod
      </button>
    </div>
  );

  const renderUploadBox = ({ label, accept, onFileChange, onDrop, state, inputId }) => (
    <div className="upload-box">
      <div
        className="upload-drop"
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <div className="upload-icon">
          <i className="fa-solid fa-cloud-arrow-up"></i>
        </div>
        <div className="upload-text">
          <strong>Drag & drop</strong> your file here
        </div>
        <div className="upload-subtext">or</div>
        <label htmlFor={inputId} className="upload-button">
          Browse files
        </label>
        <input
          id={inputId}
          type="file"
          accept={accept}
          onChange={onFileChange}
          className="upload-input"
        />
      </div>
      {state.url && (
        <div className="upload-hint success">Uploaded to {state.url}</div>
      )}
      {state.error && <div className="upload-hint error">{state.error}</div>}
    </div>
  );

  return (
    <div className="modal show modal-show dataset-add-modal">
      <div className="modal-dialog modal-xl" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-plus mr-2"></i> Add Dataset (Series)
            </h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <div className="pod-info-card mb-4">
              <div className="pod-info-left">
                {solidUserPhoto ? (
                  <img src={solidUserPhoto} alt="Pod owner" className="pod-avatar" />
                ) : (
                  <div className="pod-avatar pod-avatar--placeholder">
                    <i className="fa-solid fa-user"></i>
                  </div>
                )}
                <div>
                  <div className="pod-name">{solidUserName || "Solid Pod User"}</div>
                  <div className="pod-meta">{newDataset.contact_point || "No email provided"}</div>
                  <div className="pod-meta pod-webid">
                    <i className="fa-solid fa-link"></i>
                    <span>{webId || "No WebID"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section mb-4">
              <h6 className="section-title">What do you want to add?</h6>
              <div className="d-flex flex-wrap gap-2">
                <button
                  type="button"
                  className={`btn ${datasetType === "dataset" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setDatasetType("dataset")}
                >
                  <i className="fa-solid fa-database mr-2"></i>Dataset
                </button>
                <button
                  type="button"
                  className={`btn ${datasetType === "series" ? "btn-primary" : "btn-outline-secondary"}`}
                  onClick={() => setDatasetType("series")}
                >
                  <i className="fa-solid fa-layer-group mr-2"></i>Dataset Series (mockup)
                </button>
              </div>
            </div>

            {datasetType === "dataset" && (
              <>
            <div className="form-section mb-4">
              <h6 className="section-title">General Information</h6>
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

            <div className="form-section">
              <h6 className="section-title">Dataset File</h6>
              {renderSourceToggle(datasetSource, (next) => {
                setDatasetSource(next);
                if (next === "upload") {
                  setNewDataset(prev => ({ ...prev, access_url_dataset: "" }));
                } else {
                  setDatasetUpload({ file: null, url: "", error: "" });
                  setNewDataset(prev => ({ ...prev, access_url_dataset: "" }));
                }
              })}
              {datasetSource === "upload" && (
                <div className="upload-path-row">
                  <label htmlFor="dataset-upload-path">Save files to</label>
                  <input
                    id="dataset-upload-path"
                    type="text"
                    value={datasetUploadPath}
                    onChange={(e) => setDatasetUploadPath(e.target.value)}
                    onBlur={(e) => setDatasetUploadPath(normalizeUploadPath(e.target.value, "/public/"))}
                    placeholder="/public/"
                  />
                </div>
              )}
              {datasetSource === "upload" ? (
                renderUploadBox({
                  label: "Upload dataset file",
                  accept: ".csv,.json",
                  onFileChange: handleDatasetFileSelect,
                  onDrop: handleDatasetDrop,
                  state: datasetUpload,
                  inputId: "dataset-upload-input",
                })
              ) : (
                renderFileCards("Select Dataset File (CSV/JSON)", "access_url_dataset", datasetPodFiles, "fa-file-csv")
              )}
            </div>

            <div className="form-section">
              <div className="section-header">
                <div>
                  <h6 className="section-title">Semantic Model File</h6>
                  <div className="text-muted">Optional</div>
                </div>
                <div className="d-flex gap-2">
                  {!showSemanticModel && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setShowSemanticModel(true)}
                    >
                      <i className="fa-solid fa-plus mr-1"></i> Add Semantic Model File
                    </button>
                  )}
                  {showSemanticModel && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => {
                        setShowSemanticModel(false);
                        setModelUpload({ file: null, url: "", error: "" });
                        setModelSource("upload");
                        setNewDataset(prev => ({ ...prev, access_url_semantic_model: "" }));
                      }}
                    >
                      <i className="fa-solid fa-trash mr-1"></i> Remove Semantic Model
                    </button>
                  )}
                  <a
                    href="http://plasma.uni-wuppertal.de/modelings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="fa-solid fa-plus mr-1"></i> Create Semantic Model
                  </a>
                </div>
              </div>
              {showSemanticModel && (
                <>
                  {renderSourceToggle(modelSource, (next) => {
                    setModelSource(next);
                    if (next === "upload") {
                      setNewDataset(prev => ({ ...prev, access_url_semantic_model: "" }));
                    } else {
                      setModelUpload({ file: null, url: "", error: "" });
                      setNewDataset(prev => ({ ...prev, access_url_semantic_model: "" }));
                    }
                  })}
                  {modelSource === "upload" && (
                    <div className="upload-path-row">
                      <label htmlFor="model-upload-path">Save files to</label>
                      <input
                        id="model-upload-path"
                        type="text"
                        value={modelUploadPath}
                        onChange={(e) => setModelUploadPath(e.target.value)}
                        onBlur={(e) => setModelUploadPath(normalizeUploadPath(e.target.value, "/public/"))}
                        placeholder="/public/"
                      />
                    </div>
                  )}
                  {modelSource === "upload" ? (
                    renderUploadBox({
                      label: "Upload semantic model",
                      accept: ".ttl",
                      onFileChange: handleModelFileSelect,
                      onDrop: handleModelDrop,
                      state: modelUpload,
                      inputId: "model-upload-input",
                    })
                  ) : (
                    renderFileCards("", "access_url_semantic_model", modelPodFiles, "fa-project-diagram")
                  )}
                </>
              )}
            </div>
            </>
            )}

            {datasetType === "series" && (
              <div className="form-section mb-4">
                <div className="section-header">
                  <h6 className="section-title">Dataset Series (Mockup)</h6>
                  <span className="badge badge-secondary">Coming soon</span>
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-layer-group input-icon input-icon-text"></i>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Series Title"
                    disabled
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-align-left input-icon input-icon-textarea"></i>
                  <textarea
                    className="form-control"
                    placeholder="Series Description"
                    rows={2}
                    disabled
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-tags input-icon input-icon-text"></i>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Series Theme (IRI)"
                    disabled
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-link input-icon input-icon-text"></i>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Conforms To (IRI)"
                    disabled
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-address-card input-icon input-icon-text"></i>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Contact Point (IRI)"
                    disabled
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label-compact">Series Members (Datasets)</label>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge badge-light border">Member: Dataset A</span>
                    <span className="badge badge-light border">Member: Dataset B</span>
                    <span className="badge badge-light border">Member: Dataset C</span>
                  </div>
                  <button type="button" className="btn btn-outline-secondary btn-sm mt-2" disabled>
                    <i className="fa-solid fa-plus mr-1"></i>Add member
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-success"
              onClick={handleSaveDataset}
              disabled={loading || !hasRequiredFields}
              title={!hasRequiredFields ? "Dataset file and media type are required" : ""}
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-floppy-disk mr-2"></i>
              )}
              {loading ? "Saving..." : "Save Dataset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetAddModal;
