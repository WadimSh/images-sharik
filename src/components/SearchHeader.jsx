import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RiCollageFill } from "react-icons/ri";
import { IoFolderOpen } from "react-icons/io5";
import { useContext } from "react";
import { LanguageContext } from "../context/contextLanguage";

import { db, productsDB, slidesDB } from "../utils/handleDB";
import MarketplaceSwitcher from "./MarketplaceSwitcher/MarketplaceSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher/LanguageSwitcher";

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
  const { t } = useContext(LanguageContext);

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
    productsDB.clearAll();
    slidesDB.clearAll();
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
    productsDB.clearAll();
    slidesDB.clearAll();
    sessionStorage.clear();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  useEffect(() => {
    const checkHistory = async () => {
      try {
        // Получаем количество записей в таблице
        const count = await db.history.count();
        setHasKeys(count > 0);
      } catch (error) {
        console.error('Ошибка при проверке истории:', error);
        setHasKeys(false);
      }
    };
  
    checkHistory();
  }, []);

  return (
    <div className={`search-header ${isSearchActive ? 'active' : ''}`}>
      <div className="header-right">
        <LanguageSwitcher />
      </div>
      <div className="header-top">
        <h2 style={{
          paddingBottom: '12px',
          margin: 0
        }}>
          {t('header.title')}
        </h2>
        <p style={{
          fontSize: '20px',
          color: 'rgba(0,0,0,0.8)',
          margin: '0px',
          paddingBottom: '18px'
        }}>
          {t('header.description')}
        </p>
      </div>
      <div className="search-wrapper">
        <div className="input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('header.searchPlaceholder')}
            pattern="[\d\s,+-]+"
          />
          {searchQuery && (
            <button 
              className="clear-button"
              onClick={handleClear}
              aria-label={t('header.clearButton')}
            >
              ×
            </button>
          )}
        </div>
        <button 
          className="search-button"
          onClick={handleSearch}
        >
          {t('header.searchButton')}
        </button>
      </div>
      {(loading || infoMessage || error) && <div className="status-messages">
        {loading && (
          <div className="message loading">
            {t('header.loadingMessage')}
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
          <RiCollageFill /> {t('header.createCollage')}
        </button>
        <button 
          onClick={handleGalleryClick} 
          className="template-button" 
          style={{ background: 'transparent' }}
          disabled={!hasKeys}
        >
          <IoFolderOpen /> {t('header.gallery')}
        </button>
      </div>}
    </div>
  );
};

export default SearchHeader;