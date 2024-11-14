import React, { useState } from 'react';

const AdvancedSearchModal = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [owner, setOwner] = useState('');
  const [sortBy, setSortBy] = useState('');

  return (
    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1" role="dialog">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Advanced Search</h5>
            <button type="button" className="close" onClick={onClose} aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form>
              <div className="form-group">
                <label>Search Query</label>
                <input
                  type="text"
                  className="form-control"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter search terms"
                />
              </div>
              <div className="form-group">
                <label>Date Range</label>
                <div className="d-flex">
                  <input
                    type="date"
                    className="form-control mr-2"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span className="mx-2">to</span>
                  <input
                    type="date"
                    className="form-control ml-2"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Owner</label>
                <input
                  type="text"
                  className="form-control"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="Enter owner's name"
                />
              </div>
              <div className="form-group">
                <label>Sort By</label>
                <select
                  className="form-control"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="">Select an option</option>
                  <option value="dateCreated">Date Created</option>
                  <option value="lastModified">Last Modified</option>
                  <option value="name">Dataset Name</option>
                </select>
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={() => alert("Search initiated!")}>
              Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchModal;
