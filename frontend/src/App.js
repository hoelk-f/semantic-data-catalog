import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import DatasetTable from './components/DatasetTable';
import DatasetAddModal from './components/DatasetAddModal';
import DatasetDetailModal from './components/DatasetDetailModal';
import DatasetDeleteModal from './components/DatasetDeleteModal';
import DatasetEditModal from './components/DatasetEditModal';
import HeaderBar from './components/HeaderBar';
import FooterBar from './components/FooterBar';
import { session } from './solidSession';
import { buildCatalogDownload, createDataset, loadAggregatedDatasets } from './solidCatalog';

const App = () => {
  const [datasets, setDatasets] = useState([]);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [webId, setWebId] = useState(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [showOntologyDropdown, setShowOntologyDropdown] = useState(false);
  const toggleOntologyDropdown = () => setShowOntologyDropdown(prev => !prev);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPopulating, setIsPopulating] = useState(false);

  const [activeTab, setActiveTab] = useState('dataset');

  const retryTimeoutRef = useRef(null);

  const checkAccess = async (url) => {
    if (!url || !session.info.isLoggedIn) return false;
    try {
      const res = await session.fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  };

  const enrichAccessFlags = async (data, currentWebId) => {
    if (!session.info.isLoggedIn || !currentWebId) {
      return data.map((dataset) => ({
        ...dataset,
        userHasAccess: dataset.is_public || dataset.webid === currentWebId,
      }));
    }

    return Promise.all(
      data.map(async (dataset) => {
        if (dataset.is_public || dataset.webid === currentWebId) {
          return { ...dataset, userHasAccess: true };
        }

        const datasetAccess = await checkAccess(dataset.access_url_dataset);
        let modelAccess = datasetAccess;
        if (!modelAccess) {
          modelAccess = await checkAccess(dataset.access_url_semantic_model);
        }

        return {
          ...dataset,
          userHasAccess: Boolean(datasetAccess || modelAccess),
        };
      })
    );
  };

  const fetchDatasets = async () => {
    try {
      const fetchOverride = session.info.isLoggedIn
        ? null
        : (typeof window !== "undefined" ? window.fetch.bind(window) : null);
      const { datasets: loadedDatasets } = await loadAggregatedDatasets(
        session,
        fetchOverride
      );
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      const enriched = await enrichAccessFlags(loadedDatasets, webId);
      setDatasets(enriched);
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
      fetchDatasets();
    }
  }, [webId]);

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
      const res = await fetch(`${process.env.PUBLIC_URL}/assets/populate/create-datasets.json`);
      if (!res.ok) throw new Error(`Seed file missing (${res.status})`);
      const allItems = await res.json();
      const filtered = (allItems || []).filter(
        (item) => item.publisher === publisher && item.webid === webId
      );
      const today = new Date().toISOString();
      const existingIds = new Set(datasets.map((item) => item.identifier).filter(Boolean));

      for (const entry of filtered) {
        const identifier = entry.identifier || entry.id || "";
        if (identifier && existingIds.has(identifier)) continue;
        const baseUrl = entry.base_url ? entry.base_url.replace(/\/$/, "") : "";
        const accessUrlDataset = baseUrl && entry.data_file
          ? `${baseUrl}/${entry.data_file}`
          : "";
        const accessUrlSemantic = baseUrl && entry.file_name
          ? `${baseUrl}/${entry.file_name}`
          : "";

        await createDataset(session, {
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
      }

      await fetchDatasets();
    } catch (error) {
      console.error("Failed to populate catalog:", error);
    } finally {
      setIsPopulating(false);
    }
  };


  return (
    <div>
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

      {activeTab === 'dataset' && (
        <>
          <div className="d-flex justify-content-end mt-4">
            <div className="d-flex align-items-center">
              <button
                className="btn btn-light mr-2"
                onClick={() => setShowNewDatasetModal(true)}
                disabled={!isLoggedIn}
                title={isLoggedIn ? "Add a new dataset" : "Please log in to add datasets"}
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Add Dataset
              </button>
              {isLoggedIn &&
                userName === "Florian Hölken" &&
                webId === "https://tmdt-solid-community-server.de/solidtestpod/profile/card#me" && (
                  <button
                    className="btn btn-light mr-2"
                    onClick={() =>
                      populateFromSeed({
                        publisher: "Florian Hölken",
                        webId: "https://tmdt-solid-community-server.de/solidtestpod/profile/card#me",
                      })
                    }
                    disabled={isPopulating}
                    title="Populate catalog from seed data"
                  >
                    <i className="fa-solid fa-seedling mr-2"></i>
                    {isPopulating ? "Populating..." : "Populate Catalog"}
                  </button>
                )}
              {isLoggedIn &&
                userName === "Jakob Deich" &&
                webId === "https://tmdt-solid-community-server.de/dace/profile/card#me" && (
                  <button
                    className="btn btn-light mr-2"
                    onClick={() =>
                      populateFromSeed({
                        publisher: "Jakob Deich",
                        webId: "https://tmdt-solid-community-server.de/dace/profile/card#me",
                      })
                    }
                    disabled={isPopulating}
                    title="Populate catalog from seed data"
                  >
                    <i className="fa-solid fa-seedling mr-2"></i>
                    {isPopulating ? "Populating..." : "Populate Catalog"}
                  </button>
                )}
              <a
                href="/fuseki/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light mr-2"
              >
                <i className="fa-solid fa-magnifying-glass mr-2"></i>
                Semantic Search
              </a>
              <div className="position-relative mr-2">
                <button
                  className="btn btn-light"
                  onClick={toggleOntologyDropdown}
                >
                  <i className="fa-solid fa-book mr-2"></i>Download Ontologies
                  <i className="fa-solid fa-caret-down ml-2"></i>
                </button>

                {showOntologyDropdown && (
                  <div className="dropdown-menu show dropdown-visible">
                    <a className="dropdown-item" href={process.env.PUBLIC_URL + '/assets/ontologies/dcat3.ttl'} download>
                      DCAT3 – Data Catalog Vocabulary 3.0
                    </a>
                    <a className="dropdown-item" href={process.env.PUBLIC_URL + '/assets/ontologies/sdo.ttl'} download>
                      SDO – Schema.org Core Terms
                    </a>
                    <a className="dropdown-item" href={process.env.PUBLIC_URL + '/assets/ontologies/sosa.ttl'} download>
                      SOSA – Sensor, Observation, Sample, and Actuator
                    </a>
                    <a className="dropdown-item" href={process.env.PUBLIC_URL + '/assets/ontologies/vcslam.ttl'} download>
                      VCSLAM – Vocabulary for Contextualized Semantic Linking
                    </a>
                  </div>
                )}
              </div>
              <button
                type="button"
                className="btn btn-light mr-2"
                onClick={() => {
                  const turtle = buildCatalogDownload(datasets);
                  const blob = new Blob([turtle], { type: "text/turtle" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = "semantic_data_catalog.ttl";
                  link.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <i className="fa-solid fa-download mr-2"></i>
                Download Catalog
              </button>
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>

          <div className="table-container mt-3">
            <DatasetTable
              datasets={datasets}
              onRowClick={handleRowClick}
              onEditClick={handleEditClick}
              onDeleteClick={handleDeleteClick}
              sessionWebId={webId}
              searchQuery={searchQuery}
            />
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
        />
      )}
      {showDeleteModal && (
        <DatasetDeleteModal
          onClose={handleCloseModal}
          dataset={selectedDataset}
          fetchDatasets={fetchDatasets}
        />
      )}
      {showEditModal && (
        <DatasetEditModal
          dataset={selectedDataset}
          onClose={handleCloseModal}
          fetchDatasets={fetchDatasets}
        />
      )}
      <div className="footer-spacer"></div>
      <FooterBar />
    </div>
  );
};

export default App;
