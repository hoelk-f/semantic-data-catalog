import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (event) => {
    if (!event || !event.target) {
      console.warn("Search event is undefined or invalid");
      return;
    }
  
    const value = event.target.value;
    setSearchQuery(value);
  
    if (onSearch) {
      onSearch(value);
    }
  };

  return (
    <div className="search-bar" style={{ marginRight: '10px' }}>
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
