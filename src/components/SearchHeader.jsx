import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiCollageFill } from "react-icons/ri";
import { IoFolderOpen } from "react-icons/io5";

import MarketplaceSwitcher from "./MarketplaceSwitcher/MarketplaceSwitcher";

const SearchHeader = ({ 
  onSearch, 
  searchQuery, 
  setSearchQuery, 
  isSearchActive,
  loading,
  error,
  infoMessage,
  isToggled, 
  setIsToggled
}) => {
  const navigate = useNavigate();
  const [hasKeys, setHasKeys] = useState(false);

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
        onSearch([]);
      }
    }
  };

  const handleSearch = () => {
    // Полная очистка sessionStorage
    setIsToggled(false);
    sessionStorage.clear();
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
      onSearch(normalized);
    } else {
      onSearch([]);
      alert('Пожалуйста, введите артикулы в формате ХХХХ-ХХХХ, разделенные пробелом, запятой или +');
    }
  };

  const handleGalleryClick = () => {
    navigate('/gallery');
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch([]);
    setIsToggled(false);
    // Полная очистка sessionStorage
    sessionStorage.clear();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    const articlePattern = /^\d{4}-\d{4}/;
    const keys = Object.keys(localStorage);
    const hasKeys = keys.some(key => articlePattern.test(key));
    setHasKeys(hasKeys);
  }, []);

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
      {(loading || infoMessage || error) && <div className="status-messages">
        {loading && (
          <div className="message loading">
            Подождите немножко, мы ищем интересующие вас товары...
          </div>
        )}
        {infoMessage ? (
          <div className="message info">
            {infoMessage}
          </div>
        ) : error && (
          <div className="message error">
            {error}
          </div>
        )}
      </div>}
      {isSearchActive && <div className="template-button-container">
        <MarketplaceSwitcher />
        <button onClick={() => setIsToggled(!isToggled)} className="template-button" style={{ background: 'transparent' }}>
          <RiCollageFill /> Создать коллаж
        </button>
        {/*<button 
          onClick={handleGalleryClick} 
          className="template-button" 
          style={{ background: 'transparent' }}
          disabled={!hasKeys}
        >
          <IoFolderOpen /> Галерея дизайнов
        </button>*/}
      </div>}
    </div>
  );
};

export default SearchHeader;