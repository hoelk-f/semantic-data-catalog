import React, { useEffect, useState } from "react";
import { session } from "../solidSession";
import {
  buildDefaultPrivateRegistry,
  loadRegistryConfig,
  loadRegistryMembersFromContainer,
  saveRegistryConfig,
  syncRegistryMembersInContainer,
} from "../solidCatalog";
import "./PrivateRegistryModal.css";

const PrivateRegistryModal = ({ onClose, onSaved }) => {
  const [registryUrl, setRegistryUrl] = useState("");
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const normalizeMembers = (list, webId) => {
    const cleaned = Array.from(
      new Set((list || []).map((value) => (value || "").trim()).filter(Boolean))
    );
    if (webId) {
      const idx = cleaned.indexOf(webId);
      if (idx !== -1) cleaned.splice(idx, 1);
    }
    return cleaned.map((value, idx) => ({
      id: `member-${Date.now()}-${idx}`,
      value,
    }));
  };

  useEffect(() => {
    const load = async () => {
      if (!session.info.isLoggedIn || !session.info.webId) return;
      setLoading(true);
      setError("");
      try {
        const webId = session.info.webId;
        const config = await loadRegistryConfig(webId, session.fetch);
        const targetUrl = config.privateRegistry || buildDefaultPrivateRegistry(webId);
        setRegistryUrl(targetUrl);
        const list = await loadRegistryMembersFromContainer(targetUrl, session.fetch);
        setMembers(normalizeMembers(list, webId));
      } catch (err) {
        console.error("Failed to load private registry:", err);
        setError("Failed to load private registry.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const addMember = () => {
    setMembers((prev) => [
      ...prev,
      { id: `member-${Date.now()}-${prev.length}`, value: "" },
    ]);
  };

  const updateMember = (id, value) => {
    setMembers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value } : item))
    );
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!session.info.isLoggedIn || !session.info.webId) return;
    setSaving(true);
    setError("");
    try {
      const webId = session.info.webId;
      const config = await loadRegistryConfig(webId, session.fetch);
      const targetUrl = config.privateRegistry || buildDefaultPrivateRegistry(webId);
      if (!config.privateRegistry) {
        await saveRegistryConfig(webId, session.fetch, {
          ...config,
          mode: "private",
          privateRegistry: targetUrl,
        });
      }

      const list = members
        .map((item) => (item.value || "").trim())
        .filter(Boolean);
      if (webId && !list.includes(webId)) list.unshift(webId);
      await syncRegistryMembersInContainer(targetUrl, session.fetch, list, {
        allowCreate: true,
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save private registry:", err);
      setError(err?.message || "Failed to save private registry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal show modal-show dataset-add-modal private-registry-modal">
      <div className="modal-dialog modal-xl" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Private Registry</h5>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label>Registry URL</label>
              <div className="form-control" style={{ height: "auto" }}>
                {registryUrl || "Not configured"}
              </div>
              <small className="form-text text-muted">
                This registry is stored in your pod under <code>registry/</code>.
              </small>
            </div>

            {loading ? (
              <div>Loading registry members...</div>
            ) : (
              <div className="form-group">
                <label>Members (WebIDs)</label>
                {members.length === 0 && (
                  <div className="text-muted mb-2">No WebIDs added yet.</div>
                )}
                {members.map((member) => (
                  <div key={member.id} className="d-flex mb-2 member-row">
                    <input
                      className="form-control mr-2"
                      type="text"
                      placeholder="https://example.org/profile/card#me"
                      value={member.value}
                      onChange={(e) => updateMember(member.id, e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeMember(member.id)}
                      aria-label="Remove WebID"
                      title="Remove WebID"
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                ))}
                <button type="button" className="btn btn-light" onClick={addMember}>
                  Add WebID
                </button>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateRegistryModal;
