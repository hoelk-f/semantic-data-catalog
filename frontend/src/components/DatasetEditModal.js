import React, { useState, useEffect } from 'react';
import { session } from "../solidSession";
import { loadAggregatedDatasets, updateDataset, updateDatasetSeries } from "../solidCatalog";
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

const DatasetEditModal = ({ dataset, onClose, fetchDatasets }) => {
  // Shared Solid session instance

  const [editedDataset, setEditedDataset] = useState(null);
  const [webId, setWebId] = useState('');
  const [loading, setLoading] = useState(false);
  const [datasetSource, setDatasetSource] = useState("pod");
  const [modelSource, setModelSource] = useState("pod");
  const [datasetUpload, setDatasetUpload] = useState({ file: null, url: "", error: "" });
  const [modelUpload, setModelUpload] = useState({ file: null, url: "", error: "" });
  const [datasetUploadPath, setDatasetUploadPath] = useState("/");
  const [modelUploadPath, setModelUploadPath] = useState("/");
  const [solidUserName, setSolidUserName] = useState('');
  const [solidUserPhoto, setSolidUserPhoto] = useState('');
  const showSemanticModel = true;
  const [existingDatasets, setExistingDatasets] = useState([]);
  const [seriesMembers, setSeriesMembers] = useState([]);
  const [seriesData, setSeriesData] = useState({
    title: "",
    description: "",
    theme: "",
    issued: "",
    publisher: "",
    contact_point: "",
  });
  const hasRequiredFields = Boolean(
    editedDataset?.access_url_dataset || (datasetSource === "upload" && datasetUpload.file)
  );
  const requiresPublicAccess = datasetSource === "external";

  const isSeries = dataset?.datasetType === "series";

  useEffect(() => {
    if (!requiresPublicAccess || !editedDataset || editedDataset.is_public) return;
    setEditedDataset(prev => ({ ...prev, is_public: true }));
  }, [requiresPublicAccess, editedDataset]);

  useEffect(() => {
    if (!dataset) return;

    const podRoot = session.info.webId
      ? (() => {
          const base = session.info.webId.split("/profile/")[0];
          return base.endsWith("/") ? base : `${base}/`;
        })()
      : "";

    setEditedDataset({
      ...dataset,
      issued: dataset.issued?.split('T')[0] || '',
      modified: dataset.modified?.split('T')[0] || '',
      distribution_access_type: dataset.distribution_access_type || "download",
    });
    setDatasetSource(
      (dataset.distribution_access_type || "download") === "access" ? "external" : "pod"
    );
    setModelSource(
      dataset.access_url_semantic_model &&
        (!podRoot || !dataset.access_url_semantic_model.startsWith(podRoot))
        ? "external"
        : "pod"
    );

    if (dataset.datasetType === "series") {
      setSeriesData({
        title: dataset.title || "",
        description: dataset.description || "",
        theme: dataset.theme || "",
        issued: dataset.issued?.split('T')[0] || '',
        publisher: dataset.publisher || "",
        contact_point: dataset.contact_point || "",
      });
      setSeriesMembers(
        (dataset.seriesMembers || []).filter(Boolean).map((url) => ({
          kind: "existing",
          datasetUrl: url,
          label: url,
        }))
      );
    } else {
      setSeriesMembers([]);
    }
  }, [dataset]);

  useEffect(() => {
    const loadProfileAndFiles = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;

      try {
        const profileDataset = await getSolidDataset(session.info.webId, { fetch: session.fetch });
        const profile = getThing(profileDataset, session.info.webId);
        const name = getStringNoLocale(profile, FOAF.name) || getStringNoLocale(profile, VCARD.fn) || 'Solid Pod User';
        const emailNode = getUrlAll(profile, VCARD.hasEmail)[0];
        let email = '';
        if (emailNode) {
          const emailThing = getThing(profileDataset, emailNode);
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
        setSeriesData(prev => ({
          ...prev,
          publisher: name,
          contact_point: email,
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
      } catch (err) {
        console.error("Failed to load pod data", err);
      }
    };

    loadProfileAndFiles();
  }, [session]);

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
    const file = event?.target?.files?.[0];
    setDatasetUpload({ file: file || null, url: "", error: "" });
    if (!file) return;
    setEditedDataset(prev => ({
      ...prev,
      file_format: inferMediaType(file.name)
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
  };

  const handleDatasetDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    handleDatasetFileSelect({ target: { files: [file] } });
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const inferredMediaType =
      name === 'access_url_dataset' ? inferMediaType(value) : '';
    setEditedDataset(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'access_url_dataset' ? {
        file_format: inferredMediaType !== "application/octet-stream" ? inferredMediaType : ""
      } : {})
    }));
  };

  const handleDatasetSourceChange = (next) => {
    setDatasetSource(next);
    if (next !== "upload") {
      setDatasetUpload({ file: null, url: "", error: "" });
    }
    setEditedDataset(prev => ({
      ...prev,
      access_url_dataset: "",
      file_format: "",
      distribution_access_type: "download",
      is_public: next === "external" || modelSource === "external" ? true : prev.is_public,
    }));
  };

  const handleModelSourceChange = (next) => {
    setModelSource(next);
    if (next !== "upload") {
      setModelUpload({ file: null, url: "", error: "" });
    }
    setEditedDataset(prev => ({
      ...prev,
      access_url_semantic_model: "",
      is_public: next === "external" || datasetSource === "external" ? true : prev.is_public,
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (isSeries) {
        if (!seriesData.title.trim()) {
          alert("Series title is required.");
          return;
        }
        if (seriesMembers.length === 0) {
          alert("Please add at least one series member.");
          return;
        }
        const memberUrls = seriesMembers
          .filter((member) => member.kind === "existing" && member.datasetUrl)
          .map((member) => member.datasetUrl);
        await updateDatasetSeries(session, {
          ...seriesData,
          container_url: dataset.access_url_dataset,
          identifier: dataset.identifier,
          datasetUrl: dataset.datasetUrl,
          seriesUrl: dataset.datasetUrl,
          seriesMembers: Array.from(new Set(memberUrls)),
          webid: webId,
        });
      } else {
        let datasetToSave = { ...editedDataset };
        if (!datasetToSave.access_url_dataset && !(datasetSource === "upload" && datasetUpload.file)) {
          alert("Dataset link is required.");
          return;
        }
        if ((datasetSource === "external") && !datasetToSave.is_public) {
          datasetToSave = { ...datasetToSave, is_public: true };
        }
        if (!datasetToSave.access_url_semantic_model && !(modelSource === "upload" && modelUpload.file)) {
          alert("A semantic model or schema is required for this distribution.");
          return;
        }
        if (datasetSource === "upload" && datasetUpload.file) {
          const url = await uploadFile(datasetUpload.file, datasetUploadPath);
          datasetToSave = {
            ...datasetToSave,
            access_url_dataset: url,
            file_format: inferMediaType(url),
          };
          setDatasetUpload(prev => ({ ...prev, url, error: "" }));
          setEditedDataset(prev => ({
            ...prev,
            access_url_dataset: url,
            file_format: inferMediaType(url),
          }));
        }
        if (showSemanticModel && modelSource === "upload" && modelUpload.file) {
          const url = await uploadFile(modelUpload.file, modelUploadPath);
          datasetToSave = {
            ...datasetToSave,
            access_url_semantic_model: url,
          };
          setModelUpload(prev => ({ ...prev, url, error: "" }));
          setEditedDataset(prev => ({
            ...prev,
            access_url_semantic_model: url
          }));
        }
        await updateDataset(session, { ...datasetToSave, distribution_access_type: "download" });
      }
      await fetchDatasets();
      onClose();
    } catch (err) {
      console.error("Error updating dataset:", err);
      alert(err?.message || "The dataset could not be saved.");
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

  const renderUploadBox = ({ label, accept, onFileChange, onDrop, state, inputId, hint }) => (
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
      {state.file && (
        <div className="upload-selected-files">
          <span>1 file selected</span>
          <div className="upload-selected-file">
            <div>
              <strong translate="no">{state.file.name}</strong>
              <small>{Math.ceil((state.file.size || 0) / 1024)} KB</small>
            </div>
          </div>
        </div>
      )}
      {hint && <div className="upload-hint">{hint}</div>}
      {state.url && (
        <div className="upload-hint success">Uploaded to {state.url}</div>
      )}
      {state.error && <div className="upload-hint error">{state.error}</div>}
    </div>
  );

  const renderExternalUrlInput = ({ label, name, value, placeholder, hint }) => (
    <div className="mb-3">
      <label className="font-weight-bold mb-2">{label}</label>
      <input
        className="form-control"
        type="url"
        name={name}
        value={value || ""}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
      {hint && <div className="upload-hint">{hint}</div>}
    </div>
  );

  if (!editedDataset) return null;
  const resolveMemberLabel = (member) => {
    if (!member) return "Dataset";
    const match = existingDatasets.find((item) => item.datasetUrl === member.datasetUrl);
    const resolved = match?.title || match?.identifier || member.datasetUrl || "Dataset";
    if (!member.label) return resolved;
    if (member.label === member.datasetUrl) return resolved;
    return member.label;
  };

  return (
    <div className="modal show modal-show dataset-add-modal">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-pen-to-square mr-2"></i> {isSeries ? "Edit Dataset Series" : "Edit Dataset"}
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close"><span>&times;</span></button>
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
                  <div className="pod-meta">{editedDataset.contact_point || "No email provided"}</div>
                  <div className="pod-meta pod-webid">
                    <i className="fa-solid fa-link"></i>
                    <span>{webId || "No WebID"}</span>
                  </div>
                </div>
              </div>
            </div>

            {!isSeries && (
              <>
                <div className="form-section mb-4">
                  <h6 className="section-title">General Information</h6>
                  {renderInput("Title", "title", "text", "fa-heading")}
                  {renderInput("Description", "description", "textarea", "fa-align-left")}
                  {renderInput("Theme", "theme", "text", "fa-tags")}
                  {!requiresPublicAccess && (
                    <>
                      <label className="form-label-compact">Access Rights</label>
                      <div className="form-group position-relative mb-3">
                        <i className="fa-solid fa-lock input-icon input-icon-text"></i>
                        <select
                          className="form-control"
                          name="is_public"
                          value={editedDataset.is_public ? 'public' : 'restricted'}
                          onChange={(e) =>
                            setEditedDataset(prev => ({ ...prev, is_public: e.target.value === 'public' }))
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
                  {renderInput("Issued Date", "issued", "date", "fa-calendar-plus")}
                </div>

                <div className="form-section">
                  <h6 className="section-title">Dataset Resource</h6>
                  {renderInput("Media type (e.g. application/json)", "file_format", "text", "fa-file-code")}
                  {renderSourceToggle(datasetSource, handleDatasetSourceChange)}
                  {datasetSource === "upload" && (
                    <PodContainerPicker
                      onSelectPath={(path) => setDatasetUploadPath(normalizeUploadPath(path, "/"))}
                      webId={webId}
                    />
                  )}
                  {datasetSource === "upload" ? (
                    renderUploadBox({
                      label: "Upload dataset file",
                      accept: ".csv,.json,.ttl,.jsonld,.rdf,.xml,.pdf,.docx,.txt",
                      onFileChange: handleDatasetFileSelect,
                      onDrop: handleDatasetDrop,
                      state: datasetUpload,
                      inputId: "edit-dataset-upload-input",
                    })
                  ) : datasetSource === "pod" ? (
                    <PodResourcePicker
                      label="Select Dataset File"
                      resourceType="dataset"
                      selectedUrl={editedDataset.access_url_dataset}
                      webId={webId}
                      onSelect={(fileUrl) =>
                        setEditedDataset(prev => ({
                          ...prev,
                          access_url_dataset: fileUrl,
                          file_format: inferMediaType(fileUrl),
                        }))
                      }
                    />
                  ) : (
                    renderExternalUrlInput({
                      label: "Direct dataset download URL",
                      name: "access_url_dataset",
                      value: editedDataset.access_url_dataset,
                      placeholder: "https://...",
                    })
                  )}
                  <div className="section-header">
                    <div>
                      <h6 className="section-title">Semantic model or schema</h6>
                      <div className="text-muted">Required for each distribution</div>
                    </div>
                    <div className="d-flex gap-2 semantic-model-actions">
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
                          inputId: "edit-model-upload-input",
                        })
                      ) : modelSource === "pod" ? (
                        <PodResourcePicker
                          label="Select Semantic Model"
                          resourceType="semanticModel"
                          selectedUrl={editedDataset.access_url_semantic_model}
                          webId={webId}
                          onSelect={(fileUrl) =>
                            setEditedDataset(prev => ({
                              ...prev,
                              access_url_semantic_model: fileUrl,
                            }))
                          }
                        />
                      ) : (
                        renderExternalUrlInput({
                          label: "Public model or schema IRI",
                          name: "access_url_semantic_model",
                          value: editedDataset.access_url_semantic_model,
                          placeholder: "https://example.org/model.ttl",
                        })
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {isSeries && (
              <div className="form-section mb-4">
                <div className="section-header">
                  <h6 className="section-title">Dataset Series</h6>
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-layer-group input-icon input-icon-text"></i>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Series Title"
                    value={seriesData.title}
                    onChange={(e) =>
                      setSeriesData(prev => ({ ...prev, title: e.target.value }))
                    }
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-align-left input-icon input-icon-textarea"></i>
                  <textarea
                    className="form-control"
                    placeholder="Series Description"
                    rows={2}
                    value={seriesData.description}
                    onChange={(e) =>
                      setSeriesData(prev => ({ ...prev, description: e.target.value }))
                    }
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-tags input-icon input-icon-text"></i>
                  <input
                    className="form-control"
                    type="text"
                    placeholder="Series Theme (IRI)"
                    value={seriesData.theme}
                    onChange={(e) =>
                      setSeriesData(prev => ({ ...prev, theme: e.target.value }))
                    }
                    style={{ paddingLeft: '30px' }}
                  />
                </div>

                <label htmlFor="issued" className="form-label-compact">Issued Date</label>
                <div className="form-group position-relative mb-3">
                  <i className="fa-solid fa-calendar-plus input-icon input-icon-date"></i>
                  <input
                    className="form-control"
                    type="date"
                    value={seriesData.issued}
                    onChange={(e) => setSeriesData(prev => ({ ...prev, issued: e.target.value }))}
                    style={{ paddingLeft: '30px' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label-compact">Series Members (Existing Datasets)</label>
                  <div className="d-flex flex-wrap gap-2">
                    {existingDatasets.map((item) => {
                      const selected = seriesMembers.some(
                        (member) => member.kind === "existing" && member.datasetUrl === item.datasetUrl
                      );
                      return (
                        <button
                          key={item.datasetUrl}
                          type="button"
                          className={`btn btn-sm ${selected ? "btn-primary" : "btn-outline-secondary"}`}
                          onClick={() => {
                            if (selected) {
                              setSeriesMembers((prev) =>
                                prev.filter(
                                  (member) =>
                                    !(
                                      member.kind === "existing" &&
                                      member.datasetUrl === item.datasetUrl
                                    )
                                )
                              );
                            } else {
                              setSeriesMembers((prev) => [
                                ...prev,
                                {
                                  kind: "existing",
                                  datasetUrl: item.datasetUrl,
                                  label: item.title || item.identifier || item.datasetUrl,
                                },
                              ]);
                            }
                          }}
                        >
                          <i className="fa-solid fa-database mr-2"></i>
                          {item.title || item.identifier || "Dataset"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {seriesMembers.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label-compact">Current Members</label>
                    <div className="d-flex flex-wrap gap-2">
                      {seriesMembers.map((member, idx) => (
                        <span key={`${member.kind}-${idx}`} className="badge badge-light border">
                          {resolveMemberLabel(member)}
                          <button
                            type="button"
                            className="btn btn-link btn-sm ml-2"
                            onClick={() =>
                              setSeriesMembers((prev) =>
                                prev.filter((_, index) => index !== idx)
                              )
                            }
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-success"
              onClick={handleSave}
              disabled={loading || (!isSeries && !hasRequiredFields)}
              title={!isSeries && !hasRequiredFields ? "Dataset link is required" : ""}
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              ) : (
                <i className="fa-solid fa-floppy-disk mr-2"></i>
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatasetEditModal;
