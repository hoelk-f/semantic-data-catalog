import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getSolidDataset } from '@inrupt/solid-client';
import CatalogWorkspace from './components/CatalogWorkspace';
import CatalogEntryAddModal from './components/CatalogEntryAddModal';
import ApiServiceModal from './components/ApiServiceModal';
import ApiServiceDetail from './components/ApiServiceDetail';
import PublicDataExplorer from './components/PublicDataExplorer';
import DatasetDetailModal from './components/DatasetDetailModal';
import SemanticSearchModal from './components/SemanticSearchModal';
import { safeResultUrl } from './semanticSearchApi';
import DatasetDeleteModal from './components/DatasetDeleteModal';
import DatasetEditModal from './components/DatasetEditModal';
import HeaderBar, { loadProfilePhoto } from './components/HeaderBar';
import FooterBar from './components/FooterBar';
import OnboardingWizard from './components/OnboardingWizard';
import CatalogLoadingState from './components/CatalogLoadingState';
import PrivateRegistryModal from './components/PrivateRegistryModal';
import CatalogSurvey from './components/CatalogSurvey';
import { I18nProvider, LanguageSelect } from './i18n';
import './LanguageSelect.css';
import { session } from './solidSession';
import useCatalogDatasets from './useCatalogDatasets';
import { resolveCatalogRegistry } from './catalogRegistries';
import { CATALOG_SURFACES, resolveStatisticsConfig } from './statistics';
import {
  buildDefaultPrivateRegistry,
  createDataset,
  createDatasetSeries,
  loadRegistryConfig,
  SDP_CATALOG,
  LEGACY_SDP_CATALOG,
  parseDatasetFromDoc,
  updateDatasetSeries,
} from './solidCatalog';

const defaultIssuer = process.env.REACT_APP_OIDC_ISSUER || 'https://solid-community-server.tmdt.info';

const App = ({
  embedded = false,
  webIdOverride = null,
  datasetUrl = null,
  LoginScreenComponent = null,
  language = null,
  statisticsConfig,
} = {}) => {
  const [apiServiceForm, setApiServiceForm] = useState(null);
  const [showPublicData, setShowPublicData] = useState(() => new URLSearchParams(window.location.search).get('view') === 'public-data');
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [sessionLoggedIn, setIsLoggedIn] = useState(() => Boolean(session.info.isLoggedIn));
  const [sessionWebId, setWebId] = useState(() => session.info.webId || null);
  const isLoggedIn = embedded ? Boolean(webIdOverride) : sessionLoggedIn;
  const webId = embedded ? webIdOverride : sessionWebId;
  const registry = resolveCatalogRegistry();
  const scopeRef = useRef(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [headerUserInfo, setHeaderUserInfo] = useState(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const populateTriggerRef = useRef(false);

  const [showSemanticSearch, setShowSemanticSearch] = useState(() =>
    new URLSearchParams(window.location.search).get('view') === 'semantic-search');
  const [datasetOpenError, setDatasetOpenError] = useState('');
  const closeSemanticSearch = () => {
    setShowSemanticSearch(false);
    setDatasetOpenError('');
    if (window.history.state?.catalogSearch === window.location.href) {
      window.history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete('view');
      window.history.replaceState(window.history.state, '', url);
    }
  };
  useEffect(() => {
    const onPopState = () => setShowSemanticSearch(new URLSearchParams(window.location.search).get('view') === 'semantic-search');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
  const openSearchDataset = useCallback(async (url) => {
    setDatasetOpenError('');
    try {
      const scope = scopeRef.current;
      if (!safeResultUrl(url)) throw new Error('Invalid dataset URL.');
      if (!scope?.registry || scope.loading || !scope.datasets.some(dataset => dataset.datasetUrl === url)) {
        throw new Error('This dataset is not part of this registry.');
      }
      const doc = await getSolidDataset(url.split('#')[0], {
        // Use the shared session for authorized private links as well as public results.
        fetch: session.info.isLoggedIn
          ? (input, init) => session.fetch(input, { ...init, cache: 'no-store' })
          : (input, init) => fetch(input, { ...init, credentials: 'omit', cache: 'no-store' }),
      });
      const dataset = parseDatasetFromDoc(doc, url);
      if (!dataset) throw new Error('Dataset is no longer available.');
      if (scopeRef.current.registry !== scope.registry || scopeRef.current.webId !== scope.webId) return;
      window.history.pushState({ ...window.history.state, catalogDetail: window.location.href }, "");
      setSelectedDataset(dataset);
      setShowDetailModal(true);
    } catch (error) { setDatasetOpenError(error.message); }
  }, []);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [profileCheck, setProfileCheck] = useState(null);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [isPrivateRegistry, setIsPrivateRegistry] = useState(false);
  const [issuer, setIssuer] = useState(defaultIssuer);

  const {
    datasets,
    accessService,
    metadataSnapshot,
    loading: loadingDatasets,
    error: datasetLoadError,
    fetchDatasets,
    retry: retryDatasets,
  } = useCatalogDatasets(session, webId, isLoggedIn, registry.url);
  scopeRef.current = { registry: registry.url, webId, loading: loadingDatasets, datasets };
  useEffect(() => {
    setSelectedDataset(null);
    setShowDetailModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setDatasetOpenError('');
  }, [webId, registry.url]);
  useEffect(() => {
    const requested = datasetUrl || (!embedded && new URLSearchParams(window.location.search).get('dataset'));
    if (requested && isLoggedIn && !loadingDatasets) openSearchDataset(requested);
  }, [datasetUrl, embedded, isLoggedIn, loadingDatasets, registry.url, openSearchDataset]);
  const effectiveStatisticsConfig = resolveStatisticsConfig({
    embedded,
    statisticsConfig,
  });

  useEffect(() => {
    if (embedded) return;
    if (session.info.isLoggedIn && session.info.webId) {
      localStorage.setItem("solid-was-logged-in", "true");
      setIsLoggedIn(true);
      setWebId(session.info.webId);
    } else {
      setIsLoggedIn(false);
      setWebId(null);
    }
  }, [embedded]);

  const loginToSolid = async (nextIssuer) => {
    const resolvedIssuer = nextIssuer || issuer;
    if (!resolvedIssuer) return;
    localStorage.setItem("solid-oidc-issuer", resolvedIssuer);
    await session.login({
      oidcIssuer: resolvedIssuer,
      redirectUrl: window.location.href,
      clientName: "Semantic Data Catalog",
    });
  };

  useEffect(() => {
    let cancelled = false;
    let profilePhoto = '';
    if (!isLoggedIn) {
      setProfileCheck(null);
      setOnboardingRequired(false);
      setIsPrivateRegistry(false);
      return;
    }
    const checkProfileCompleteness = async () => {
      if (!isLoggedIn || !webId) return;
      setProfileCheck(null);
      let failed = false;
      try {
        const {
          getSolidDataset,
          getThing,
          getThingAll,
          getStringNoLocale,
          getUrl,
          getUrlAll,
        } = await import("@inrupt/solid-client");
        const { FOAF, VCARD, LDP } = await import("@inrupt/vocab-common-rdf");

        const profileDocUrl = webId.split("#")[0];
        const ds = await getSolidDataset(profileDocUrl, { fetch: session.fetch });
        if (cancelled) return;
        let me = getThing(ds, webId) || getThingAll(ds).find((t) => t.url === webId);
        if (!me) {
          setOnboardingRequired(true);
          return;
        }

        const name =
          getStringNoLocale(me, VCARD.fn) ||
          getStringNoLocale(me, FOAF.name) ||
          `${getStringNoLocale(me, VCARD.given_name) || ""} ${getStringNoLocale(me, VCARD.family_name) || ""}`.trim();
        const org = getStringNoLocale(me, VCARD.organization_name) || "";
        const role = getStringNoLocale(me, VCARD.role) || "";
        const inbox = getUrl(me, LDP.inbox) || "";

        const emailUris = getUrlAll(me, VCARD.hasEmail) || [];
        const collected = [];
        emailUris.forEach((uri) => {
          if (uri.startsWith("mailto:")) {
            collected.push(uri.replace(/^mailto:/, ""));
          } else {
            const emailThing = getThing(ds, uri);
            const mailto = emailThing ? getUrl(emailThing, VCARD.value) : "";
            if (mailto && mailto.startsWith("mailto:")) {
              collected.push(mailto.replace(/^mailto:/, ""));
            }
          }
        });
        const directEmails = (getUrlAll(me, VCARD.email) || [])
          .filter(Boolean)
          .map((uri) => uri.replace(/^mailto:/, ""));
        const allEmails = [...collected, ...directEmails].filter(Boolean);

        const missingBasics = !(name && org && role);
        const missingEmail = allEmails.length === 0;
        const missingInbox = !inbox;
        const profileCatalog = getUrl(me, SDP_CATALOG) || getUrl(me, LEGACY_SDP_CATALOG) || "";
        let missingCatalog = !profileCatalog;
        if (profileCatalog) {
          try {
            await getSolidDataset(profileCatalog.split("#")[0], { fetch: session.fetch });
            missingCatalog = false;
          } catch (error) {
            if ((error?.statusCode || error?.response?.status) !== 404) throw error;
            missingCatalog = true;
          }
        }

        let missingRegistry = false;
        const registryConfig = await loadRegistryConfig(webId, session.fetch, {
          onLoadError: (error) => { throw error; },
        });
        if (cancelled) return;
        setIsPrivateRegistry(registryConfig.mode === "private");
        const privateRegistry =
          registryConfig.privateRegistry || buildDefaultPrivateRegistry(webId);
        if (!privateRegistry) {
          missingRegistry = true;
        } else {
          try {
            await getSolidDataset(privateRegistry, { fetch: session.fetch });
          } catch (err) {
            const status = err?.statusCode || err?.response?.status;
            if (status === 404) missingRegistry = true;
            else throw err;
          }
        }

        if (!embedded) profilePhoto = await loadProfilePhoto(ds, me, session.fetch);
        if (cancelled && profilePhoto.startsWith('blob:')) URL.revokeObjectURL(profilePhoto);
        if (cancelled) return;
        setUserName(name);
        setUserEmail(allEmails[0] || "");
        setHeaderUserInfo({ loggedIn: true, webId, name, email: allEmails[0] || "", photo: profilePhoto });
        setOnboardingRequired(
          missingBasics || missingEmail || missingInbox || missingCatalog || missingRegistry
        );
      } catch (err) {
        if (cancelled) return;
        console.error("Profile completeness check failed:", err);
        failed = (err?.statusCode || err?.response?.status) !== 404;
        setOnboardingRequired(!failed);
      } finally {
        if (!cancelled) setProfileCheck({ webId, error: failed });
      }
    };

    checkProfileCompleteness();
    return () => {
      cancelled = true;
      if (profilePhoto.startsWith('blob:')) URL.revokeObjectURL(profilePhoto);
    };
  }, [isLoggedIn, webId, profileAttempt, embedded]);

  const handleRowClick = (dataset) => {
    if (!showDetailModal) window.history.pushState({ ...window.history.state, catalogDetail: window.location.href }, "");
    setSelectedDataset(dataset);
    setShowDetailModal(true);
  };

  const handleEditClick = (dataset) => {
    setSelectedDataset(dataset);
    setShowEditModal(true);
  };

  const handleDeleteClick = (dataset) => {
    setSelectedDataset(dataset);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    if (window.history.state?.catalogDetail === window.location.href) window.history.back();
    setShowNewDatasetModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setSelectedDataset(null);
  };

  const handleCloseNestedModal = () => {
    setShowDeleteModal(false);
    setShowEditModal(false);
  };

  const handleSemanticSearch = () => {
    setDatasetOpenError('');
    const url = new URL(window.location.href);
    url.searchParams.set('view', 'semantic-search');
    window.history.pushState({ ...window.history.state, catalogSearch: url.href }, '', url);
    setShowSemanticSearch(true);
  };

  const previousCatalogSnapshotRef = useRef(metadataSnapshot);
  useEffect(() => {
    // Refresh an open detail only when the listing itself is reloaded. A newly
    // fetched direct-link detail must not be replaced by older list metadata.
    if (previousCatalogSnapshotRef.current === metadataSnapshot) return;
    previousCatalogSnapshotRef.current = metadataSnapshot;
    if (!selectedDataset || (!showDetailModal && !showEditModal && !showDeleteModal)) return;

    const selectedKey = selectedDataset.datasetUrl || selectedDataset.identifier;
    if (!selectedKey) return;

    const updatedDataset = datasets.find((item) => {
      const itemKey = item.datasetUrl || item.identifier;
      return itemKey === selectedKey;
    });

    if (updatedDataset && updatedDataset !== selectedDataset) {
      setSelectedDataset(updatedDataset);
    }
  }, [metadataSnapshot, datasets, selectedDataset, showDetailModal, showEditModal, showDeleteModal]);

  const populateFromSeed = async ({ publisher, webId }) => {
    if (!session.info.isLoggedIn || !session.info.webId) return;
    setIsPopulating(true);
    try {
      const res = await fetch(`${process.env.PUBLIC_URL}/assets/populate/create-datasets-new-model.json`);
      if (!res.ok) throw new Error(`Seed file missing (${res.status})`);
      const allItems = await res.json();
      const filtered = (allItems || []).filter(
        (item) => item.publisher === publisher && item.webid === webId
      );
      const today = new Date().toISOString();
      const existingDatasetIds = new Set(
        datasets.filter((item) => item.datasetType !== "series").map((item) => item.identifier).filter(Boolean)
      );
      const existingSeriesById = new Map(
        datasets
          .filter((item) => item.datasetType === "series" && item.identifier)
          .map((item) => [item.identifier, item])
      );
      const datasetUrlById = new Map(
        datasets
          .filter((item) => item.datasetType !== "series" && item.identifier && item.datasetUrl)
          .map((item) => [item.identifier, item.datasetUrl])
      );
      const seriesQueue = new Map();

      for (const entry of filtered) {
        const identifier = entry.identifier || entry.id || "";
        const baseUrl = entry.base_url ? entry.base_url.replace(/\/$/, "") : "";
        const accessUrlDataset = baseUrl && entry.data_file
          ? `${baseUrl}/${entry.data_file}`
          : "";
        const accessUrlSemantic = baseUrl && entry.file_name
          ? `${baseUrl}/${entry.file_name}`
          : "";

        let datasetUrl = "";
        if (identifier && existingDatasetIds.has(identifier)) {
          datasetUrl = datasetUrlById.get(identifier) || "";
        } else {
          const created = await createDataset(session, {
            identifier: identifier || undefined,
            title: entry.title || "",
            description: entry.description || "",
            theme: entry.theme || "",
            issued: today,
            modified: today,
            publisher: entry.publisher || "",
            contact_point: entry.contact_point || "",
            access_url_dataset: accessUrlDataset,
            access_url_semantic_model: accessUrlSemantic,
            file_format: entry.file_format || "",
            is_public: true,
            webid: entry.webid || session.info.webId,
          });
          datasetUrl = created?.datasetUrl || "";
        }

        const seriesInfo = entry.series || {};
        const seriesIdentifier =
          entry.series_identifier || entry.series_id || seriesInfo.identifier || "";
        const seriesTitle = entry.series_title || seriesInfo.title || "";
        const seriesKey = seriesIdentifier || seriesTitle;

        if (seriesKey && datasetUrl) {
          const existing = seriesQueue.get(seriesKey) || {
            identifier: seriesIdentifier || undefined,
            title: seriesTitle || "Dataset Series",
            description: entry.series_description || seriesInfo.description || "",
            theme: entry.series_theme || seriesInfo.theme || "",
            issued: seriesInfo.issued || today,
            publisher: seriesInfo.publisher || entry.publisher || "",
            contact_point: seriesInfo.contact_point || entry.contact_point || "",
            webid: seriesInfo.webid || entry.webid || session.info.webId,
            members: [],
          };
          existing.members.push(datasetUrl);
          seriesQueue.set(seriesKey, existing);
        }
      }

      for (const seriesEntry of seriesQueue.values()) {
        const members = Array.from(new Set(seriesEntry.members));
        if (!members.length) continue;
        if (seriesEntry.identifier && existingSeriesById.has(seriesEntry.identifier)) {
          const existingSeries = existingSeriesById.get(seriesEntry.identifier);
          const mergedMembers = Array.from(
            new Set([...(existingSeries.seriesMembers || []), ...members])
          );
          await updateDatasetSeries(session, {
            seriesUrl: existingSeries.datasetUrl,
            identifier: existingSeries.identifier,
            title: existingSeries.title || seriesEntry.title,
            description: existingSeries.description || seriesEntry.description,
            theme: existingSeries.theme || seriesEntry.theme,
            issued: existingSeries.issued || seriesEntry.issued,
            publisher: existingSeries.publisher || seriesEntry.publisher,
            contact_point: existingSeries.contact_point || seriesEntry.contact_point,
            webid: existingSeries.webid || seriesEntry.webid,
            seriesMembers: mergedMembers,
          });
          continue;
        }
        await createDatasetSeries(session, {
          identifier: seriesEntry.identifier || undefined,
          title: seriesEntry.title,
          description: seriesEntry.description,
          theme: seriesEntry.theme,
          issued: seriesEntry.issued,
          publisher: seriesEntry.publisher,
          contact_point: seriesEntry.contact_point,
          webid: seriesEntry.webid,
          seriesMembers: members,
        });
      }

      await fetchDatasets();
    } catch (error) {
      console.error("Failed to populate catalog:", error);
    } finally {
      setIsPopulating(false);
    }
  };

  useEffect(() => {
    if (populateTriggerRef.current) return;
    if (!isLoggedIn || !session.info.webId) return;
    if (typeof window === "undefined") return;

    const path = window.location.pathname;
    const isFlorian = path.endsWith("/populate-florian");
    const isJakob = path.endsWith("/populate-jakob");
    if (!isFlorian && !isJakob) return;

    const publisher = isFlorian ? "Florian Hölken" : "Jakob Deich";
    const targetWebId = session.info.webId;
    if (!publisher || !targetWebId) return;

    populateTriggerRef.current = true;
    populateFromSeed({ publisher, webId: targetWebId });

    const cleanedPath = path.replace(/\/populate-(florian|jakob)$/, "");
    const cleanUrl = `${window.location.origin}${cleanedPath}${window.location.search}`;
    window.history.replaceState({}, "", cleanUrl);
  }, [isLoggedIn, webId]);

  const renderWithI18n = (content) => (
    <I18nProvider language={language}>{content}</I18nProvider>
  );

  const checkingProfile = isLoggedIn && profileCheck?.webId !== webId;
  const showLogin = !embedded && !isLoggedIn;
  if (!showLogin && !showSemanticSearch && !datasetUrl && (checkingProfile || loadingDatasets || isPopulating)) {
    return renderWithI18n(
      <CatalogLoadingState
        title="Semantic Data Catalog"
        description="Loading your personal catalog workspace …"
        embedded={embedded}
      />
    );
  }

  if (onboardingRequired && isLoggedIn) {
    return renderWithI18n(
      <OnboardingWizard
        webId={webId}
        embedded={embedded}
        onComplete={() => {
          setOnboardingRequired(false);
          setProfileCheck(null);
          setProfileAttempt((value) => value + 1);
          retryDatasets();
        }}
        onCancel={async () => {
          await session.logout({ logoutType: "app" });
          window.location.reload();
        }}
      />
    );
  }

  if (!showLogin && !showSemanticSearch && !datasetUrl && (datasetLoadError || !registry.url || profileCheck?.error)) {
    return renderWithI18n(
      <CatalogLoadingState
        title="Semantic Data Catalog"
        description="Some catalog sources could not be loaded. Please try again."
        embedded={embedded}
        error
        onRetry={() => {
          setProfileCheck(null);
          setProfileAttempt((value) => value + 1);
          retryDatasets();
        }}
      />
    );
  }

  if (!embedded && !isLoggedIn) {
    const ActiveLoginScreen = LoginScreenComponent;
    return renderWithI18n(
      <div className="standalone-login-page" data-standalone-shell>
        {ActiveLoginScreen && (
          <ActiveLoginScreen
            defaultIssuer={issuer}
            languageControl={<LanguageSelect className="language-select--login" />}
            onLogin={(nextIssuer) => {
              setIssuer(nextIssuer);
              loginToSolid(nextIssuer);
            }}
          />
        )}
        <FooterBar />
      </div>
    );
  }

  return renderWithI18n(
    <div data-standalone-shell={embedded ? undefined : true} className={`catalog-app catalog-app--${embedded ? "embedded" : "standalone"}`}>
      {!embedded && (
        <HeaderBar
          initialUserInfo={headerUserInfo}
          onLoginStatusChange={setIsLoggedIn}
          onWebIdChange={setWebId}
          onUserInfoChange={({ name, email }) => {
            setUserName(name);
            setUserEmail(email);
          }}
          languageControl={<LanguageSelect className="language-select--header" />}
        />
      )}

      {datasetOpenError && !showSemanticSearch && <p role="alert" className="semantic-search-error">{datasetOpenError}</p>}

        <CatalogWorkspace
          key={`catalog:${webId}:${registry.url}`}
          datasets={datasets}
          accessService={accessService}
          selectedDataset={showDetailModal ? selectedDataset : null}
          onSelect={handleRowClick}
          onCloseDetail={handleCloseModal}
          onSemanticSearch={registry.url ? handleSemanticSearch : undefined}
          detailSuspended={showEditModal || showDeleteModal || Boolean(apiServiceForm)}
          detail={showDetailModal ? selectedDataset?.datasetType === "service" ? <ApiServiceDetail service={selectedDataset} datasets={datasets} onClose={handleCloseModal} onEdit={() => setApiServiceForm(selectedDataset)} onChanged={fetchDatasets} /> : <DatasetDetailModal
              key={selectedDataset?.datasetUrl || selectedDataset?.identifier}
              presentation="inline"
              dataset={selectedDataset}
              onClose={handleCloseModal}
              sessionWebId={webId}
              accessService={accessService}
              userName={userName}
              userEmail={userEmail}
              datasets={datasets}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              statisticsConfig={effectiveStatisticsConfig}
            /> : null}
          actions={(t) => <>
                  <button
                    className="catalog-button catalog-button--primary"
                    onClick={() => setShowNewDatasetModal(true)}
                    disabled={!isLoggedIn}
                    title={t(isLoggedIn ? "Add a new dataset" : "Please log in to add datasets")}
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    {t("Add entry")}
                  </button>
                  <button className="catalog-button" disabled={!registry.url} onClick={() => setShowPublicData(true)}>{t("Query data")}</button>
                  {isPrivateRegistry && isLoggedIn && (
                    <button
                      className="catalog-button"
                      onClick={() => setShowRegistryModal(true)}
                      title={t("Manage private registry members")}
                    >
                      <i className="fa-solid fa-users mr-2"></i>
                      {t("Private Registry")}
                    </button>
                  )}
          </>}
        />

      {showSemanticSearch && registry.url && <SemanticSearchModal
        key={`search:${webId}:${registry.url}`}
        registryUrl={registry.url}
        onClose={closeSemanticSearch}
        suspended={showDetailModal || showEditModal || showDeleteModal}
        onOpenDataset={openSearchDataset}
        datasetOpenError={datasetOpenError}
      />}

      {showNewDatasetModal && (
        <CatalogEntryAddModal
          datasets={datasets}
          onClose={handleCloseModal}
          fetchDatasets={fetchDatasets}
        />
      )}
      {showDeleteModal && (
        <DatasetDeleteModal
          onClose={handleCloseNestedModal}
          onDeleted={handleCloseModal}
          dataset={selectedDataset}
          fetchDatasets={fetchDatasets}
        />
      )}
      {showRegistryModal && (
        <PrivateRegistryModal
          onClose={() => setShowRegistryModal(false)}
          onSaved={fetchDatasets}
        />
      )}
      {showEditModal && (
        <DatasetEditModal
          dataset={selectedDataset}
          onClose={handleCloseNestedModal}
          fetchDatasets={fetchDatasets}
        />
      )}
      {showPublicData && <PublicDataExplorer onClose={() => setShowPublicData(false)} onPublish={isLoggedIn ? input => {setShowPublicData(false);setApiServiceForm(input);} : undefined} />}
      {apiServiceForm && <ApiServiceModal initial={apiServiceForm} datasets={datasets} onSaved={fetchDatasets} onClose={() => {setApiServiceForm(null);handleCloseModal();}} />}
      <CatalogSurvey
        session={session}
        webId={webId}
        statisticsConfig={effectiveStatisticsConfig}
        catalogSurface={embedded ? CATALOG_SURFACES.embedded : CATALOG_SURFACES.standalone}
        authenticated={isLoggedIn && Boolean(webId)}
      />
      {!embedded && (
        <>
          <div className="footer-spacer"></div>
          <FooterBar />
        </>
      )}
    </div>
  );
};

export default App;

