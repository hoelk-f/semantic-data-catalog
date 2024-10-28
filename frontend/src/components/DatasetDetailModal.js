import React, { useState } from 'react';
import ReactFlow, { MiniMap, Controls, Background } from 'react-flow-renderer';
import DatasetRequestModal from './DatasetRequestModal';

const DatasetDetailModal = ({ dataset, onClose }) => {
  const [showRequestModal, setShowRequestModal] = useState(false);

  if (!dataset) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  // Semantic model nodes based on dataset details
  const nodes = [
    { id: '1', data: { label: `Dataset ID: ${dataset.id}` }, position: { x: 150, y: 0 } },
    { id: '2', data: { label: `Owner: ${dataset.owner.name}` }, position: { x: -50, y: 100 } },
    { id: '3', data: { label: `Contact: ${dataset.contact.name}` }, position: { x: 250, y: 100 } },
    { id: '4', data: { label: `Description: ${dataset.description}` }, position: { x: 150, y: 200 } },
    { id: '5', data: { label: `Is Public: ${dataset.is_public ? 'Yes' : 'No'}` }, position: { x: -50, y: 300 } },
    { id: '6', data: { label: `Creation Date: ${formatDate(dataset.creation_date)}` }, position: { x: 250, y: 300 } },
    { id: '7', data: { label: `Last Modified: ${formatDate(dataset.last_modified_date)}` }, position: { x: 150, y: 400 } },
    { id: '8', data: { label: `File Path: ${dataset.file_path || 'N/A'}` }, position: { x: 150, y: 500 } },
  ];

  // Define edges to connect nodes
  const edges = [
    { id: 'e1-2', source: '1', target: '2', label: 'has owner' },
    { id: 'e1-3', source: '1', target: '3', label: 'has contact' },
    { id: 'e1-4', source: '1', target: '4', label: 'describes' },
    { id: 'e1-5', source: '1', target: '5', label: 'visibility' },
    { id: 'e1-6', source: '1', target: '6', label: 'created on' },
    { id: 'e1-7', source: '1', target: '7', label: 'last modified' },
    { id: 'e1-8', source: '1', target: '8', label: 'located at' }
  ];

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-custom-width" role="document">
        <div className="modal-content">
          <div className="modal-header d-flex align-items-center justify-content-between">
            <h5 className="modal-title">Dataset Details</h5>
            <div className="d-flex align-items-center">
              {!dataset.is_public && (
                <button
                  className="btn btn-primary mr-2"
                  onClick={() => setShowRequestModal(true)}
                >
                  Request Dataset
                </button>
              )}
              <button type="button" className="close" onClick={onClose} aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>

          <div className="modal-body d-flex">
            <div style={{ width: '60%' }}>
              <ul className="list-group">
                <li className="list-group-item"><strong>ID:</strong> {dataset.id}</li>
                <li className="list-group-item"><strong>Name:</strong> {dataset.name}</li>
                <li className="list-group-item"><strong>Description:</strong> {dataset.description}</li>
                <li className="list-group-item"><strong>Creation Date:</strong> {formatDate(dataset.creation_date)}</li>
                <li className="list-group-item"><strong>Last Modified Date:</strong> {formatDate(dataset.last_modified_date)}</li>
                <li className="list-group-item"><strong>Owner:</strong> {dataset.owner.name}</li>
                <li className="list-group-item"><strong>Contact:</strong> {dataset.contact.name}</li>
                <li className="list-group-item">
                  <strong>Is Public:</strong> {dataset.is_public ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <i className="fa-solid fa-xmark"></i>
                  )}
                </li>
                <li className="list-group-item"><strong>File Path:</strong> {dataset.file_path}</li>
              </ul>
            </div>

            <div style={{ width: '40%'}} className="d-flex align-items-center justify-content-center">
              <ReactFlow nodes={nodes} edges={edges} style={{ width: '100%', height: '100%' }}>
                <Controls />
                <Background />
              </ReactFlow>
            </div>
          </div>

          <div className="modal-footer custom-footer">
            <h5 className="mb-2">Similar Datasets</h5>
            <p className="text-muted mb-0">No similar datasets found.</p>
          </div>
        </div>
      </div>

      {showRequestModal && (
        <DatasetRequestModal
          dataset={dataset}
          onClose={() => setShowRequestModal(false)}
        />
      )}
    </div>
  );
};

export default DatasetDetailModal;
