import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import content from "./legalContent.json";
function LegalDialog({ page, locale, onClose }) {
  const ref = useRef(null);
  const copy = content[locale];
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true }); };
  }, []);
  return createPortal(<dialog ref={ref} className="ds-legal-dialog" aria-label={copy[page]} aria-modal="true" lang={locale} translate="no" data-i18n-skip
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="ds-legal-dialog__layout">
      <header><h2>{copy[page]}</h2><button type="button" aria-label={locale === "de" ? "Schließen" : "Close"} onClick={onClose}>×</button></header>
      <article tabIndex={0}>
        <p>{copy.updated}: <time dateTime={content.revision}>{content.revision}</time></p><p>{copy.summary}</p>
        {page === "privacy" && content.privacyStatus === "draft" && <aside><h3>{copy.draftTitle}</h3><p>{copy.draftBody}</p></aside>}
        {copy[page === "imprint" ? "imprintSections" : "privacySections"].map((section, index) => <section key={index}>
          <h3>{section.title}</h3>{section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          {"links" in section && section.links && <ul>{section.links.map(link => <li key={link.url}><a href={/^(https:\/\/|mailto:)/.test(link.url) ? link.url : undefined}>{link.label}</a></li>)}</ul>}
        </section>)}
      </article>
    </div>
  </dialog>, document.body);
}
export default function StandaloneFooter({ title, version, language, assetsBase, children, className = "" }) {
  const [page, setPage] = useState(null);
  const locale = language === "de" ? "de" : "en";
  return <>
    <footer data-standalone-footer className={className}>
      <nav className="ds-footer-legal" aria-label={locale === "de" ? "Rechtliche Informationen" : "Legal information"} lang={locale} translate="no" data-i18n-skip>
        <button type="button" aria-haspopup="dialog" onClick={() => setPage("imprint")}>{content[locale].imprint}</button>
        <button type="button" aria-haspopup="dialog" onClick={() => setPage("privacy")}>{content[locale].privacy}</button>
      </nav>
      <div className="ds-footer-logos" aria-label={locale === "de" ? "Projektpartner" : "Project partners"}>
        <img src={`${assetsBase}/assets/images/Logo_BUW.png`} alt="Bergische Universität Wuppertal" />
        <img src={`${assetsBase}/assets/images/Logo_TMDT.png`} alt="TMDT" />
      </div>
      <div className="footer-version"><span>{title}</span><span className="ds-version-badge" translate="no">{version}</span></div>
      {children && <div className="ds-footer-extra">{children}</div>}
    </footer>
    {page && <LegalDialog page={page} locale={locale} onClose={() => setPage(null)} />}
  </>;
}
