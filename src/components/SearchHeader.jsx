import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RiCollageFill } from "react-icons/ri";
import { IoFolderOpen } from "react-icons/io5";
import { MdCreateNewFolder } from "react-icons/md";

import PinModal from "../ui/PinModal/PinModal";
import { LanguageContext } from "../contexts/contextLanguage";
import { useAuth } from "../contexts/AuthContext";
import { productsDB, slidesDB, designsDB, collageDB } from "../utils/handleDB";
import MarketplaceSwitcher from "../ui/MarketplaceSwitcher/MarketplaceSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher/LanguageSwitcher";
import { migrationService } from "../utils/migrationService";

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
  const { user, isAuthenticated } = useAuth();

  const headerRightRef = useRef(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState('');

  const getUserName = () => {
    if (!user) return null;
    
    // Возвращаем username или часть email
    return user.username || (user.email ? user.email.split('@')[0] : null);
  };

  const userName = getUserName();

  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
    if (event.target.value === '') {
      onSearch([]);
    }
  };

  const handleSearch = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }

    if (user && user.company && user.company[0]) {
      try {
        const companyId = user.company[0].id;
        
        // Проверяем, нужна ли миграция
        const needsMigration = await migrationService.needsMigration(user);
        
        if (needsMigration) {
          setIsMigrating(true);
          setMigrationMessage(t('migration.inProgress') || 'Миграция данных...');
          
          // Выполняем миграцию
          const migrationResult = await migrationService.migrateAllData(user, companyId);
          
          if (migrationResult.totalMigrated > 0) {
            setMigrationMessage(
              t('migration.completed') || 
              `Миграция завершена. Перенесено ${migrationResult.totalMigrated} макетов`
            );
            
            // Показываем сообщение об успехе на 3 секунды
            setTimeout(() => {
              setMigrationMessage('');
              setIsMigrating(false);
            }, 3000);
          } else {
            setIsMigrating(false);
            setMigrationMessage('');
          }
        }
      } catch (migrationError) {
        console.error('Migration error:', migrationError);
        setIsMigrating(false);
        setMigrationMessage(t('migration.error') || 'Ошибка миграции данных');
        
        // Скрываем сообщение об ошибке через 5 секунд
        setTimeout(() => {
          setMigrationMessage('');
        }, 5000);
      }
    }  

    setIsToggled(false);
    productsDB.clearAll();
    slidesDB.clearAll();
    sessionStorage.removeItem('searchData');

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
  
  const handleGalleryClick = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
      navigate('/gallery');
  };

  const handleCreateTamplete = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
      setIsPinModalOpen(true)
  }

  const handleToggleCollage = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
      setIsToggled(!isToggled);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch([]);
    setIsToggled(false);
    // Полная очистка sessionStorage
    productsDB.clearAll();
    slidesDB.clearAll();
    sessionStorage.removeItem('searchData');
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

  return (
    <div className={`search-header ${isSearchActive ? 'active' : ''}`}>
      <div ref={headerRightRef} className={`header-right ${isHeaderHidden ? 'hidden' : ''}`}>
        {/*hasUsers && (
          <button onClick={handleCreateTamplete} className="creat-temp-button">
            <MdCreateNewFolder className="creat-temp-icon" />
          </button>
        )*/}
        <LanguageSwitcher />
      </div>
      <div className="header-top">
        {!isAuthenticated ? (
          // Для неавторизованных пользователей - стандартный заголовок
          <>
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
          </>
        ) : (
          // Для авторизованных пользователей - приветствие с именем
          <>
            <h2 style={{
              paddingBottom: '12px',
              margin: 0
            }}>
              {userName 
                ? `${t('header.titleNext')}, ${userName}!` 
                : t('header.titleNext')
              }
            </h2>
            <p style={{
              fontSize: '20px',
              color: 'rgba(0,0,0,0.8)',
              margin: '0px',
              paddingBottom: '18px'
            }}>
              {t('header.descriptionNext')}
            </p>
          </>
        )}
      </div>
      <div className="search-wrapper">
        <div className="input-container">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('header.searchPlaceholder')}
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
        <button onClick={handleToggleCollage} className="template-button" style={{ background: 'transparent' }}>
          <RiCollageFill /> {t('header.createCollage')}
        </button>
        <button onClick={handleGalleryClick} className="template-button" style={{ background: 'transparent' }}>
          <IoFolderOpen /> {t('header.gallery')}
        </button>
      </div>}
      {/*isPinModalOpen && (
        <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
      />
      )*/}
    </div>
  );
};

export default SearchHeader;