import React from 'react';

const DatasetTable = ({ datasets, onRowClick, onEditClick, onDeleteClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE');
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Description</th>
          <th>Identifier</th>
          <th>Issued Date</th>
          <th>Modified Date</th>
          <th>Publisher</th>
          <th>Contact Point</th>
          <th>Access URL</th>
          <th>Download URL</th>
          <th>Theme</th>
          <th>Public</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((dataset) => (
          <tr key={dataset.id} onClick={() => onRowClick(dataset)}>
            <td>{dataset.id}</td>
            <td>{dataset.title}</td>
            <td>{dataset.description}</td>
            <td>{dataset.identifier}</td>
            <td>{formatDate(dataset.issued)}</td>
            <td>{formatDate(dataset.modified)}</td>
            <td>{dataset.publisher.name}</td>
            <td>{dataset.contact_point.name}</td>
            <td><a href={dataset.access_url} target="_blank" rel="noopener noreferrer">Access</a></td>
            <td><a href={dataset.download_url} target="_blank" rel="noopener noreferrer">Download</a></td>
            <td>{dataset.theme}</td>
            <td>{dataset.is_public ? 'Yes' : 'No'}</td>
            <td>
              <button className="edit-button" onClick={(e) => { e.stopPropagation(); onEditClick(dataset); }}>
                <i className="fa-regular fa-pen-to-square"></i>
              </button>
              <button className="delete-button ml-2" onClick={(e) => { e.stopPropagation(); onDeleteClick(dataset); }}>
                <i className="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DatasetTable;
