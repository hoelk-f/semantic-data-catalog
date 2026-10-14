import React, { useEffect, useRef } from "react";
import { useI18n } from "../i18n";

export default function CatalogDetailSurface({ wide, suspended, onClose, returnFocusRef, children }) {
  const { t } = useI18n();
  const dialogRef = useRef(null);
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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;
    if (!suspended && !dialog.open) dialog.showModal();
    if (suspended && dialog.open) dialog.close();
    return () => { if (dialog.open) dialog.close(); };
  }, [wide, suspended]);

  if (wide) return <aside className="catalog-detail-surface" aria-label={t("Detail Dataset")}>{children}</aside>;
  return <dialog ref={dialogRef} className="catalog-detail-dialog" aria-label={t("Detail Dataset")} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>{children}</dialog>;
}
