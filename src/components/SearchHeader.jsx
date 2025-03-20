import { useState } from 'react';

const SearchHeader = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  // Разрешенные символы: цифры, дефис, пробелы, запятые, плюсы
  const allowedCharactersRegex = /^[\d\s,+-]*$/;

  const handleInputChange = (event) => {
    let value = event.target.value;
    
    value = value
      .replace(/[^\d\s,+-]/g, '')
      .replace(/(\d{4}-\d{4})[^\s,+]|$/g, '$1')
      .replace(/([,\s+])\1+/g, '$1')
      .replace(/([,+])/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/(\d)-(\d)/g, '$1$2')
      .replace(/(\d{4})-?(\d{4})/g, '$1-$2');

    if (allowedCharactersRegex.test(value)) {
      setSearchQuery(value);
      if (value === '') {
        setIsSearchActive(false);
        onSearch([]);
      }
    }
  };

  const handleSearch = () => {
    const normalized = searchQuery
      .split(/[\s,]+/) 
      .map(item => {
        const formatted = item
          .replace(/-/g, '') 
          .replace(/(\d{4})(\d{4})/, '$1-$2') 
          .substring(0, 9); 
        
        return /^\d{4}-\d{4}$/.test(formatted) ? formatted : null;
      })
      .filter(item => item !== null);

    if (normalized.length > 0) {
      setIsSearchActive(true);
      onSearch(normalized);
    } else {
      alert('Пожалуйста, введите артикулы в формате ХХХХ-ХХХХ, разделенные пробелом, запятой или +');
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    onSearch([]);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`search-header ${isSearchActive ? 'active' : ''}`}>
      <h2 style={{
        paddingBottom: '12px'
      }}>
        Генератор изображений для маркетплейсов
      </h2>
      <p style={{
        fontSize: '20px',
        color: 'rgba(0,0,0,0.8)',
        margin: '0px',
        paddingBottom: '18px'
      }}>
        С помощью этого генератора вы легко создадите привлекательные изображения для ваших товаров.
      </p>
      <div className="search-wrapper">
        <div className="input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Введите артикулы ..."
            pattern="[\d\s,+-]+"
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
  );
};

export default SearchHeader;