import React, { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

const DatasetTable = ({ datasets, onRowClick, onEditClick, onDeleteClick, sessionWebId }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString("de-DE");
  };

  const columnDefs = useMemo(
    () => [
      { headerName: "Title", field: "title", flex: 1, minWidth: 180 },
      { headerName: "Description", field: "description", flex: 2, minWidth: 220 },
      {
        headerName: "Issued Date",
        field: "issued",
        valueFormatter: (params) => formatDate(params.value),
        minWidth: 130,
      },
      {
        headerName: "Modified Date",
        field: "modified",
        valueFormatter: (params) => formatDate(params.value),
        minWidth: 130,
      },
      { headerName: "Publisher", field: "publisher", flex: 1, minWidth: 160 },
      { headerName: "Contact", field: "contact_point", flex: 1, minWidth: 160 },
      {
        headerName: "Access Rights",
        field: "access",
        sortable: false,
        filter: false,
        minWidth: 130,
        cellRenderer: (params) => {
          const dataset = params.data;
          if (!dataset) return null;
          if (dataset.is_public) {
            return <i className="fa-solid fa-globe" title="Public"></i>;
          }
          if (dataset.userHasAccess) {
            return (
              <i
                className="fa-solid fa-lock-open text-success"
                title="Restricted (You have access)"
              ></i>
            );
          }
          return <i className="fa-solid fa-lock text-danger" title="Restricted"></i>;
        },
      },
      {
        headerName: "Actions",
        field: "actions",
        sortable: false,
        filter: false,
        minWidth: 120,
        cellRenderer: (params) => {
          const dataset = params.data;
          if (!dataset || !sessionWebId || dataset.webid !== sessionWebId) return null;
          return (
            <div className="inline-action-buttons">
              <button
                className="edit-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick(dataset);
                }}
              >
                <i className="fa-regular fa-pen-to-square"></i>
              </button>
              <button
                className="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick(dataset);
                }}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          );
        },
      },
    ],
    [onDeleteClick, onEditClick, sessionWebId]
  );

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
    }),
    []
  );

  return (
    <div className="ag-theme-alpine dataset-grid">
      <AgGridReact
        rowData={datasets}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination
        paginationPageSize={10}
        domLayout="autoHeight"
        getRowId={(params) => params.data.identifier}
        onRowClicked={(event) => onRowClick(event.data)}
      />
    </div>
  );
};

export default DatasetTable;
