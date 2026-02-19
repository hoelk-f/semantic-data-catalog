import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import DatasetTable from './components/DatasetTable';
import DatasetAddModal from './components/DatasetAddModal';
import DatasetDetailModal from './components/DatasetDetailModal';
import DatasetDeleteModal from './components/DatasetDeleteModal';
import DatasetEditModal from './components/DatasetEditModal';
import HeaderBar from './components/HeaderBar';
import FooterBar from './components/FooterBar';
import OnboardingWizard from './components/OnboardingWizard';
import PrivateRegistryModal from './components/PrivateRegistryModal';
import { session } from './solidSession';
import {
  buildDefaultPrivateRegistry,
  buildCatalogDownload,
  buildMergedCatalogDownload,
  cleanupCatalogSeriesLinks,
  createDataset,
  createDatasetSeries,
  loadAggregatedDatasets,
  loadRegistryConfig,
  resolveCatalogUrlFromWebId,
  updateDatasetSeries,
} from './solidCatalog';

const App = ({ embedded = false, webIdOverride = null } = {}) => {
  const [datasets, setDatasets] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  const [showRegistryModal, setShowRegistryModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [webId, setWebId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopulating, setIsPopulating] = useState(false);
  const accessCacheRef = useRef(new Map());
  const populateTriggerRef = useRef(false);

  const [activeTab, setActiveTab] = useState('dataset');
  const [onboardingRequired, setOnboardingRequired] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [isPrivateRegistry, setIsPrivateRegistry] = useState(false);

  const retryTimeoutRef = useRef(null);

  useEffect(() => {
    if (!embedded) return;
    if (webIdOverride) {
      setWebId(webIdOverride);
      setIsLoggedIn(true);
    } else {
      setWebId(null);
      setIsLoggedIn(false);
    }
  }, [embedded, webIdOverride]);

  const enrichAccessFlags = (data, currentWebId) =>
    data.map((dataset) => ({
      ...dataset,
      userHasAccess: dataset.is_public || dataset.webid === currentWebId,
    }));

  const fetchDatasets = async () => {
    try {
      const fetchOverride = session.info.isLoggedIn
        ? null
        : (typeof window !== "undefined" ? window.fetch.bind(window) : null);
      const { datasets: loadedDatasets, catalogs: loadedCatalogs } = await loadAggregatedDatasets(
        session,
        fetchOverride
      );
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      const enriched = enrichAccessFlags(loadedDatasets, webId);
      setDatasets(enriched);
      setCatalogs(loadedCatalogs || []);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      retryTimeoutRef.current = setTimeout(fetchDatasets, 8000);
    }
  };

  useEffect(() => {
    fetchDatasets();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (webId) {
      accessCacheRef.current.clear();
      fetchDatasets();
    }
  }, [webId]);

  useEffect(() => {
    if (!isLoggedIn || !webId) {
      setIsPrivateRegistry(false);
      return;
    }
    (async () => {
      try {
        const registryConfig = await loadRegistryConfig(webId, session.fetch);
        setIsPrivateRegistry(registryConfig.mode === "private");
      } catch {
        setIsPrivateRegistry(false);
      }
    })();
  }, [isLoggedIn, webId]);

  useEffect(() => {
    if (!isLoggedIn) {
      setCheckingProfile(false);
      setOnboardingRequired(false);
      return;
    }
    const checkProfileCompleteness = async () => {
      if (!isLoggedIn || !webId) return;
      setCheckingProfile(true);
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
        let missingCatalog = true;
        try {
          const catalogUrl = await resolveCatalogUrlFromWebId(webId, session.fetch);
          if (catalogUrl) {
            await getSolidDataset(catalogUrl.split("#")[0], { fetch: session.fetch });
            missingCatalog = false;
          }
        } catch {
          missingCatalog = true;
        }

        let missingRegistry = false;
        try {
          const registryConfig = await loadRegistryConfig(webId, session.fetch);
          const privateUrl =
            registryConfig.privateRegistry || buildDefaultPrivateRegistry(webId);
          if (!privateUrl) {
            missingRegistry = true;
          } else {
            try {
              await getSolidDataset(privateUrl, { fetch: session.fetch });
            } catch (err) {
              const status = err?.statusCode || err?.response?.status;
              if (status === 404) missingRegistry = true;
            }
          }
        } catch {
          missingRegistry = true;
        }

        setOnboardingRequired(
          missingBasics || missingEmail || missingInbox || missingCatalog || missingRegistry
        );
      } catch (err) {
        console.error("Profile completeness check failed:", err);
        setOnboardingRequired(true);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileCompleteness();
  }, [isLoggedIn, webId]);

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

  if (checkingProfile) {
    return (
      <div className="onboarding-wrap">
        <div className="onboarding-card">
          <div className="onboarding-title">Checking profile</div>
          <div className="onboarding-subtitle">
            We are verifying your Solid profile and catalog configuration.
          </div>
        </div>
      </div>
    );
  }

  if (onboardingRequired && isLoggedIn) {
    return (
      <OnboardingWizard
        webId={webId}
        onComplete={() => setOnboardingRequired(false)}
        onCancel={async () => {
          await session.logout({ logoutType: "app" });
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div>
      {!embedded && (
        <HeaderBar
          onLoginStatusChange={setIsLoggedIn}
          onWebIdChange={setWebId}
          onUserInfoChange={({ name, email }) => {
            setUserName(name);
            setUserEmail(email);
          }}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      )}

      {activeTab === 'dataset' && (
        <>
          <div className="catalog-shell">
            <div className="catalog-actions">
              <div className="catalog-actions-inner">
                <span className="catalog-title">All datasets & series</span>
                <div className="catalog-actions-right">
                  <button
                    className="btn btn-light mr-2"
                    onClick={() => setShowNewDatasetModal(true)}
                    disabled={!isLoggedIn}
                    title={isLoggedIn ? "Add a new dataset" : "Please log in to add datasets"}
                  >
                    <i className="fa-solid fa-plus mr-2"></i>
                    Add Dataset (Series)
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
                  <button
                    type="button"
                    className="btn btn-light mr-2"
                    disabled={!isLoggedIn}
                    onClick={async () => {
                      if (!window.confirm("Cleanup catalog series links now?")) return;
                      try {
                        await cleanupCatalogSeriesLinks(session);
                        await fetchDatasets();
                      } catch (err) {
                        console.error("Cleanup failed:", err);
                        alert("Cleanup failed. See console for details.");
                      }
                    }}
                    title={
                      isLoggedIn
                        ? "Normalize series links and catalog entries"
                        : "Please log in to run cleanup"
                    }
                  >
                    <i className="fa-solid fa-broom mr-2"></i>
                    Cleanup Catalog
                  </button>
                  <SearchBar onSearch={handleSearch} />
                </div>
              </div>
            </div>

            <div className="catalog-table">
              <DatasetTable
                datasets={datasets}
                onRowClick={handleRowClick}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
                sessionWebId={webId}
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
        />
      )}
      {showDeleteModal && (
        <DatasetDeleteModal
          onClose={handleCloseModal}
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
          onClose={handleCloseModal}
          fetchDatasets={fetchDatasets}
        />
      )}
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


