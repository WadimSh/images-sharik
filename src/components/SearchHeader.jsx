import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { RiCollageFill } from "react-icons/ri";
import { IoFolderOpen } from "react-icons/io5";
import { TbReport } from "react-icons/tb";
import { MdOutlinePermMedia } from "react-icons/md";
import { LuImagePlus } from "react-icons/lu";
// import { MdCreateNewFolder } from "react-icons/md";

// import PinModal from "../ui/PinModal/PinModal";
import { LanguageContext } from "../contexts/contextLanguage";
import { useAuth } from "../contexts/AuthContext";
import { productsDB, slidesDB } from "../utils/handleDB";
import MarketplaceSwitcher from "../ui/MarketplaceSwitcher/MarketplaceSwitcher";
import LanguageSwitcher from "../ui/LanguageSwitcher/LanguageSwitcher";
import { Tooltip } from "../ui/Tooltip/Tooltip";
import { uploadGraphicFile } from '../services/mediaService';
import ImageUploadModal from '../components/ImageUploadModal/ImageUploadModal';

const transliterateFileName = (filename) => {
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  let result = filename.replace(/[а-яёА-ЯЁ]/g, char => translitMap[char] || char);
  
  result = result.replace(/[^\w\s.-]/g, '_'); 
  result = result.replace(/\s+/g, '_'); 
  result = result.replace(/_+/g, '_'); 
  result = result.replace(/^_+|_+$/g, ''); 
  
  return result;
};

const showUploadNotification = () => {
    
  return {
    success: (data) => {
      console.log('✅ Загрузка успешна:', data);
      alert(`✅ ${data.message}`);
    },
    error: (data) => {
      console.log('❌ Ошибка загрузки:', data);
      alert(`❌ ${data.message}: ${data.error}`);
    }
  };
};

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
  const { user, isAuthenticated, isAdmin, isUploader } = useAuth();

  const headerRightRef = useRef(null);
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  // const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 570);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
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

  const handleImageClick = () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
    
    // Создаем скрытый input для выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Проверка типа файла
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Разрешены только JPEG, PNG и WebP файлы');
        return;
      }
      
      // Проверка размера (100MB)
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Файл превышает размер 100MB');
        return;
      }
      
      setSelectedFile(file);
      setOriginalFileName(file.name);
      setIsModalOpen(true);
    };
    
    input.click();
  };

  const handleUpload = async (finalFileName, allTags) => {
    if (!selectedFile) return;

    const uploadNotification = showUploadNotification(selectedFile.name);

    try {
      // Создаем новый файл с сгенерированным именем
      const blob = new Blob([selectedFile], { type: selectedFile.type });
      const processedFile = new File([blob], finalFileName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      });

      // Загружаем файл
      const result = await uploadGraphicFile(
        user.company[0].id,
        processedFile,
        null, 
        allTags 
      );

      // Показываем успешное уведомление
      uploadNotification.success({
        title: `Файл ${finalFileName}`,
        message: "Успешно загружен",
        error: null // В success ошибки нет
      });

    } catch (error) {
      // Показываем уведомление об ошибке
      uploadNotification.error({
        title: 'Ошибка',
        message: `Не удалось загрузить файл "${finalFileName}"`,
        error: error.message
      });
    }
  };

  const handleReportClick = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
      navigate('/reports');
  }

  const handleMediaClick = async () => {
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }
      navigate('/media');
  }

  // const handleCreateTamplete = async () => {
  //   if (!isAuthenticated) {
  //     navigate('/sign-in');
  //     return;
  //   }
  //     setIsPinModalOpen(true)
  // }

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
        {
          <Tooltip
            content={t('header.gallery')}
            position='bottom'
          >
            <button onClick={handleGalleryClick} className="creat-temp-button">
              <IoFolderOpen className="creat-temp-icon" />
            </button>
          </Tooltip>
        }
        {<div className="creat-image-wrapper">
          <Tooltip
            content={t('Загрузить изображение')}
            position={isMobile ? 'top-shift-left' : 'bottom'}
          >
            <button onClick={handleImageClick} className="creat-image-button">
              <LuImagePlus className="creat-image-icon" />
            </button>
          </Tooltip>
        </div>}
        {(isAdmin || isUploader) && (
          <Tooltip
            content={t('header.library')}
            position='bottom'
          >
            <button onClick={handleMediaClick} className="creat-temp-button">
              <MdOutlinePermMedia className="creat-temp-icon" />
            </button>
          </Tooltip>
          
        )}
        {isAdmin && (
          <Tooltip
            content={t('header.reports')}
            position='bottom'
          >
            <button onClick={handleReportClick} className="creat-temp-button">
              <TbReport className="creat-temp-icon" />
            </button>
          </Tooltip>
          
        )}
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
      </div>}
      {/*isPinModalOpen && (
        <PinModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
      />
      )*/}
      <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedFile(null);
        }}
        onUpload={handleUpload}
        user={user} 
        selectedFile={selectedFile}
      />
    </div>
  );
};

export default SearchHeader;

