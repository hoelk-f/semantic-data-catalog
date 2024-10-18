import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import DatasetTable from './components/DatasetTable';
import DatasetAddModal from './components/DatasetAddModal';
import DatasetDetailModal from './components/DatasetDetailModal';
import DatasetDeleteModal from './components/DatasetDeleteModal';
import DatasetEditModal from './components/DatasetEditModal';
import axios from 'axios';

const App = () => {
  const [datasets, setDatasets] = useState([]); // Gefilterte Daten
  const [originalDatasets, setOriginalDatasets] = useState([]); // Originaldaten
  const [showNewDatasetModal, setShowNewDatasetModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const fetchDatasets = async () => {
    try {
      const response = await axios.get('http://localhost:8000/datasets');
      setDatasets(response.data);
      setOriginalDatasets(response.data); // Originaldaten speichern
    } catch (error) {
      console.error("Error fetching datasets:", error);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleSearch = (event) => {
    const searchValue = event.target.value.toLowerCase();

    if (searchValue === '') {
      // Wenn die Suchleiste leer ist, setze die Daten auf die Originaldaten zurück
      setDatasets(originalDatasets);
    } else {
      // Filtere die Originaldaten basierend auf der Suchanfrage
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
    setSelectedDataset(null);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="d-flex align-items-center justify-content-center mb-3">
          <div className="mr-3">
            <img src="/assets/images/TMDT_Logo_small.png" alt="Logo" style={{ height: '60px' }} />
          </div>

          <div>
            <h1>(Semantic) Data Catalog</h1>
          </div>
        </div>

        <div className="d-flex justify-content-end mt-5">
          <div className="d-flex">
            <button className="btn btn-light mr-2" onClick={() => setShowNewDatasetModal(true)}>
              Add Dataset
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
    </div>
  );
};

export default App;
