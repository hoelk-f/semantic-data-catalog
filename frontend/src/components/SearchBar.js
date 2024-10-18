import React from 'react';

const SearchBar = ({ onSearch }) => {
  return (
    <div className="search-bar">
      <input type="text" placeholder="Search datasets..." onChange={onSearch} />
      <i className="fas fa-search"></i>
    </div>
  );
};

export default SearchBar;