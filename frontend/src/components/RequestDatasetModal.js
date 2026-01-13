import React, { useState } from 'react';
import { getSolidDataset, getThing, getUrl } from "@inrupt/solid-client";
import { LDP } from "@inrupt/vocab-common-rdf";
import { session } from "../solidSession";

const SDM_NS = "https://w3id.org/solid-dataspace-manager#";
const XSD_NS = "http://www.w3.org/2001/XMLSchema#";

const escapeLiteral = (value = "") =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");

const buildNotificationTurtle = (payload) => {
  const lines = [
    "@prefix sdm: <" + SDM_NS + ">.",
    "@prefix dct: <http://purl.org/dc/terms/>.",
    "@prefix as: <https://www.w3.org/ns/activitystreams#>.",
    "@prefix xsd: <" + XSD_NS + ">.",
    "",
    "<> a sdm:AccessRequest, as:Offer;",
    `  dct:created "${payload.createdAt}"^^xsd:dateTime;`,
    `  sdm:status "pending";`,
    `  sdm:requesterWebId <${payload.requesterWebId}>;`,
    `  sdm:requesterName "${escapeLiteral(payload.requesterName)}";`,
    `  sdm:requesterEmail "${escapeLiteral(payload.requesterEmail)}";`,
    `  sdm:datasetIdentifier "${escapeLiteral(payload.datasetIdentifier)}";`,
    `  sdm:datasetTitle "${escapeLiteral(payload.datasetTitle)}";`,
    `  dct:title "${escapeLiteral(payload.datasetTitle)}";`,
  ];

  if (payload.datasetAccessUrl) {
    lines.push(`  sdm:datasetAccessUrl <${payload.datasetAccessUrl}>;`);
  }
  if (payload.datasetSemanticModelUrl) {
    lines.push(`  sdm:datasetSemanticModelUrl <${payload.datasetSemanticModelUrl}>;`);
  }
  if (payload.catalogUrl) {
    lines.push(`  sdm:catalogUrl <${payload.catalogUrl}>;`);
  }
  if (payload.message) {
    lines.push(`  sdm:message "${escapeLiteral(payload.message)}";`);
  }

  lines.push("  .");
  return lines.join("\n");
};

const RequestDatasetModal = ({ dataset, sessionWebId, userName, userEmail, onClose, onSuccess }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const resolveInboxUrl = async (ownerWebId) => {
    const profileDataset = await getSolidDataset(ownerWebId, { fetch: session.fetch });
    const profile = getThing(profileDataset, ownerWebId);
    if (!profile) return null;
    return getUrl(profile, LDP.inbox);
  };

  const handleRequest = async () => {
    try {
      setError("");
      if (!session.info.isLoggedIn || !sessionWebId) {
        setError("Please sign in with Solid to request access.");
        return;
      }
      if (!message.trim()) {
        setError("Please provide a reason for your request.");
        return;
      }
      if (!dataset?.webid) {
        setError("This dataset does not provide an owner WebID for access requests.");
        return;
      }

      setIsSubmitting(true);
      const inboxUrl = await resolveInboxUrl(dataset.webid);
      if (!inboxUrl) {
        setError("The dataset owner has no Solid inbox configured.");
        return;
      }

      const payload = {
        createdAt: new Date().toISOString(),
        requesterWebId: sessionWebId,
        requesterName: userName || "",
        requesterEmail: userEmail || "",
        datasetIdentifier: dataset.identifier || "",
        datasetTitle: dataset.title || "",
        datasetAccessUrl: dataset.access_url_dataset || "",
        datasetSemanticModelUrl: dataset.access_url_semantic_model || "",
        catalogUrl: window.location.origin + "/semantic-data-catalog/",
        message: message || "",
      };

      const turtle = buildNotificationTurtle(payload);
      const res = await session.fetch(inboxUrl, {
        method: "POST",
        headers: {
          "Content-Type": "text/turtle",
          "Slug": `access-request-${dataset.identifier || "dataset"}-${Date.now()}`,
        },
        body: turtle,
      });
      if (!res.ok) {
        throw new Error(`Inbox rejected request (${res.status})`);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error requesting dataset access:', error);
      setError("Failed to send the access request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal fade show modal-show" tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-envelope-open-text mr-2"></i> Request Dataset Access
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body">
            <p className="mb-3">
              Your request will be delivered to the owner&apos;s Solid inbox and
              handled in the Solid Dataspace Manager.
            </p>
            <p className="mb-3">
              To submit a request, please include a short background explaining why you need this dataset.
            </p>
            <textarea
              className="form-control"
              required
              placeholder="Optional message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {error && <div className="text-danger mt-2">{error}</div>}
          </div>

          <div className="modal-footer justify-content-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRequest}
              disabled={isSubmitting}
            >
              Request Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDatasetModal;
