import React, { useEffect, useRef } from "react";
import CatalogModal from "./CatalogModal";
import { useI18n } from "../i18n";

export default function CatalogDetailSurface({ label, suspended, onClose, returnFocusRef, children }) {
  const { t } = useI18n();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const url = window.location.href;
    const onPopState = () => {
      if (window.history.state?.catalogDetail !== url) closeRef.current();
    };
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      const focusTarget = returnFocusRef.current;
      if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);

  return <CatalogModal className="catalog-detail-dialog" label={label || t("Detail Dataset")} suspended={suspended} onClose={onClose}>{children}</CatalogModal>;
}
