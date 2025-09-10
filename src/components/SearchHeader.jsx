import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RiCollageFill } from "react-icons/ri";
import { IoFolderOpen } from "react-icons/io5";
import { MdCreateNewFolder } from "react-icons/md";

import PinModal from "../ui/PinModal/PinModal";
import { LanguageContext } from "../contexts/contextLanguage";
import { db, productsDB, slidesDB, usersDB } from "../utils/handleDB";
import MarketplaceSwitcher from "../ui/MarketplaceSwitcher/MarketplaceSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher/LanguageSwitcher";
import { isToday } from "../utils/isToday";

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
  const [hasUsers, setHasUsers] = useState(false); 
  const [userLogin, setUserLogin] = useState(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Функция для проверки наличия пользователей
  const checkUsers = async () => {
    try {
      const users = await usersDB.getAll();

      if (users.length === 0) {
        setHasUsers(false);
        return;
      }

      // Проверяем всех пользователей на наличие сегодняшнего логина
      const hasUserLoggedInToday = users.some(user => 
        user.lastLogin && isToday(user.lastLogin)
      );

      setHasUsers(hasUserLoggedInToday);

    } catch (error) {
      console.error('Error checking users:', error);
      setHasUsers(false);
    }
  };

  // Функция для проверки аутентификации пользователя
  const checkUserAuthentication = async () => {
    try {
      const users = await usersDB.getAll();
      
      // Если нет пользователей - перенаправляем на регистрацию
      if (users.length === 0) {
        navigate('/sign-up');
        return false;
      }
      
      // Если есть пользователи, проверяем lastLogin
      const currentUser = users[0];
      
      // Проверяем, что lastLogin не сегодня
      if (!isToday(currentUser.lastLogin)) {
        navigate('/sign-in');
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking user authentication:', error);
      navigate('/sign-up');
      return false;
    }
  };

  const getUserLogin = async () => {
    try {
      const users = await usersDB.getAll();
      if (users.length === 0) {
        return null; 
      }

      return users[0].login || null;

    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

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
  
  const handleGalleryClick = async () => {
    const isAuthenticated = await checkUserAuthentication();
    if (isAuthenticated) {
      navigate('/gallery');
    }
  };

  const handleCreateTamplete = async () => {
    const isAuthenticated = await checkUserAuthentication();
    if (isAuthenticated) {
      setIsPinModalOpen(true)
    }
  }

  const handleToggleCollage = async () => {
    const isAuthenticated = await checkUserAuthentication();
    if (isAuthenticated) {
      setIsToggled(!isToggled);
    }
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

  // Проверяем наличие пользователей при загрузке компонента
   useEffect(() => {
    const initializeUserData = async () => {
      await checkUsers();
      
      // Если есть пользователи, получаем логин
      if (hasUsers) {
        const login = await getUserLogin();
        setUserLogin(login);
      }
    };

    initializeUserData();
  }, [hasUsers]);

  return (
    <div className={`search-header ${isSearchActive ? 'active' : ''}`}>
      <div ref={headerRightRef} className={`header-right ${isHeaderHidden ? 'hidden' : ''}`}>
        {hasUsers && (
          <button onClick={handleCreateTamplete} className="creat-temp-button">
            <MdCreateNewFolder className="creat-temp-icon" />
          </button>
        )}
        <LanguageSwitcher />
      </div>
      <div className="header-top">
        {!hasUsers ? (<>
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
        </>) : (<>
          <h2 style={{
            paddingBottom: '12px',
            margin: 0
          }}>
            {userLogin ? `${t('header.titleNext')}, ${userLogin}!` : t('header.titleNext')}
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(0,0,0,0.8)',
            margin: '0px',
            paddingBottom: '18px'
          }}>
            {t('header.descriptionNext')}
          </p>
        </>)}
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
        <button onClick={handleToggleCollage} className="template-button" style={{ background: 'transparent' }}>
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
      {isPinModalOpen && (
        <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
      />
      )}
    </div>
  );
};

export default SearchHeader;