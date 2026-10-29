import CatalogModal from "./CatalogModal";
import { useI18n } from "../i18n";
import React from 'react';

const RequestSuccessModal = ({ onClose }) => {
  const { t } = useI18n();
  return (
    <CatalogModal className="catalog-form-dialog catalog-request-dialog" label={t("Request Sent")} onClose={onClose}>
    <div className="catalog-form-content request-success-modal">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fa-solid fa-paper-plane mr-2"></i> Request Sent
            </h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          <div className="modal-body text-center">
            <i className="fa-solid fa-circle-check fa-4x text-success mb-3"></i>
            <p>Your access request has been delivered to the dataset owner&apos;s Solid inbox.</p>
          </div>

          <div className="modal-footer justify-content-end">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    </CatalogModal>
  );
};

export default RequestSuccessModal;

