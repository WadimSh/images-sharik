import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { RiCollageFill } from "react-icons/ri";
import { IoFolderOpen } from "react-icons/io5";
import { useContext } from "react";
import { LanguageContext } from "../contexts/contextLanguage";

import { db, productsDB, slidesDB } from "../utils/handleDB";
import MarketplaceSwitcher from "../ui/MarketplaceSwitcher/MarketplaceSwitcher";
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
  const { t } = useContext(LanguageContext);
  const headerRightRef = useRef(null);
  const [hasKeys, setHasKeys] = useState(false);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value === '') {
      onSearch([]);
    }
  };

  const handleSearch = () => {
    setIsToggled(false);
    productsDB.clearAll();
    slidesDB.clearAll();
    sessionStorage.clear();

    if (searchQuery.trim()) {
      // Нормализация введенных данных перед сохранением
      const normalized = searchQuery
        .replace(/\//g, '-')    // Замена / на -
        .replace(/[,+]/g, ' ')  // Замена запятых и плюсов на пробелы
        .replace(/\s+/g, ' ')   // Удаление лишних пробелов
        .trim();
      
      onSearch([normalized]);
    } else {
      onSearch([]);
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
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsHeaderHidden(true);
      } else {
        setIsHeaderHidden(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const checkHistory = async () => {
      try {
        // Получаем количество записей в таблице
        const count = await db.history.count();
        setHasKeys(count > 0);
      } catch (error) {
        console.error('Error checking the history:', error);
        setHasKeys(false);
      }
    };
  
    checkHistory();
  }, []);

  return (
    <div className={`search-header ${isSearchActive ? 'active' : ''}`}>
      <div ref={headerRightRef} className={`header-right ${isHeaderHidden ? 'hidden' : ''}`}>
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