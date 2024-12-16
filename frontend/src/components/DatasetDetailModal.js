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

  const nodes = [
    { id: '1', data: { label: `Dataset ID: ${dataset.id}` }, position: { x: 150, y: 0 } },
    { id: '2', data: { label: `Publisher: ${dataset.publisher.name}` }, position: { x: -50, y: 100 } },
    { id: '3', data: { label: `Contact: ${dataset.contact_point.name}` }, position: { x: 250, y: 100 } },
    { id: '4', data: { label: `Description: ${dataset.description}` }, position: { x: 150, y: 200 } },
    { id: '5', data: { label: `Public: ${dataset.is_public ? 'Yes' : 'No'}` }, position: { x: -50, y: 300 } },
    { id: '6', data: { label: `Issued: ${formatDate(dataset.issued)}` }, position: { x: 250, y: 300 } },
    { id: '7', data: { label: `Modified: ${formatDate(dataset.modified)}` }, position: { x: 150, y: 400 } },
    { id: '8', data: { label: `Theme: ${dataset.theme || 'N/A'}` }, position: { x: -50, y: 500 } },
    { id: '9', data: { label: `Access URL: ${dataset.access_url || 'N/A'}` }, position: { x: 250, y: 500 } },
    { id: '10', data: { label: `Download URL: ${dataset.download_url || 'N/A'}` }, position: { x: 150, y: 600 } },
  ];

  const edges = [
    { id: 'e1-2', source: '1', target: '2', label: 'has publisher' },
    { id: 'e1-3', source: '1', target: '3', label: 'has contact' },
    { id: 'e1-4', source: '1', target: '4', label: 'describes' },
    { id: 'e1-5', source: '1', target: '5', label: 'visibility' },
    { id: 'e1-6', source: '1', target: '6', label: 'issued on' },
    { id: 'e1-7', source: '1', target: '7', label: 'last modified' },
    { id: 'e1-8', source: '1', target: '8', label: 'themed' },
    { id: 'e1-9', source: '1', target: '9', label: 'access URL' },
    { id: 'e1-10', source: '1', target: '10', label: 'download URL' },
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
                <li className="list-group-item"><strong>Title:</strong> {dataset.title}</li>
                <li className="list-group-item"><strong>Description:</strong> {dataset.description}</li>
                <li className="list-group-item"><strong>Identifier:</strong> {dataset.identifier}</li>
                <li className="list-group-item"><strong>Issued Date:</strong> {formatDate(dataset.issued)}</li>
                <li className="list-group-item"><strong>Modified Date:</strong> {formatDate(dataset.modified)}</li>
                <li className="list-group-item"><strong>Publisher:</strong> {dataset.publisher.name}</li>
                <li className="list-group-item"><strong>Contact:</strong> {dataset.contact_point.name}</li>
                <li className="list-group-item"><strong>Access URL:</strong> <a href={dataset.access_url} target="_blank" rel="noopener noreferrer">{dataset.access_url}</a></li>
                <li className="list-group-item"><strong>Download URL:</strong> <a href={dataset.download_url} target="_blank" rel="noopener noreferrer">{dataset.download_url}</a></li>
                <li className="list-group-item"><strong>Theme:</strong> {dataset.theme}</li>
                <li className="list-group-item">
                  <strong>Is Public:</strong> {dataset.is_public ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <i className="fa-solid fa-xmark"></i>
                  )}
                </li>
              </ul>
            </div>

            <div style={{ width: '40%' }} className="d-flex align-items-center justify-content-center">
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
