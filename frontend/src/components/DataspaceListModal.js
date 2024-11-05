// DataspaceListModal.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DataspaceListModal = ({ onClose }) => {
  const [dataspaces, setDataspaces] = useState([]);

  useEffect(() => {
    const fetchDataspaces = async () => {
      try {
        const response = await axios.get('http://localhost:8000/dataspaces');
        setDataspaces(response.data);
      } catch (error) {
        console.error("Error fetching dataspaces:", error);
      }
    };

    fetchDataspaces();
  }, []);

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Connected Dataspaces</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {dataspaces.length > 0 ? (
              <ul className="list-group">
                {dataspaces.map(dataspace => (
                  <li key={dataspace.id} className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <span className="status-indicator mr-2"></span>
                      <strong>{dataspace.name}</strong>
                    </div>
                    <a href={dataspace.link} target="_blank" rel="noopener noreferrer" className="btn btn-link">
                      {dataspace.link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No dataspaces available.</p>
            )}
          </div>
          <div className="modal-footer">
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataspaceListModal;
