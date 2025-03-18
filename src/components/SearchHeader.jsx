import React, { useState } from 'react';

const SearchHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [answer, setAnswer] = useState('')

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    setAnswer(searchQuery)
    console.log(searchQuery)
  };

  const handleClear = () => {
    setSearchQuery('');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <>
    <div className="search-header">
      <h2>Укажите артикулы товаров</h2>
      <div className="search-wrapper">
        <div className="input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Введите поисковый запрос"
          />
          {searchQuery && (
            <button 
              className="clear-button"
              onClick={handleClear}
              aria-label="Очистить поле"
            >
              ×
            </button>
          )}
        </div>
        <button 
          className="search-button"
          onClick={handleSearch}
        >
          Найти
        </button>
      </div>
    </div>
    <div className='answer'>
      <p>{answer}</p>
    </div>
    
    </>
  );
};

export default SearchHeader;