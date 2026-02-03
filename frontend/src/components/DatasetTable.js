import React from "react";
import { Box } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";

const DatasetTable = ({ datasets, onRowClick, onEditClick, onDeleteClick, sessionWebId, searchQuery }) => {
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? dateString : date.toLocaleDateString("de-DE");
  };

  const getSeriesCount = (row) => {
    if (!row || row.datasetType !== "series") return "";
    return (row.seriesMembers || []).length;
  };

  const columns = [
    {
      field: "datasetType",
      headerName: "Type",
      minWidth: 120,
      sortable: false,
      renderCell: (params) => {
        const type = params.value || "dataset";
        return (
          <span className={`badge ${type === "series" ? "badge-info" : "badge-light"}`}>
            {type === "series" ? "Series" : "Dataset"}
          </span>
        );
      },
    },
    {
      field: "seriesCount",
      headerName: "Members",
      minWidth: 120,
      sortable: false,
      filterable: false,
      valueGetter: (value, row) => getSeriesCount(row || value?.row || value),
      renderCell: (params) => {
        const dataset = params?.row;
        if (!dataset || dataset.datasetType !== "series") {
          return <span className="text-muted">-</span>;
        }
        const count = (dataset.seriesMembers || []).length;
        return (
          <span className="badge badge-pill badge-secondary">
            {count} {count === 1 ? "Member" : "Members"}
          </span>
        );
      },
    },
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
        if (dataset.datasetType === "series") {
          return <span className="text-muted">—</span>;
        }
        if (dataset.is_public) {
          return <i className="fa-solid fa-globe" title="Public"></i>;
        }
        if (dataset.userHasAccess) {
          return (
            <span className="access-lock-pair" title="Restricted (You have access)">
              <i className="fa-solid fa-lock text-danger"></i>
              <span className="access-lock-divider">(</span>
              <i className="fa-solid fa-lock-open text-success"></i>
              <span className="access-lock-divider">)</span>
            </span>
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
        getRowId={(row) => row.identifier || row.datasetUrl}
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
        getRowClassName={(params) => {
          const base =
            params.indexRelativeToCurrentPage % 2 === 0 ? "grid-row-even" : "grid-row-odd";
          return params.row?.isStale ? `${base} grid-row-stale` : base;
        }}
        onRowClick={(params) => onRowClick(params.row)}
        sx={{
          border: "none",
          fontFamily: '"Manrope","Segoe UI",system-ui,-apple-system,Arial,sans-serif',
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#142642",
            color: "#f8fafc",
            borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
            fontWeight: 800,
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontSize: "0.95rem",
            whiteSpace: "normal",
            lineHeight: 1.2,
          },
          "& .MuiDataGrid-cell": {
            color: "#0f172a",
            borderBottom: "1px solid rgba(255, 255, 255, 0.22)",
            fontSize: "0.92rem",
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
            backgroundColor: "#eaf2ff",
          },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "1px solid rgba(255, 255, 255, 0.22)",
            color: "#cbd5f5",
            backgroundColor: "#142642",
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
            color: "rgba(255, 255, 255, 0.35)",
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
