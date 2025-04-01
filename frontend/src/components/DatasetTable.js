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
          <th>Title</th>
          <th>Description</th>
          <th>Issued Date</th>
          <th>Modified Date</th>
          <th>Publisher</th>
          <th>Contact</th>
          <th>Public</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((dataset) => (
          <tr key={dataset.identifier} onClick={() => onRowClick(dataset)}>
            <td>{dataset.title}</td>
            <td>{dataset.description}</td>
            <td>{formatDate(dataset.issued)}</td>
            <td>{formatDate(dataset.modified)}</td>
            <td>{dataset.publisher.name}</td>
            <td>{dataset.contact_point.name}</td>
            <td>{dataset.is_public ? 'Yes' : 'No'}</td>
            <td>
              <button className="edit-button" onClick={(e) => { e.stopPropagation(); onEditClick(dataset); }}>
                <i className="fa-regular fa-pen-to-square"></i>
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DatasetTable;
