import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (event) => {
    if (!event || !event.target) return;
    const value = event.target.value;
    setSearchQuery(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search datasets..."
        value={searchQuery}
        onChange={handleSearchChange}
      />
      <i className="fas fa-search"></i>
    </div>
  );
};

export default SearchBar;
