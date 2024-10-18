import React from 'react';

const DatasetTable = ({ datasets, onRowClick, onEditClick, onDeleteClick }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE'); // Format in DD.MM.YYYY
  };

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Dataset Name</th>
          <th>Description</th>
          <th>Creation Date</th>
          <th>Last Modification</th>
          <th>Owner</th>
          <th>Contact</th> {/* Neue Spalte für Contact */}
          <th>File Format</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {datasets.map((dataset) => (
          <tr key={dataset.id} onClick={() => onRowClick(dataset)}>
            <td>{dataset.id}</td>
            <td>{dataset.name}</td>
            <td>{dataset.description}</td>
            <td>{formatDate(dataset.creation_date)}</td>
            <td>{formatDate(dataset.last_modified_date)}</td>
            <td>{dataset.owner.name}</td>
            <td>{dataset.contact.name}</td> {/* Anzeige des Kontaktpersonennamens */}
            <td>
              <i className="fa-solid fa-file-csv fa-2x"></i> {/* CSV Icon */}
            </td>
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
