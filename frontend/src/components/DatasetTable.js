import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const DatasetTable = ({ datasets, onRowClick, onEditClick, onDeleteClick, sessionWebId, searchQuery }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString("de-DE");
  };

  const columns = [
    { field: "title", headerName: "Title", flex: 1, minWidth: 180 },
    { field: "description", headerName: "Description", flex: 2, minWidth: 220 },
    {
      field: "issued",
      headerName: "Issued Date",
      minWidth: 130,
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: "modified",
      headerName: "Modified Date",
      minWidth: 130,
      valueFormatter: (value) => formatDate(value),
    },
    { field: "publisher", headerName: "Publisher", flex: 1, minWidth: 160 },
    { field: "contact_point", headerName: "Contact", flex: 1, minWidth: 160 },
    {
      field: "access",
      headerName: "Access Rights",
      minWidth: 130,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const dataset = params.row;
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
      field: "actions",
      headerName: "Actions",
      minWidth: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const dataset = params.row;
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
  ];

  return (
    <Box className="dataset-grid">
      <DataGrid
        rows={datasets}
        columns={columns}
        getRowId={(row) => row.identifier}
        autoHeight
        disableRowSelectionOnClick
        pageSizeOptions={[10, 25, 50]}
        rowHeight={52}
        columnHeaderHeight={54}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        filterModel={{
          items: [],
          quickFilterValues: searchQuery ? [searchQuery] : [],
        }}
        onRowClick={(params) => onRowClick(params.row)}
        sx={{
          border: "none",
          fontFamily: '"Manrope","Segoe UI",system-ui,-apple-system,Arial,sans-serif',
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#0b1220",
            color: "#e2e8f0",
            borderBottom: "1px solid #1f2937",
            fontWeight: 700,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "0.95rem",
          },
          "& .MuiDataGrid-cell": {
            color: "#e2e8f0",
            borderBottom: "1px solid #1f2937",
            backgroundColor: "#0f172a",
            fontSize: "0.95rem",
          },
          "& .MuiDataGrid-row:hover .MuiDataGrid-cell": {
            backgroundColor: "#1e293b",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #1f2937",
            color: "#cbd5f5",
            backgroundColor: "#0b1220",
          },
          "& .MuiTablePagination-root": {
            color: "#cbd5f5",
          },
          "& .MuiDataGrid-iconButtonContainer .MuiButtonBase-root": {
            color: "#cbd5f5",
          },
          "& .MuiDataGrid-columnSeparator": {
            color: "#1f2937",
          },
          "& .MuiDataGrid-menuIconButton": {
            color: "#cbd5f5",
          },
          "& .MuiDataGrid-sortIcon": {
            color: "#cbd5f5",
          },
        }}
      />
    </Box>
  );
};

export default DatasetTable;
