import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import DatasetTable from './components/DatasetTable';
import DatasetAddModal from './components/DatasetAddModal';
import DatasetDetailModal from './components/DatasetDetailModal';
import DatasetDeleteModal from './components/DatasetDeleteModal';
import DatasetEditModal from './components/DatasetEditModal';
import DataspaceListModal from './components/DataspaceListModal';
import PodContentModal from './components/PodContentModal';
import axios from 'axios';

const App = () => {
  const [datasets, setDatasets] = useState([]);
  const [originalDatasets, setOriginalDatasets] = useState([]);
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDataspaceModal, setShowDataspaceModal] = useState(false);
  const [showPodContentModal, setShowPodContentModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [podUrls, setPodUrls] = useState([]);

  const fetchDatasets = async () => {
    try {
      const response = await axios.get('http://localhost:8000/datasets');
      setDatasets(response.data);
      setOriginalDatasets(response.data);
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleShowPodContent = () => {
    setPodUrls([
      "http://localhost:3000/testpod1s1/",
      "http://localhost:3001/testpod1s2/",
      "http://localhost:3002/testpod1s3/"
    ]);
    setShowPodContentModal(true);
  };

  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();
    if (searchValue === '') {
      setDatasets(originalDatasets);
    } else {
      const filteredDatasets = originalDatasets.filter(dataset =>
        dataset.name.toLowerCase().includes(searchValue)
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
    setShowDataspaceModal(false);
    setShowPodContentModal(false);
    setSelectedDataset(null);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-center mb-3">
          <div className="mr-3 mt-3">
            <img src="/assets/images/TMDT_Logo_small.png" alt="Logo" style={{ height: '60px' }} />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Roboto, sans-serif' }}>Semantic <span style={{ color: '#FFA500' }}>Data</span> Catalog</h1>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-5">
          <div className="d-flex">
            <button className="btn btn-light mr-2" onClick={() => setShowNewDatasetModal(true)}>
              <i className="fa-solid fa-plus mr-2"></i>
              Add Dataset
            </button>
            <button className="btn btn-light mr-2" onClick={handleShowPodContent}>
              <i className="fa-solid fa-database mr-2"></i>
              Show Pod Content
            </button>
            <button className="btn btn-light mr-2" onClick={() => setShowDataspaceModal(true)}>
              <i className="fa-solid fa-wifi mr-2"></i>
              Connected Dataspaces
            </button>
            <button className="btn btn-light mr-2" onClick={() => setShowNewDatasetModal(true)}>
              <i className="fa-solid fa-magnifying-glass mr-2"></i>
              Advanced Search
            </button>
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      <div className="table-container">
        <DatasetTable 
          datasets={datasets}
          onRowClick={handleRowClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
        />
      </div>

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
        />
      )}
      {showDeleteModal && (
        <DatasetDeleteModal 
          onClose={handleCloseModal}
        />
      )}
      {showEditModal && (
        <DatasetEditModal 
          dataset={selectedDataset} 
          onClose={handleCloseModal}
          fetchDatasets={fetchDatasets} 
        />
      )}
      {showDataspaceModal && (
        <DataspaceListModal onClose={handleCloseModal} />
      )}
      {showPodContentModal && (
        <PodContentModal onClose={handleCloseModal} podUrls={podUrls} />
      )}
    </div>
  );
};

export default App;
