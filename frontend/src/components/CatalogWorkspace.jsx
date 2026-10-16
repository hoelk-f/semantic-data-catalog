import { datasetPodNames, podNameFromRoot } from "../catalogOrigin";
import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDatabase, faLayerGroup, faSearch, faSliders, faXmark, faGlobe, faLock, faLockOpen, faUser, faFolder, faClock, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../i18n";
import { accessState, catalogPodOptions, datasetKey, datasetThemes, highlightParts, selectCatalogDatasets, themeLabel } from "../catalogView";
import CatalogDetailSurface from "./CatalogDetailSurface";
import "./CatalogWorkspace.css";

export const CatalogIcon = ({ icon, ...props }) => <FontAwesomeIcon icon={icon} aria-hidden="true" {...props} />;

function Highlight({ value, query }) {
  return <span translate="no">{highlightParts(value, query).map((part, index) => part.match
    ? <mark key={index}>{part.text}</mark> : <React.Fragment key={index}>{part.text}</React.Fragment>)}</span>;
}

const accessLabels = { public: "Public", available: "Access granted", restricted: "Restricted", series: "Dataset Series" };
const accessIcons = { public: faGlobe, available: faLockOpen, restricted: faLock, series: faLayerGroup };

export default function CatalogWorkspace({ datasets, selectedDataset, onSelect, onCloseDetail, detail, detailSuspended = false, actions, onSemanticSearch }) {
  const { t, language } = useI18n();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState({ theme: "", publisher: "", type: "", access: "", pod: "" });
  const [sort, setSort] = useState("relevance");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const selectedButton = useRef(null);
  const filterId = useId();
  const searchId = useId();

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query); setPage(0); }, 200);
    return () => clearTimeout(timer);
  }, [query]);


  const pods = useMemo(() => catalogPodOptions(datasets), [datasets]);
  const options = useMemo(() => ({
    theme: [...new Set(datasets.flatMap(datasetThemes))].sort((a, b) => themeLabel(a).localeCompare(themeLabel(b))),
    publisher: [...new Set(datasets.map((item) => item.publisher).filter(Boolean))].sort(),
    type: ["dataset", "series"],
    access: ["public", "available", "restricted"],
    pod: pods.map(({ value }) => value),
  }), [datasets, pods]);
  const results = useMemo(() => selectCatalogDatasets(datasets, { query: debouncedQuery, ...filters, sort }), [datasets, debouncedQuery, filters, sort]);
  const activeFilters = Object.entries(filters).filter(([, value]) => value);
  const pageCount = Math.max(1, Math.ceil(results.length / pageSize));
  const visiblePage = Math.min(page, pageCount - 1);
  const visible = results.slice(visiblePage * pageSize, (visiblePage + 1) * pageSize);
  const labels = { theme: "Theme", publisher: "Publisher", type: "Type", access: "Access Rights", pod: "Pod" };
  const labelFor = (key, value) => key === "theme" ? themeLabel(value)
    : key === "pod" ? pods.find((option) => option.value === value)?.label || podNameFromRoot(value)
    : key === "type" ? t(value === "series" ? "Dataset Series" : "Dataset")
      : key === "access" ? t(accessLabels[value]) : value;
  const changeFilter = (key, value) => { setFilters((previous) => ({ ...previous, [key]: value })); setPage(0); };
  const reset = () => { setQuery(""); setDebouncedQuery(""); setFilters({ theme: "", publisher: "", type: "", access: "", pod: "" }); setPage(0); };
  const changePage = (nextPage) => { setPage(nextPage); listRef.current?.scrollIntoView?.({ block: "start" }); };
  const formatDate = (value) => {
    if (!value || Number.isNaN(Date.parse(value))) return t("Date not provided");
    return new Intl.DateTimeFormat(language === "de" ? "de-DE" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
  };

  return (
    <section className="catalog-workspace" aria-label={t("Catalog")}>
      <div className="catalog-workspace-grid">
        <div className="catalog-browse" translate="no">
          <div className="catalog-search-row">
            <div className="catalog-search-field" role="search">
              <label className="catalog-sr-only" htmlFor={searchId}>{t("Search datasets...")}</label>
              <CatalogIcon icon={faSearch} />
              <input id={searchId} ref={searchRef} type="search" value={query} placeholder={t("Search datasets...")} autoComplete="off" onChange={(event) => setQuery(event.target.value)} />
              {query && <button type="button" className="catalog-icon-button" aria-label={t("Clear search")} onClick={() => { setQuery(""); setDebouncedQuery(""); setPage(0); searchRef.current?.focus(); }}><CatalogIcon icon={faXmark} /></button>}
            </div>
            <div className="catalog-tools">{typeof actions === "function" ? actions(t) : actions}</div>
            {onSemanticSearch && <button type="button" className="catalog-semantic-link" aria-haspopup="dialog" onClick={onSemanticSearch}>{t("Semantic Search")}<CatalogIcon icon={faSearch} /></button>}
          </div>
          <div className="catalog-filter-toggle-row"><button type="button" className="catalog-button catalog-button--quiet" aria-controls={filterId} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><CatalogIcon icon={faSliders} />{t("Filters")}{activeFilters.length > 0 && <span className="catalog-filter-count">{activeFilters.length}</span>}</button></div>
          <div id={filterId} className={`catalog-filters${filtersOpen ? " is-open" : ""}`}>
            {Object.entries(labels).map(([key, label]) => <label key={key} className={`catalog-filter--${key}`}><span>{t(label)}</span><select value={filters[key]} onChange={(event) => changeFilter(key, event.target.value)}>
              <option value="">{t("All")}</option>
              {options[key].map((value) => <option key={value} value={value}>{labelFor(key, value)}</option>)}
            </select></label>)}
          </div>
          {activeFilters.length > 0 && <div className="catalog-active-filters" aria-label={t("Active filters")}>
            {activeFilters.map(([key, value]) => <button type="button" className="catalog-filter-chip" key={key} aria-label={`${t("Remove filter")}: ${t(labels[key])}: ${labelFor(key, value)}`} onClick={() => changeFilter(key, "")}><span>{t(labels[key])}: {labelFor(key, value)}</span><CatalogIcon icon={faXmark} /></button>)}
            <button type="button" className="catalog-text-button" onClick={reset}>{t("Reset all")}</button>
          </div>}
          <div className="catalog-results-toolbar">
            <p role="status" aria-live="polite" aria-atomic="true"><strong>{results.length}</strong> {t("results")} <span className="catalog-results-total">/ {datasets.length}</span></p>
            <label className="catalog-sort"><span>{t("Sort by")}</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(0); }}><option value="relevance">{t("Relevance")}</option><option value="modified">{t("Recently updated")}</option><option value="title">{t("Title A–Z")}</option></select></label>
          </div>
          <div className="catalog-results" ref={listRef}>
            {visible.length > 0 ? <ul className="catalog-card-list" aria-label={t("Datasets")}>
              {visible.map((dataset) => {
                const key = datasetKey(dataset);
                const selected = Boolean(selectedDataset && datasetKey(selectedDataset) === key);
                const access = accessState(dataset);
                const isSeries = dataset.datasetType === "series";
                const themes = datasetThemes(dataset);
                const podName = datasetPodNames(dataset);
                return <li key={key}><button type="button" className={`catalog-card${selected ? " is-selected" : ""}${dataset.isStale ? " is-stale" : ""}`} aria-pressed={selected} onClick={(event) => { selectedButton.current = event.currentTarget; onSelect(dataset); }}>
                  <span className={`catalog-symbol${isSeries ? " catalog-symbol--series" : ""}`}><CatalogIcon icon={isSeries ? faLayerGroup : faDatabase} /></span>
                  <span className="catalog-card-main"><span className="catalog-card-title"><Highlight value={dataset.title || t("Untitled dataset")} query={debouncedQuery} /></span><span className="catalog-card-description"><Highlight value={dataset.description || t("No description provided.")} query={debouncedQuery} /></span>
                    <span className="catalog-tags">{themes.slice(0, 3).map((theme) => <span className="catalog-tag" key={theme}>{themeLabel(theme)}</span>)}{themes.length > 3 && <span className="catalog-tag">+{themes.length - 3}</span>}{isSeries && <span className="catalog-tag">{(dataset.seriesMembers || []).length} {t("Members")}</span>}{!isSeries && dataset.file_format && <span className="catalog-format">{dataset.file_format}</span>}</span>
                  </span>
                  <span className="catalog-card-meta"><span className={`catalog-access catalog-access--${access}`}><CatalogIcon icon={accessIcons[access]} />{t(accessLabels[access])}</span><span className="catalog-meta-line"><CatalogIcon icon={faUser} /><span title={dataset.publisher}>{dataset.publisher || t("Publisher not provided")}</span></span>{podName && <span className="catalog-meta-line catalog-pod-name"><CatalogIcon icon={faFolder} /><span title={podName}>{podName}</span></span>}<span className="catalog-meta-line"><CatalogIcon icon={faClock} />{formatDate(dataset.modified || dataset.issued)}</span>{dataset.isStale && <span className="catalog-stale-label">{t("Source needs refreshing")}</span>}</span>
                </button></li>;
              })}
            </ul> : <div className="catalog-empty"><span className="catalog-symbol"><CatalogIcon icon={faSearch} /></span><h2>{t(datasets.length ? "No matching datasets" : "Your catalog is ready to grow")}</h2><p>{t(datasets.length ? "Try another search or adjust your filters." : "Datasets from your selected registries will appear here.")}</p>{query && <p className="catalog-empty-query">“{query}”</p>}{(query || activeFilters.length > 0) && <button type="button" className="catalog-button" onClick={reset}>{t("Reset all")}</button>}</div>}
          </div>
          <nav className="catalog-pagination" aria-label={t("Result pages")}>
            <label><span>{t("Per page")}</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0); }}>{[10, 25, 50].map((size) => <option key={size}>{size}</option>)}</select></label>
            <div><button type="button" className="catalog-icon-button" aria-label={t("Previous page")} disabled={visiblePage === 0} onClick={() => changePage(visiblePage - 1)}><CatalogIcon icon={faChevronLeft} /></button><span>{visiblePage + 1} / {pageCount}</span><button type="button" className="catalog-icon-button" aria-label={t("Next page")} disabled={visiblePage >= pageCount - 1} onClick={() => changePage(visiblePage + 1)}><CatalogIcon icon={faChevronRight} /></button></div>
          </nav>
        </div>
        {detail && <CatalogDetailSurface suspended={detailSuspended} onClose={onCloseDetail} returnFocusRef={selectedButton}>{detail}</CatalogDetailSurface>}
      </div>
    </section>
  );
}
