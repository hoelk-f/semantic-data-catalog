import React, { useState, useEffect, useRef } from 'react';
import SearchBar from './components/SearchBar';
import DatasetTable from './components/DatasetTable';
import DatasetAddModal from './components/DatasetAddModal';
import DatasetDetailModal from './components/DatasetDetailModal';
import DatasetDeleteModal from './components/DatasetDeleteModal';
import DatasetEditModal from './components/DatasetEditModal';
import HeaderBar from './components/HeaderBar';
import FooterBar from './components/FooterBar';
import Pagination from './components/Pagination';
import axios from 'axios';
import { session } from './solidSession';

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

  const [activeTab, setActiveTab] = useState('dataset');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const retryTimeoutRef = useRef(null);
  const pageSize = 10;

  const checkAccess = async (url) => {
    if (!url || !session.info.isLoggedIn) return false;
    try {
      const res = await session.fetch(url, { method: "HEAD" });
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

  const fetchTotalPages = async () => {
    try {
      const response = await axios.get('/api/datasets/count');
      const totalDatasets = Number(response.data.count) || 0;
      const pages = Math.ceil(totalDatasets / pageSize);
      const safePages = Math.max(pages, 1);
      setTotalPages(safePages);
      return { pages: safePages, totalCount: totalDatasets };
    } catch (error) {
      console.error("Error fetching dataset count:", error);
      setTotalPages(1);
      return { pages: 1, totalCount: 0 };
    }
  };

  const fetchDatasets = async (page = currentPage) => {
    try {
      const { pages: safeTotalPages, totalCount } = await fetchTotalPages();
      let safePage = Math.max(1, Math.min(page, safeTotalPages));
      const skip = (safePage - 1) * pageSize;
      const response = await axios.get(`/api/datasets?skip=${skip}&limit=${pageSize}`);
      let data = response.data;

      if (totalCount > 0 && data.length === 0) {
        if (safePage > 1) {
          safePage = Math.max(1, safeTotalPages);
          const fallbackSkip = (safePage - 1) * pageSize;
          const fallbackResponse = await axios.get(`/api/datasets?skip=${fallbackSkip}&limit=${pageSize}`);
          data = fallbackResponse.data;
        } else {
          if (!retryTimeoutRef.current) {
            retryTimeoutRef.current = setTimeout(() => {
              retryTimeoutRef.current = null;
              fetchDatasets(1);
            }, 750);
          }
          return;
        }
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      setCurrentPage(safePage);
      const enriched = await enrichAccessFlags(data, webId);
      setDatasets(enriched);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  useEffect(() => {
    fetchDatasets(1);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (webId) {
      fetchDatasets(currentPage);
    }
  }, [webId]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchDatasets(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      fetchDatasets(currentPage - 1);
    }
  };

  const handleSearch = (searchValue) => {
    if (!searchValue) {
      fetchDatasets(currentPage);
    } else {
      const filteredDatasets = datasets.filter(dataset =>
        dataset.title?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setDatasets(filteredDatasets);
    }
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
              <a
                href="/api/export/catalog"
                download="semantic_data_catalog.ttl"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light mr-2"
              >
                <i className="fa-solid fa-download mr-2"></i>
                Download Catalog
              </a>
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
            />
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(direction) => {
              direction === "next" ? handleNextPage() : handlePreviousPage();
            }}
          />
        </>
      )}

      {(activeTab === 'collection' || activeTab === 'services') && (
        <div className="text-center mt-5">
          <h4><i className="fa-solid fa-hammer mr-2"></i>Under Construction</h4>
          <p>This section is not yet available.</p>
        </div>
      )}

      {showNewDatasetModal && (
        <DatasetAddModal
          onClose={handleCloseModal}
          fetchDatasets={fetchDatasets}
          fetchTotalPages={fetchTotalPages}
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
          datasetId={selectedDataset ? selectedDataset.identifier : null}
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
