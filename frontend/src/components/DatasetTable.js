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
            <td>{dataset.publisher}</td>
            <td>{dataset.contact_point}</td>
            <td>
              {dataset.is_public ? (
                <i className="fa-solid fa-globe" title="Public"></i>
              ) : (
                <i className="fa-solid fa-xmark text-danger" title="Private"></i>
              )}
            </td>
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
