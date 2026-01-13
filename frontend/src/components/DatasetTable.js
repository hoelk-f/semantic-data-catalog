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
    {
      field: "title",
      headerName: "Title",
      flex: 1,
      minWidth: 200,
      cellClassName: "grid-cell-title",
      renderCell: (params) => <span className="grid-title">{params.value}</span>,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      minWidth: 240,
      cellClassName: "grid-cell-desc",
    },
    {
      field: "issued",
      headerName: "Issued Date",
      minWidth: 140,
      cellClassName: "grid-cell-meta",
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: "modified",
      headerName: "Modified Date",
      minWidth: 170,
      cellClassName: "grid-cell-meta",
      valueFormatter: (value) => formatDate(value),
    },
    {
      field: "publisher",
      headerName: "Publisher",
      flex: 1,
      minWidth: 180,
      cellClassName: "grid-cell-meta",
    },
    {
      field: "contact_point",
      headerName: "Contact",
      flex: 1,
      minWidth: 200,
      cellClassName: "grid-cell-meta",
    },
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
      minWidth: 130,
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
        getRowHeight={() => "auto"}
        columnHeaderHeight={82}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        filterModel={{
          items: [],
          quickFilterValues: searchQuery ? [searchQuery] : [],
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? "grid-row-even" : "grid-row-odd"
        }
        onRowClick={(params) => onRowClick(params.row)}
        sx={{
          border: "none",
          fontFamily: '"Manrope","Segoe UI",system-ui,-apple-system,Arial,sans-serif',
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#0a1528",
            color: "#f8fafc",
            borderBottom: "1px solid #1f2a44",
            fontWeight: 800,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "1.2rem",
            whiteSpace: "normal",
            lineHeight: 1.2,
          },
          "& .MuiDataGrid-cell": {
            color: "#e5e7eb",
            borderBottom: "1px solid #1f2a44",
            fontSize: "1.15rem",
            whiteSpace: "normal",
            lineHeight: 1.6,
            alignItems: "flex-start",
            py: 2.1,
          },
          "& .MuiDataGrid-row": {
            maxHeight: "none !important",
          },
          "& .MuiDataGrid-columnHeader": {
            alignItems: "flex-start",
            paddingTop: "12px",
          },
          "& .MuiDataGrid-row:hover .MuiDataGrid-cell": {
            backgroundColor: "#1b2946",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid #1f2a44",
            color: "#cbd5f5",
            backgroundColor: "#0a1528",
          },
          "& .MuiTablePagination-toolbar": {
            flexWrap: "nowrap",
            alignItems: "center",
            gap: "10px",
          },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            margin: 0,
          },
          "& .MuiTablePagination-root": {
            color: "#cbd5f5",
          },
          "& .MuiDataGrid-iconButtonContainer .MuiButtonBase-root": {
            color: "#cbd5f5",
          },
          "& .MuiDataGrid-columnSeparator": {
            color: "#1f2a44",
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
