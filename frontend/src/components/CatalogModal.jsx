import React, { useEffect, useRef } from "react";
import "./CatalogModal.css";

export default function CatalogModal({ className = "", label, suspended = false, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (suspended) return undefined;
    const trigger = document.activeElement;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      if (trigger?.isConnected && !dialog.contains(trigger)) trigger.focus({ preventScroll: true });
    };
  }, [suspended]);

  return <dialog ref={dialogRef} className={`catalog-modal ${className}`} aria-label={label} aria-modal="true"
    onCancel={(event) => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    {children}
  </dialog>;
}
