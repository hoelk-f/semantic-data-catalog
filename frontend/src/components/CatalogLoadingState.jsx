import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../i18n";
import "./CatalogLoadingState.css";

export default function CatalogLoadingState({
  title,
  description = "",
  embedded = false,
  error = false,
  onRetry,
}) {
  const { language, t } = useI18n();
  const translatedTitle = t(title);
  const translatedDescription = t(description);

  return (
    <div
      lang={language}
      className={`catalog-loading-app catalog-loading-app--loading catalog-loading-app--${
        embedded ? "embedded" : "standalone"
      }`}
    >
      <main className="catalog-full-loader" aria-busy={!error}>
        <span className="catalog-full-loader__mark" aria-hidden="true">
          <FontAwesomeIcon icon={faBookOpen} />
        </span>
        <h1>{translatedTitle}</h1>
        <p role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"}>
          {translatedDescription}
        </p>
        {error ? (
          <button type="button" className="catalog-full-loader__retry" onClick={onRetry}>
            {t("Try again")}
          </button>
        ) : <span
          className="catalog-full-loader__rail"
          role="progressbar"
          aria-label={translatedDescription}
        >
          <span />
        </span>}
      </main>
    </div>
  );
}
