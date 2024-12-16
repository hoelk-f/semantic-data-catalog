import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DataspaceListModal = ({ onClose }) => {
  const [dataspaces, setDataspaces] = useState([]);

  useEffect(() => {
    const fetchDataspacesWithPods = async () => {
      try {
        const response = await axios.get("http://localhost:8000/dataspaces");
        const datas = await Promise.all(
          response.data.map(async (dataspace) => {
            try {
              const podsResponse = await axios.get(`http://localhost:8000/dataspaces/${dataspace.id}/pods`);
              return { ...dataspace, pods: podsResponse.data };
            } catch (err) {
              console.error(`Error fetching pods for dataspace ${dataspace.id}:`, err);
              return { ...dataspace, pods: [] };
            }
          })
        );
        setDataspaces(datas);
      } catch (err) {
        console.error("Error fetching dataspaces or pods:", err);
      }
    };

    fetchDataspacesWithPods();
  }, []);

  const connectionIndicator = (isConnected) => (
    <span
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: isConnected ? 'green' : 'red',
        marginRight: '8px',
      }}
    ></span>
  );

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Dataspaces</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            {dataspaces.length > 0 ? (
              <ul className="list-group">
                {dataspaces.map((dataspace) => (
                  <li key={dataspace.id} className="list-group-item">
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        {connectionIndicator(true)}
                        <strong>{dataspace.name}</strong>
                      </div>
                      <a href={dataspace.link} target="_blank" rel="noopener noreferrer" className="btn btn-link">
                        {dataspace.link}
                      </a>
                    </div>
                    {dataspace.pods && dataspace.pods.length > 0 ? (
                      <ul className="list-group mt-2">
                        {dataspace.pods.map((pod) => (
                          <li key={pod.id} className="list-group-item border-0 d-flex justify-content-between align-items-center pl-4">
                            <div className="d-flex align-items-center">
                              {connectionIndicator(true)}
                              <span>{pod.name}</span>
                            </div>
                            <span className="text-muted">{`${dataspace.link}/${pod.path}`}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted mt-2">No pods available for this dataspace.</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No dataspaces available.</p>
            )}
          </div>
          <div className="modal-footer d-flex justify-content-start">
            <div className="d-flex align-items-center mr-3">
              {connectionIndicator(true)}
              <span>Connection OK</span>
            </div>
            <div className="d-flex align-items-center">
              {connectionIndicator(false)}
              <span>Connection Not OK</span>
            </div>
            <button type="button" className="btn btn-secondary ml-auto" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataspaceListModal;
