import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange("prev")}
        disabled={currentPage === 1}
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button
        onClick={() => onPageChange("next")}
        disabled={currentPage === totalPages}
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  );
};

export default Pagination;
