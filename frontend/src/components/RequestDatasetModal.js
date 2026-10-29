import CatalogModal from "./CatalogModal";
import { useI18n } from "../i18n";
import React, { useState } from 'react';
import { session } from "../solidSession";
import { sendAccessRequest } from "../accessRequestState";

const RequestDatasetModal = ({ dataset, sessionWebId, userName, userEmail, onClose, onSuccess }) => {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      const result = await sendAccessRequest({ session, dataset, userName, userEmail, message });
      onClose();
      if (onSuccess) onSuccess(result);
    } catch (error) {
      console.error('Error requesting dataset access:', error);
      setError("Failed to send the access request. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CatalogModal className="catalog-form-dialog catalog-request-dialog" label={t("Request Dataset Access")} onClose={onClose}>
    <div className="catalog-form-content request-modal">
      <div className="modal-dialog modal-xl" role="document">
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
              autoFocus
              aria-label={t("Required message...")}
              className="form-control request-message"
              required
              placeholder="Required message..."
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
    </CatalogModal>
  );
};

export default RequestDatasetModal;
