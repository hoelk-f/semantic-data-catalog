import React, { useState, useCallback, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import DatasetTable from './components/DatasetTable';
import DatasetAddModal from './components/DatasetAddModal';
import DatasetDetailModal from './components/DatasetDetailModal';
import SemanticSearch from './components/SemanticSearch';
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
import { CATALOG_SURFACES, resolveStatisticsConfig } from './statistics';
import {
  buildDefaultPrivateRegistry,
  buildCatalogDownload,
  buildMergedCatalogDownload,
  createDataset,
  createDatasetSeries,
  loadRegistryConfig,
  SDP_CATALOG,
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
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [sessionLoggedIn, setIsLoggedIn] = useState(() => Boolean(session.info.isLoggedIn));
  const [sessionWebId, setWebId] = useState(() => session.info.webId || null);
  const isLoggedIn = embedded ? Boolean(webIdOverride) : sessionLoggedIn;
  const webId = embedded ? webIdOverride : sessionWebId;
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [headerUserInfo, setHeaderUserInfo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopulating, setIsPopulating] = useState(false);
  const populateTriggerRef = useRef(false);

  const [activeTab, setActiveTabState] = useState(() =>
    !embedded && new URLSearchParams(window.location.search).get('view') === 'semantic-search' ? 'semantic-search' : 'dataset');
  const [datasetOpenError, setDatasetOpenError] = useState('');
  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    if (!embedded) {
      const url = new URL(window.location.href);
      if (tab === 'semantic-search') url.searchParams.set('view', tab);
      else url.searchParams.delete('view');
      window.history.pushState({}, '', url);
    }
  };
  useEffect(() => {
    if (embedded) return undefined;
    const onPopState = () => setActiveTabState(new URLSearchParams(window.location.search).get('view') === 'semantic-search' ? 'semantic-search' : 'dataset');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [embedded]);
  const openSearchDataset = useCallback(async (url) => {
    setDatasetOpenError('');
    try {
      if (!safeResultUrl(url)) throw new Error('Invalid dataset URL.');
      const doc = await getSolidDataset(url.split('#')[0], {
        fetch: (input, init) => fetch(input, { ...init, credentials: 'omit', cache: 'no-store' }),
      });
      const dataset = parseDatasetFromDoc(doc, url);
      if (!dataset) throw new Error('Dataset is no longer available.');
      setSelectedDataset(dataset);
      setShowDetailModal(true);
    } catch (error) { setDatasetOpenError(error.message); }
  }, []);
  useEffect(() => {
    const requested = datasetUrl || (!embedded && new URLSearchParams(window.location.search).get('dataset'));
    if (requested && isLoggedIn) openSearchDataset(requested);
    // This loads the requested document independently of the profile's registry selection.
  }, [datasetUrl, embedded, isLoggedIn, openSearchDataset]);
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [profileCheck, setProfileCheck] = useState(null);
  const [profileAttempt, setProfileAttempt] = useState(0);
  const [isPrivateRegistry, setIsPrivateRegistry] = useState(false);
  const [issuer, setIssuer] = useState(defaultIssuer);

  const {
    datasets,
    catalogs,
    loading: loadingDatasets,
    error: datasetLoadError,
    fetchDatasets,
    retry: retryDatasets,
  } = useCatalogDatasets(session, webId, isLoggedIn);
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
        const profileCatalog = getUrl(me, SDP_CATALOG) || "";
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

  const handleSearch = (searchValue) => {
    setSearchQuery(searchValue || "");
  };

  const handleRowClick = (dataset) => {
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
    setShowNewDatasetModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setShowEditModal(false);
    setShowAddDatasetModal(false);
    setSelectedDataset(null);
  };

  const handleCloseNestedModal = () => {
    setShowDeleteModal(false);
    setShowEditModal(false);
  };

  useEffect(() => {
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
  }, [datasets, selectedDataset, showDetailModal, showEditModal, showDeleteModal]);

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
  if (!showLogin && activeTab !== 'semantic-search' && !datasetUrl && (checkingProfile || loadingDatasets || isPopulating)) {
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

  if (!showLogin && activeTab !== 'semantic-search' && !datasetUrl && (datasetLoadError || profileCheck?.error)) {
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
      <div className="standalone-login-page">
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
      </div>
    );
  }

  return renderWithI18n(
    <div>
      {!embedded && (
        <HeaderBar
          initialUserInfo={headerUserInfo}
          onLoginStatusChange={setIsLoggedIn}
          onWebIdChange={setWebId}
          onUserInfoChange={({ name, email }) => {
            setUserName(name);
            setUserEmail(email);
          }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          languageControl={<LanguageSelect className="language-select--header" />}
        />
      )}

      {datasetOpenError && <p role="alert" className="semantic-search-error">{datasetOpenError}</p>}
      {activeTab === 'semantic-search' && <SemanticSearch onOpenDataset={openSearchDataset} />}
      {activeTab === 'dataset' && (
        <>
          <div className="catalog-shell">
            <div className="catalog-actions">
              <div className="catalog-actions-inner">
                <span className="catalog-title">All datasets & dataset series</span>
                <div className="catalog-actions-right">
                  <button
                    className="btn btn-light mr-2"
                    onClick={() => setShowNewDatasetModal(true)}
                    disabled={!isLoggedIn}
                    title={isLoggedIn ? "Add a new dataset" : "Please log in to add datasets"}
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    Add Dataset
                  </button>
                  {isPrivateRegistry && isLoggedIn && (
                    <button
                      className="btn btn-light mr-2"
                      onClick={() => setShowRegistryModal(true)}
                      title="Manage private registry members"
                    >
                      <i className="fa-solid fa-users mr-2"></i>
                      Private Registry
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-light mr-2"
                    onClick={async () => {
                      try {
                        const turtle = await buildMergedCatalogDownload(session, {
                          catalogs,
                          datasets,
                        });
                        const blob = new Blob([turtle], { type: "text/turtle" });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.href = url;
                        link.download = "semantic_data_catalog.ttl";
                        link.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        console.error("Failed to build merged catalog download:", err);
                        alert("Failed to build merged catalog download.");
                      }
                    }}
                  >
                    <i className="fa-solid fa-download mr-2"></i>
                    Download Catalog
                  </button>
                  <SearchBar onSearch={handleSearch} />
                </div>
              </div>
            </div>

            <div className="catalog-table">
              <DatasetTable
                datasets={datasets}
                onRowClick={handleRowClick}
                searchQuery={searchQuery}
              />
            </div>
          </div>

        </>
      )}

      {activeTab === 'collection' && (
        <div className="text-center mt-5">
          <h4><i className="fa-solid fa-hammer mr-2"></i>Under Construction</h4>
          <p>This section is not yet available.</p>
        </div>
      )}

      {showNewDatasetModal && (
        <DatasetAddModal
          onClose={handleCloseModal}
          fetchDatasets={fetchDatasets}
        />
      )}
      {showDetailModal && (
        <DatasetDetailModal
          dataset={selectedDataset}
          onClose={handleCloseModal}
          sessionWebId={webId}
          userName={userName}
          userEmail={userEmail}
          datasets={datasets}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          statisticsConfig={effectiveStatisticsConfig}
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

