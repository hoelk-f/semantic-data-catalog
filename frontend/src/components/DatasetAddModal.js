import React, { useState, useEffect } from 'react';
import { session } from "../solidSession";
import { createDataset, createDatasetSeries, ensureCatalogStructure, loadAggregatedDatasets } from "../solidCatalog";
import {
  getSolidDataset,
  getThing,
  getStringNoLocale,
  getUrl,
  getUrlAll,
  createContainerAt
} from "@inrupt/solid-client";
import { FOAF, VCARD } from "@inrupt/vocab-common-rdf";
import PodContainerPicker from "./PodContainerPicker";
import PodResourcePicker, { isTtlResource } from "./PodResourcePicker";

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
    distribution_access_type: 'download',
    theme: '',
    is_public: true
  });

  const [loading, setLoading] = useState(false);
  const [datasetSource, setDatasetSource] = useState("upload");
  const [modelSource, setModelSource] = useState("upload");
  const [datasetUpload, setDatasetUpload] = useState({ files: [], urls: [], error: "" });
  const [modelUpload, setModelUpload] = useState({ file: null, url: "", error: "" });
  const [selectedDatasetUrls, setSelectedDatasetUrls] = useState([]);
  const [externalDatasetLinks, setExternalDatasetLinks] = useState([""]);
  const [showSemanticModel, setShowSemanticModel] = useState(false);

  // Use shared Solid session from solidSession.js
  const [solidUserName, setSolidUserName] = useState('');
  const [solidUserPhoto, setSolidUserPhoto] = useState('');
  const [webId, setWebId] = useState('');
  const [datasetUploadPath, setDatasetUploadPath] = useState("/");
  const [modelUploadPath, setModelUploadPath] = useState("/");
  const [existingDatasets, setExistingDatasets] = useState([]);
  const datasetUploadFiles = datasetUpload.files || [];
  const externalDatasetUrls = Array.from(new Set(
    (externalDatasetLinks || []).map((url) => url.trim()).filter(Boolean)
  ));
  const selectedDatasetResourceUrls = datasetSource === "pod"
    ? selectedDatasetUrls
    : datasetSource === "upload"
      ? datasetUploadFiles.map((file, index) => `upload:${index}:${file.name}:${file.size}:${file.lastModified}`)
      : externalDatasetUrls;
  const isAutomaticSeries = selectedDatasetResourceUrls.length > 1;
  const hasRequiredFields = selectedDatasetResourceUrls.length > 0;
  const requiresPublicAccess = datasetSource === "external" || (!isAutomaticSeries && modelSource === "external");

  useEffect(() => {
    if (!requiresPublicAccess || newDataset.is_public) return;
    setNewDataset(prev => ({ ...prev, is_public: true }));
  }, [requiresPublicAccess, newDataset.is_public]);

  useEffect(() => {
    if (!isAutomaticSeries) return;
    setShowSemanticModel(false);
    setModelSource("upload");
    setModelUpload({ file: null, url: "", error: "" });
    setNewDataset(prev =>
      prev.access_url_semantic_model
        ? { ...prev, access_url_semantic_model: "" }
        : prev
    );
  }, [isAutomaticSeries]);

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

    const loadExistingDatasets = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;
      try {
        const { datasets } = await loadAggregatedDatasets(session);
        const own = (datasets || []).filter(
          (item) =>
            item.webid === session.info.webId &&
            item.datasetType !== "series" &&
            Boolean(item.datasetUrl)
        );
        setExistingDatasets(own);
      } catch (err) {
        console.error("Failed to load existing datasets:", err);
      }
    };

    fetchSolidProfile();
    loadExistingDatasets();
  }, [session]);

  const inferMediaType = (value) => {
    if (!value) return "";
    const lowered = value.toLowerCase();
    if (lowered.endsWith(".csv")) return "text/csv";
    if (lowered.endsWith(".json")) return "application/json";
    if (lowered.endsWith(".geojson")) return "application/geo+json";
    if (lowered.endsWith(".jsonld") || lowered.endsWith(".json-ld")) return "application/ld+json";
    if (lowered.endsWith(".ttl")) return "text/turtle";
    if (lowered.endsWith(".rdf") || lowered.endsWith(".xml")) return "application/rdf+xml";
    if (lowered.endsWith(".pdf")) return "application/pdf";
    if (lowered.endsWith(".docx")) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    if (lowered.endsWith(".txt")) return "text/plain";
    return "application/octet-stream";
  };

  const uniqueUrls = (urls) => Array.from(new Set((urls || []).filter(Boolean)));

  const getFileNameFromUrl = (url) => {
    if (!url) return "Dataset";
    const cleanUrl = url.split(/[?#]/)[0];
    return decodeURIComponent(cleanUrl.split("/").filter(Boolean).pop() || "Dataset");
  };

  const getDatasetTitleFromUrl = (url) => {
    const fileName = getFileNameFromUrl(url);
    return fileName.replace(/\.[^.]+$/, "") || fileName || "Dataset";
  };

  const findExistingDatasetForResource = (resourceUrl) =>
    existingDatasets.find((item) => item.access_url_dataset === resourceUrl);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const inferredMediaType =
      name === 'access_url_dataset' ? inferMediaType(value) : '';

    setNewDataset(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'access_url_dataset' ? {
        file_format: inferredMediaType !== "application/octet-stream" ? inferredMediaType : ""
      } : {})
    }));
  };

  const handleDatasetSourceChange = (next) => {
    setDatasetSource(next);
    setSelectedDatasetUrls([]);
    if (next !== "upload") {
      setDatasetUpload({ files: [], urls: [], error: "" });
    }
    if (next !== "external") {
      setExternalDatasetLinks([""]);
    }
    setNewDataset(prev => ({
      ...prev,
      access_url_dataset: "",
      file_format: "",
      distribution_access_type: next === "external" ? "access" : "download",
      is_public: next === "external" || modelSource === "external" ? true : prev.is_public,
    }));
  };

  const handleModelSourceChange = (next) => {
    setModelSource(next);
    if (next !== "upload") {
      setModelUpload({ file: null, url: "", error: "" });
    }
    setNewDataset(prev => ({
      ...prev,
      access_url_semantic_model: "",
      is_public: next === "external" || datasetSource === "external" ? true : prev.is_public,
    }));
  };

  const getPodRoot = () => {
    if (!session.info.webId) return "";
    const base = session.info.webId.split("/profile/")[0];
    return base.endsWith("/") ? base : `${base}/`;
  };

  const normalizeUploadPath = (value, fallback = "/") => {
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
    const safeName = encodeURIComponent(file.name || `upload-${Date.now()}`);
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

  const handleDatasetFileSelect = (event) => {
    const files = Array.from(event?.target?.files || []);
    setDatasetUpload({ files, urls: [], error: "" });
    setSelectedDatasetUrls([]);
    setNewDataset(prev => ({
      ...prev,
      access_url_dataset: "",
      file_format: files.length === 1 ? inferMediaType(files[0].name) : "",
    }));
  };

  const handleModelFileSelect = (event) => {
    const file = event?.target?.files?.[0];
    setModelUpload({ file: file || null, url: "", error: "" });
    if (!file) return;
    if (!isTtlResource(file.name)) {
      setModelUpload({ file: null, url: "", error: "Only TTL files are allowed." });
      return;
    }
    setNewDataset(prev => ({
      ...prev,
      access_url_semantic_model: ""
    }));
  };

  const handleDatasetDrop = (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []);
    if (files.length === 0) return;
    handleDatasetFileSelect({ target: { files } });
  };

  const handleModelDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!isTtlResource(file.name)) {
      setModelUpload({ file: null, url: "", error: "Only TTL files are allowed." });
      return;
    }
    handleModelFileSelect({ target: { files: [file] } });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      let pendingDataset = { ...newDataset };
      const selectedUploadFiles = datasetUpload.files || [];
      const plannedDatasetResourceUrls = datasetSource === "pod"
        ? uniqueUrls(selectedDatasetUrls)
        : datasetSource === "upload"
          ? selectedUploadFiles.map((file, index) => `upload:${index}:${file.name}:${file.size}:${file.lastModified}`)
          : externalDatasetUrls;
      const plannedSaveAsSeries = plannedDatasetResourceUrls.length > 1;

      if (plannedDatasetResourceUrls.length === 0) {
        alert("Dataset link is required.");
        return;
      }
      if (plannedSaveAsSeries && !pendingDataset.title.trim()) {
        alert("Series title is required.");
        return;
      }
      if ((datasetSource === "external" || (!plannedSaveAsSeries && modelSource === "external")) && !pendingDataset.is_public) {
        pendingDataset = { ...pendingDataset, is_public: true };
      }
      if (!plannedSaveAsSeries && showSemanticModel && pendingDataset.access_url_semantic_model && !isTtlResource(pendingDataset.access_url_semantic_model)) {
        alert("Semantic Models must be TTL files.");
        return;
      }

      let uploadedDatasetUrls = [];
      if (datasetSource === "upload" && selectedUploadFiles.length > 0) {
        for (const file of selectedUploadFiles) {
          uploadedDatasetUrls.push(await uploadFile(file, datasetUploadPath));
        }
        setDatasetUpload(prev => ({ ...prev, urls: uploadedDatasetUrls, error: "" }));
        if (uploadedDatasetUrls.length === 1) {
          pendingDataset = {
            ...pendingDataset,
            access_url_dataset: uploadedDatasetUrls[0],
            file_format: inferMediaType(uploadedDatasetUrls[0]),
          };
          setNewDataset(prev => ({
            ...prev,
            access_url_dataset: uploadedDatasetUrls[0],
            file_format: inferMediaType(uploadedDatasetUrls[0]),
          }));
        }
      }

      const datasetResourceUrls = datasetSource === "pod"
        ? uniqueUrls(selectedDatasetUrls)
        : datasetSource === "upload"
          ? uploadedDatasetUrls
          : externalDatasetUrls;
      const saveAsSeries = datasetResourceUrls.length > 1;

      let semanticModelUrl = saveAsSeries ? "" : pendingDataset.access_url_semantic_model;
      if (!saveAsSeries && showSemanticModel && modelSource === "upload" && modelUpload.file && !semanticModelUrl) {
        const url = await uploadFile(modelUpload.file, modelUploadPath);
        semanticModelUrl = url;
        setModelUpload(prev => ({ ...prev, url, error: "" }));
        setNewDataset(prev => ({
          ...prev,
          access_url_semantic_model: url
        }));
      }

      await ensureCatalogStructure(session, {
        title: solidUserName ? `${solidUserName}'s Catalog` : undefined,
      });

      if (saveAsSeries) {
        const memberDatasetUrls = [];
        for (const resourceUrl of datasetResourceUrls) {
          const existingDataset = findExistingDatasetForResource(resourceUrl);
          if (existingDataset?.datasetUrl) {
            memberDatasetUrls.push(existingDataset.datasetUrl);
            continue;
          }

          const created = await createDataset(session, {
            ...pendingDataset,
            title: getDatasetTitleFromUrl(resourceUrl),
            access_url_dataset: resourceUrl,
            access_url_semantic_model: "",
            file_format: inferMediaType(resourceUrl),
            distribution_access_type: datasetSource === "external" ? "access" : "download",
            is_public: datasetSource === "external" ? true : pendingDataset.is_public,
            webid: webId,
          });
          memberDatasetUrls.push(created.datasetUrl);
        }

        await createDatasetSeries(session, {
          title: pendingDataset.title,
          description: pendingDataset.description,
          theme: pendingDataset.theme,
          issued: pendingDataset.issued,
          publisher: pendingDataset.publisher,
          contact_point: pendingDataset.contact_point,
          webid: webId,
          seriesMembers: uniqueUrls(memberDatasetUrls),
        });
      } else {
        const resourceUrl = datasetResourceUrls[0];
        await createDataset(session, {
          ...pendingDataset,
          access_url_dataset: resourceUrl,
          access_url_semantic_model: semanticModelUrl,
          file_format: pendingDataset.file_format || inferMediaType(resourceUrl),
          webid: webId,
        });
      }

      await fetchDatasets();
      onClose();
    } catch (err) {
      console.error("Error saving dataset/series:", err);
      alert(`Failed to save: ${err?.message || err}`);
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
      <button
        type="button"
        className={`toggle-btn ${value === "external" ? "active" : ""}`}
        onClick={() => onChange("external")}
      >
        External link
      </button>
    </div>
  );

  const handleRemoveDatasetUploadFile = (indexToRemove) => {
    const nextFiles = datasetUploadFiles.filter((_, index) => index !== indexToRemove);
    setDatasetUpload({ files: nextFiles, urls: [], error: "" });
    setNewDataset(prev => ({
      ...prev,
      access_url_dataset: "",
      file_format: nextFiles.length === 1 ? inferMediaType(nextFiles[0].name) : "",
    }));
  };

  const syncExternalDatasetState = (links) => {
    const urls = Array.from(new Set((links || []).map((url) => url.trim()).filter(Boolean)));
    setNewDataset(prev => ({
      ...prev,
      access_url_dataset: urls[0] || "",
      file_format: urls.length === 1 ? inferMediaType(urls[0]) : "",
    }));
  };

  const handleExternalDatasetLinkChange = (indexToUpdate, value) => {
    const nextLinks = externalDatasetLinks.map((link, index) =>
      index === indexToUpdate ? value : link
    );
    setExternalDatasetLinks(nextLinks);
    syncExternalDatasetState(nextLinks);
  };

  const handleAddExternalDatasetLink = () => {
    setExternalDatasetLinks(prev => [...prev, ""]);
  };

  const handleRemoveExternalDatasetLink = (indexToRemove) => {
    const nextLinks = externalDatasetLinks.filter((_, index) => index !== indexToRemove);
    const safeLinks = nextLinks.length > 0 ? nextLinks : [""];
    setExternalDatasetLinks(safeLinks);
    syncExternalDatasetState(safeLinks);
  };

  const renderUploadBox = ({ label, accept, onFileChange, onDrop, state, inputId, hint, multiple = false, onRemoveFile }) => {
    const selectedFiles = state.files || (state.file ? [state.file] : []);
    const uploadedUrls = state.urls || (state.url ? [state.url] : []);

    return (
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
            <strong>Drag & drop</strong> your file{multiple ? "s" : ""} here
          </div>
          <div className="upload-subtext">or</div>
          <label htmlFor={inputId} className="upload-button">
            Browse files
          </label>
          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={onFileChange}
            className="upload-input"
          />
        </div>
        {selectedFiles.length > 0 && (
          <div className="upload-selected-files">
            <span>{selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected</span>
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="upload-selected-file">
                <div>
                  <strong translate="no">{file.name}</strong>
                  <small>{Math.ceil((file.size || 0) / 1024)} KB</small>
                </div>
                {onRemoveFile && (
                  <button type="button" onClick={() => onRemoveFile(index)} aria-label={`Remove ${file.name}`} title="Remove">
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {hint && <div className="upload-hint">{hint}</div>}
        {uploadedUrls.length > 0 && (
          <div className="upload-hint success">Uploaded {uploadedUrls.length} file{uploadedUrls.length === 1 ? "" : "s"}.</div>
        )}
        {state.error && <div className="upload-hint error">{state.error}</div>}
      </div>
    );
  };

  const renderExternalUrlInput = ({ label, name, value, placeholder, hint }) => (
    <div className="mb-3">
      <label className="font-weight-bold mb-2">{label}</label>
      <input
        className="form-control"
        type="url"
        name={name}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
      {hint && <div className="upload-hint">{hint}</div>}
    </div>
  );

  const renderExternalDatasetLinks = () => (
    <div className="external-link-list">
      <div className="external-link-list-header">
        <label>External Dataset link</label>
      </div>
      {externalDatasetLinks.map((link, index) => (
        <div className="external-link-row" key={`external-link-${index}`}>
          <input
            className="form-control"
            type="url"
            value={link}
            onChange={(event) => handleExternalDatasetLinkChange(index, event.target.value)}
            placeholder="https://..."
          />
          <button
            type="button"
            className="external-link-remove"
            onClick={() => handleRemoveExternalDatasetLink(index)}
            disabled={externalDatasetLinks.length === 1 && !link.trim()}
            aria-label="Remove external link"
            title="Remove"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ))}
      <button type="button" className="external-link-add" onClick={handleAddExternalDatasetLink}>
        <i className="fa-solid fa-plus"></i>
        Add External Link
      </button>
    </div>
  );

  return (
    <div className="modal show modal-show dataset-add-modal">
      <div className="modal-dialog modal-xl" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-plus mr-2"></i> Add Dataset
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
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
              <h6 className="section-title">{isAutomaticSeries ? "Dataset Series" : "General Information"}</h6>
              {isAutomaticSeries ? (
                <>
                  {renderInputWithIcon("Series Title", "title", "text", "fa-layer-group")}
                  {renderInputWithIcon("Series Description", "description", "textarea", "fa-align-left")}
                  {renderInputWithIcon("Series Theme (IRI)", "theme", "text", "fa-tags")}
                  <label htmlFor="issued" className="form-label-compact">Issued Date</label>
                  {renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus")}
                </>
              ) : (
                <>
                  {renderInputWithIcon("Title", "title", "text", "fa-heading")}
                  {renderInputWithIcon("Description", "description", "textarea", "fa-align-left")}
                  {renderInputWithIcon("Theme", "theme", "text", "fa-tags")}
                  {!requiresPublicAccess && (
                    <>
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
                    </>
                  )}
                  <label htmlFor="issued" className="form-label-compact">Issued Date</label>
                  {renderInputWithIcon("Issued Date", "issued", "date", "fa-calendar-plus")}
                </>
              )}
            </div>

            <div className="form-section">
              <h6 className="section-title">Dataset Resource</h6>
              {renderSourceToggle(datasetSource, handleDatasetSourceChange)}
              {datasetSource === "upload" && (
                <PodContainerPicker
                  onSelectPath={(path) => setDatasetUploadPath(normalizeUploadPath(path, "/"))}
                  webId={webId}
                />
              )}
              {datasetSource === "upload" ? (
                renderUploadBox({
                  label: "Upload dataset files",
                  accept: ".csv,.json,.ttl,.jsonld,.rdf,.xml,.pdf,.docx,.txt",
                  onFileChange: handleDatasetFileSelect,
                  onDrop: handleDatasetDrop,
                  state: datasetUpload,
                  inputId: "dataset-upload-input",
                  multiple: true,
                  onRemoveFile: handleRemoveDatasetUploadFile,
                })
              ) : datasetSource === "pod" ? (
                <PodResourcePicker
                  multiple
                  resourceType="dataset"
                  selectedUrls={selectedDatasetUrls}
                  webId={webId}
                  onSelect={(fileUrls) => {
                    const nextUrls = uniqueUrls(fileUrls);
                    setSelectedDatasetUrls(nextUrls);
                    setNewDataset(prev => ({
                      ...prev,
                      access_url_dataset: nextUrls[0] || "",
                      file_format: nextUrls.length === 1 ? inferMediaType(nextUrls[0]) : "",
                    }));
                  }}
                />
              ) : (
                renderExternalDatasetLinks()
              )}
            </div>

            {!isAutomaticSeries && (
            <div className="form-section">
              <div className="section-header">
                <div>
                  <h6 className="section-title">Semantic Model File</h6>
                  <div className="text-muted">Optional</div>
                </div>
                <div className="d-flex gap-2 semantic-model-actions">
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
                  {renderSourceToggle(modelSource, handleModelSourceChange)}
                  {modelSource === "upload" && (
                    <PodContainerPicker
                      onSelectPath={(path) => setModelUploadPath(normalizeUploadPath(path, "/"))}
                      webId={webId}
                    />
                  )}
                  {modelSource === "upload" ? (
                    renderUploadBox({
                      label: "Upload semantic model",
                      accept: ".ttl",
                      onFileChange: handleModelFileSelect,
                      onDrop: handleModelDrop,
                      state: modelUpload,
                      hint: "Allowed: TTL",
                      inputId: "model-upload-input",
                    })
                  ) : modelSource === "pod" ? (
                    <PodResourcePicker
                      label="Select Semantic Model"
                      resourceType="semanticModel"
                      selectedUrl={newDataset.access_url_semantic_model}
                      webId={webId}
                      onSelect={(fileUrl) =>
                        setNewDataset(prev => ({
                          ...prev,
                          access_url_semantic_model: fileUrl,
                        }))
                      }
                    />
                  ) : (
                    renderExternalUrlInput({
                      label: "Public external semantic model link",
                      name: "access_url_semantic_model",
                      value: newDataset.access_url_semantic_model,
                      placeholder: "https://example.org/model.ttl",
                    })
                  )}
                </>
              )}
            </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={
                loading ||
                !hasRequiredFields ||
                (isAutomaticSeries && !newDataset.title.trim())
              }
              title={
                !hasRequiredFields
                  ? "Dataset link is required"
                  : isAutomaticSeries && !newDataset.title.trim()
                    ? "Series title is required"
                  : ""
              }
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-floppy-disk mr-2"></i>
              )}
              {loading ? "Saving..." : isAutomaticSeries ? "Save Series" : "Save Dataset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetAddModal;
