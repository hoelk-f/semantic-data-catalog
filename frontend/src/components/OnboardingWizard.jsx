import React, { useEffect, useMemo, useState } from "react";
import {
  getSolidDataset,
  getThing,
  getThingAll,
  createThing,
  setThing,
  saveSolidDatasetAt,
  getStringNoLocale,
  getUrl,
  getUrlAll,
  removeAll,
  setStringNoLocale,
  setUrl,
  addUrl,
  createContainerAt,
  getSolidDatasetWithAcl,
  getResourceAcl,
  hasResourceAcl,
  hasAccessibleAcl,
  createAclFromFallbackAcl,
  setPublicResourceAccess,
  saveAclFor,
  overwriteFile,
} from "@inrupt/solid-client";
import { FOAF, VCARD, LDP } from "@inrupt/vocab-common-rdf";
import { session } from "../solidSession";
import { ensureCatalogStructure, resolveCatalogUrlFromWebId } from "../solidCatalog";
import "./OnboardingWizard.css";

const VCARD_TYPE = "http://www.w3.org/2006/vcard/ns#type";

const guessContentType = (filename, fallback = "application/octet-stream") => {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "svg":
      return "image/svg+xml";
    default:
      return fallback;
  }
};

const getProfileDocUrl = (webId) => (webId ? webId.split("#")[0] : "");

const getPodRoot = (webId) => {
  const url = new URL(webId);
  const segments = url.pathname.split("/").filter(Boolean);
  const profileIndex = segments.indexOf("profile");
  const baseSegments = profileIndex > -1 ? segments.slice(0, profileIndex) : segments;
  const basePath = baseSegments.length ? `/${baseSegments.join("/")}/` : "/";
  return `${url.origin}${basePath}`;
};

const normalizeEmails = (values) =>
  values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

export default function OnboardingWizard({ webId, onComplete, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");

  const [dataset, setDataset] = useState(null);
  const [profileThing, setProfileThing] = useState(null);
  const [profileDocUrl, setProfileDocUrl] = useState("");

  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState("");
  const [emails, setEmails] = useState([""]);
  const [inboxUrl, setInboxUrl] = useState("");
  const [photoIri, setPhotoIri] = useState("");
  const [photoSrc, setPhotoSrc] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [inboxAcknowledged, setInboxAcknowledged] = useState(false);
  const [catalogUrl, setCatalogUrl] = useState("");
  const [catalogAcknowledged, setCatalogAcknowledged] = useState(false);

  const steps = useMemo(
    () => [
      { id: 1, title: "Basics" },
      { id: 2, title: "Email" },
      { id: 3, title: "Inbox & Catalog" },
    ],
    []
  );

  const basicsComplete = Boolean(name.trim() && org.trim() && role.trim());
  const emailsComplete = normalizeEmails(emails).length > 0;

  const loadProfile = async () => {
    if (!webId) return;
    setLoading(true);
    setError("");
    try {
      const profileDoc = getProfileDocUrl(webId);
      setProfileDocUrl(profileDoc);
      const ds = await getSolidDataset(profileDoc, { fetch: session.fetch });
      setDataset(ds);
      let me = getThing(ds, webId) || getThingAll(ds).find((t) => t.url === webId);
      if (!me) me = createThing({ url: webId });
      setProfileThing(me);

      const nm =
        getStringNoLocale(me, VCARD.fn) ||
        getStringNoLocale(me, FOAF.name) ||
        `${getStringNoLocale(me, VCARD.given_name) || ""} ${getStringNoLocale(me, VCARD.family_name) || ""}`.trim();
      setName(nm || "");
      setOrg(getStringNoLocale(me, VCARD.organization_name) || "");
      setRole(getStringNoLocale(me, VCARD.role) || "");

      const emailUris = getUrlAll(me, VCARD.hasEmail) || [];
      const collected = [];
      emailUris.forEach((uri) => {
        if (uri.startsWith("mailto:")) {
          collected.push(uri.replace(/^mailto:/, ""));
        } else {
          const thing = getThing(ds, uri);
          if (thing) {
            const email = (getUrl(thing, VCARD.value) || "").replace(/^mailto:/, "");
            if (email) collected.push(email);
          }
        }
      });

      const directEmails = (getUrlAll(me, VCARD.email) || []).map((uri) =>
        uri.replace(/^mailto:/, "")
      );
      const allEmails = [...collected, ...directEmails].filter(Boolean);
      setEmails(allEmails.length ? allEmails : [""]);

      const inbox = getUrl(me, LDP.inbox) || "";
      setInboxUrl(inbox);
      setInboxAcknowledged(Boolean(inbox));
      const photo = getUrl(me, VCARD.hasPhoto) || getUrl(me, FOAF.img) || "";
      setPhotoIri(photo);

      let catalogResolved = "";
      let hasCatalog = false;
      try {
        catalogResolved = await resolveCatalogUrlFromWebId(webId, session.fetch);
        if (catalogResolved) {
          await getSolidDataset(catalogResolved.split("#")[0], { fetch: session.fetch });
          hasCatalog = true;
        }
      } catch {
        hasCatalog = false;
      }
      setCatalogUrl(catalogResolved);
      setCatalogAcknowledged(hasCatalog);

      const missingBasics = !(nm && org && role);
      const missingEmail = allEmails.length === 0;
      const missingInbox = !inbox;
      const missingCatalog = !hasCatalog;

      if (!missingBasics && !missingEmail && !missingInbox && !missingCatalog) {
        onComplete();
        return;
      }

      if (missingBasics) setStep(1);
      else if (missingEmail) setStep(2);
      else setStep(3);
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [webId]);

  useEffect(() => {
    let revoked = false;
    let objectUrl = "";
    (async () => {
      try {
        if (!photoIri) {
          setPhotoSrc("");
          return;
        }
        const res = await session.fetch(photoIri);
        if (!res.ok) throw new Error(`Avatar ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!revoked) setPhotoSrc(objectUrl);
      } catch {
        setPhotoSrc("");
      }
    })();
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoIri]);

  const uploadAvatar = async (file) => {
    const podRoot = getPodRoot(webId);

    const ensureContainer = async (containerUrl) => {
      try {
        await getSolidDataset(containerUrl, { fetch: session.fetch });
      } catch (e) {
        if (e?.statusCode === 404 || e?.response?.status === 404) {
          await createContainerAt(containerUrl, { fetch: session.fetch });
        } else {
          throw e;
        }
      }
    };

    const profileUrl = `${podRoot}profile/`;
    await ensureContainer(profileUrl);

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const targetUrl = `${profileUrl}avatar-${Date.now()}.${ext}`;
    await overwriteFile(targetUrl, file, {
      contentType: file.type || guessContentType(file.name, "image/*"),
      fetch: session.fetch,
    });
    return targetUrl;
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setError("");
    try {
      const url = await uploadAvatar(file);
      setPhotoIri(url);
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Avatar upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const saveBasics = async () => {
    if (!dataset || !profileDocUrl) return;
    let me = profileThing || createThing({ url: webId });
    me = removeAll(me, VCARD.fn);
    me = removeAll(me, VCARD.organization_name);
    me = removeAll(me, VCARD.role);
    me = setStringNoLocale(me, VCARD.fn, name.trim());
    me = setStringNoLocale(me, VCARD.organization_name, org.trim());
    me = setStringNoLocale(me, VCARD.role, role.trim());
    me = removeAll(me, VCARD.hasPhoto);
    if (photoIri) {
      me = setUrl(me, VCARD.hasPhoto, photoIri);
    }

    const updated = setThing(dataset, me);
    await saveSolidDatasetAt(profileDocUrl, updated, { fetch: session.fetch });
    setDataset(updated);
    setProfileThing(me);
  };

  const saveEmails = async () => {
    if (!dataset || !profileDocUrl) return;
    let me = profileThing || createThing({ url: webId });
    let ds = dataset;

    me = removeAll(me, VCARD.hasEmail);
    me = removeAll(me, VCARD.email);

    const list = normalizeEmails(emails);
    list.forEach((email, idx) => {
      const nodeUrl = `${profileDocUrl}#email-${Date.now()}-${idx}`;
      let emailNode = createThing({ url: nodeUrl });
      emailNode = removeAll(emailNode, VCARD.value);
      emailNode = setUrl(emailNode, VCARD.value, `mailto:${email}`);
      emailNode = setStringNoLocale(emailNode, VCARD_TYPE, "Work");
      ds = setThing(ds, emailNode);
      me = addUrl(me, VCARD.hasEmail, nodeUrl);
    });

    ds = setThing(ds, me);
    await saveSolidDatasetAt(profileDocUrl, ds, { fetch: session.fetch });
    setDataset(ds);
    setProfileThing(me);
  };

  const getResourceAndAcl = async (url) => {
    const resource = await getSolidDatasetWithAcl(url, { fetch: session.fetch });
    let resourceAcl;
    if (!hasResourceAcl(resource)) {
      if (!hasAccessibleAcl(resource)) {
        throw new Error("No access to ACL.");
      }
      resourceAcl = createAclFromFallbackAcl(resource);
    } else {
      resourceAcl = getResourceAcl(resource);
    }
    return { resource, resourceAcl };
  };

  const configureInbox = async () => {
    if (!webId || !profileDocUrl) return;
    const targetInboxUrl = `${getPodRoot(webId)}inbox/`;
    try {
      await getSolidDataset(targetInboxUrl, { fetch: session.fetch });
    } catch (e) {
      if (e?.statusCode === 404 || e?.response?.status === 404) {
        await createContainerAt(targetInboxUrl, { fetch: session.fetch });
      } else {
        throw e;
      }
    }

    const { resource, resourceAcl } = await getResourceAndAcl(targetInboxUrl);
    const updatedAcl = setPublicResourceAccess(resourceAcl, {
      read: false,
      append: true,
      write: false,
      control: false,
    });
    await saveAclFor(resource, updatedAcl, { fetch: session.fetch });

    let ds = dataset;
    if (!ds) {
      ds = await getSolidDataset(profileDocUrl, { fetch: session.fetch });
    }
    let me = profileThing || createThing({ url: webId });
    me = removeAll(me, LDP.inbox);
    me = setUrl(me, LDP.inbox, targetInboxUrl);
    ds = setThing(ds, me);
    await saveSolidDatasetAt(profileDocUrl, ds, { fetch: session.fetch });
    setDataset(ds);
    setProfileThing(me);
    setInboxUrl(targetInboxUrl);
  };

  const configureCatalog = async () => {
    if (!webId) return;
    const title = name ? `${name}'s Catalog` : "Semantic Data Catalog";
    const { catalogUrl: configuredUrl } = await ensureCatalogStructure(session, {
      title,
    });
    setCatalogUrl(configuredUrl);
  };

  const handleNext = async () => {
    setError("");
    setSaving(true);
    try {
      if (step === 1) {
        await saveBasics();
        setStep(2);
      } else if (step === 2) {
        await saveEmails();
        setStep(3);
      } else if (step === 3) {
        await configureInbox();
        await configureCatalog();
        onComplete();
      }
    } catch (err) {
      console.error("Setup step failed:", err);
      setError(err?.message || "Saving failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1);
  };

  if (loading) {
    return (
      <div className="onboarding-wrap">
        <div className="onboarding-card">
          <div className="onboarding-title">Preparing your profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-wrap">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <div>
            <div className="onboarding-title">Welcome to the Semantic Data Catalog</div>
            <div className="onboarding-subtitle">
              Complete these steps to activate your catalog access.
            </div>
          </div>
          <button className="onboarding-cancel" type="button" onClick={onCancel}>
            Cancel
          </button>
        </div>

        <div className="onboarding-steps">
          {steps.map((item) => (
            <div
              key={item.id}
              className={`onboarding-step ${item.id === step ? "active" : ""} ${
                item.id < step ? "done" : ""
              }`}
            >
              <div className="onboarding-step__index">{item.id}</div>
              <div className="onboarding-step__label">{item.title}</div>
            </div>
          ))}
        </div>

        {error && <div className="onboarding-error">{error}</div>}

        {step === 1 && (
          <div className="onboarding-section">
            <h3>Basics</h3>
            <p>Please provide your profile basics.</p>
            <div className="onboarding-basics">
              <div className="onboarding-avatar">
                {photoSrc ? (
                  <img src={photoSrc} alt="Profile avatar" />
                ) : (
                  <div className="onboarding-avatar__placeholder">No photo</div>
                )}
                <label
                  className="onboarding-avatar__btn"
                  aria-label="Upload profile photo"
                  title="Upload profile photo (optional)"
                >
                  <svg
                    className="onboarding-avatar__icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M9 4h6l1.2 2H20a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V8a2 2 0 0 1 2-2h3.8L9 4Zm3 5a5 5 0 1 0 0 10a5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6a3 3 0 0 1 0-6Z"
                    />
                  </svg>
                  {photoUploading ? "Uploading..." : ""}
                  <input type="file" accept="image/*" hidden onChange={onPickAvatar} />
                </label>
              </div>
              <div className="onboarding-grid">
                <div>
                  <label>Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label>Organization</label>
                  <input
                    type="text"
                    value={org}
                    onChange={(e) => setOrg(e.target.value)}
                  />
                </div>
                <div>
                  <label>Role</label>
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-section">
            <h3>Email</h3>
            <p>Add at least one contact email.</p>
            <div className="onboarding-list">
              {emails.map((email, idx) => (
                <div className="onboarding-list__row" key={idx}>
                  <input
                    type="email"
                    placeholder="name@example.org"
                    value={email}
                    onChange={(e) => {
                      const next = [...emails];
                      next[idx] = e.target.value;
                      setEmails(next);
                    }}
                  />
                  <button
                    type="button"
                    className="onboarding-remove"
                    onClick={() => {
                      const next = emails.filter((_, i) => i !== idx);
                      setEmails(next.length ? next : [""]);
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="onboarding-add"
                onClick={() => setEmails([...emails, ""])}
              >
                Add email
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-section">
            <h3>Solid Inbox & Catalog</h3>
            <p>
              Configure your Solid inbox and catalog so access requests and metadata stay in your pod.
            </p>
            <div className="onboarding-inbox">
              <div className="onboarding-inbox__label">Inbox URL</div>
              <div className="onboarding-inbox__value">
                {inboxUrl || "Not configured"}
              </div>
              <div className="onboarding-inbox__hint">
                On finish, we will create an inbox container in your pod root (if needed)
                and set the permissions required for notifications.
              </div>
              <label className="onboarding-checkbox">
                <input
                  type="checkbox"
                  checked={inboxAcknowledged}
                  onChange={(e) => setInboxAcknowledged(e.target.checked)}
                />
                <span>I understand that finishing will create and configure my inbox.</span>
              </label>
            </div>

            <div className="onboarding-inbox" style={{ marginTop: 18 }}>
              <div className="onboarding-inbox__label">Catalog URL</div>
              <div className="onboarding-inbox__value">
                {catalogUrl || "Not configured"}
              </div>
              <div className="onboarding-inbox__hint">
                The catalog metadata will be created in a <code>catalog/</code> container in your pod.
              </div>
              <label className="onboarding-checkbox">
                <input
                  type="checkbox"
                  checked={catalogAcknowledged}
                  onChange={(e) => setCatalogAcknowledged(e.target.checked)}
                />
                <span>I understand that finishing will create and configure my catalog.</span>
              </label>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          <button
            type="button"
            className="onboarding-back"
            onClick={handleBack}
            disabled={step === 1 || saving}
          >
            Back
          </button>
          <button
            type="button"
            className="onboarding-next"
            onClick={handleNext}
            disabled={
              saving ||
              (step === 1 && !basicsComplete) ||
              (step === 2 && !emailsComplete) ||
              (step === 3 && (!inboxAcknowledged || !catalogAcknowledged))
            }
          >
            {saving ? "Saving..." : step === 3 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
