import React from 'react';

const DatasetTable = ({ datasets, onRowClick, onEditClick, onDeleteClick, sessionWebId }) => {
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
          <th>Access Rights</th>
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
            <td className="table-actions-cell">
              <div className="inline-action-buttons">
                {sessionWebId && dataset.webid === sessionWebId && (
                  <>
                    <button className="edit-button" onClick={(e) => { e.stopPropagation(); onEditClick(dataset); }}>
                      <i className="fa-regular fa-pen-to-square"></i>
                    </button>
                    <button className="delete-button" onClick={(e) => { e.stopPropagation(); onDeleteClick(dataset); }}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DatasetTable;
