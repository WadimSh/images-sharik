import { useContext, useRef, useMemo, useState, useEffect, useCallback } from "react";
import { LanguageContext } from "../../contexts/contextLanguage";
import { CustomSelect } from "../../ui/CustomSelect/CustomSelect";
import { apiCheckArticleHistories } from '../../services/historiesService';
import './GalleryFilters.css';

const GalleryFilters = ({ 
  filters, 
  onFilterChange,
  marketplaceSizes,
  loading,
  initialSearchValue = ''
}) => {
  const { t } = useContext(LanguageContext);
  const searchInputRef = useRef(null);
  
  // Полностью независимое состояние для поля ввода
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);
  
  // Состояние для кнопки похожих товаров
  const [similarButtonState, setSimilarButtonState] = useState({
    isVisible: false,
    hasSimilar: false,
    baseCode: '',
    originalSearch: '',
    count: 0,
    showSimilar: false
  });

  // Рефы
  const isSimilarSearchRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const lastPerformedSearchRef = useRef('');

  // Опции для селектов
  const marketplaceOptions = {
    '': t('filters.allMarketplaces'),
    'WB': 'Wildberries',
    'OZ': 'Ozon', 
    'AM': 'Amazon'
  };

  const sortOptions = {
    'createdAt_desc': t('filters.newestFirst'),
    'createdAt_asc': t('filters.oldestFirst')
  };

  // Получаем все уникальные размеры из всех маркетплейсов
  const getAllSizeOptions = useMemo(() => {
    const allSizes = [];
    
    Object.values(marketplaceSizes).forEach(sizes => {
      sizes.forEach(size => {
        allSizes.push(size);
      });
    });
    
    const uniqueSizes = allSizes.reduce((acc, size) => {
      if (!acc.find(s => s.fileName === size.fileName)) {
        acc.push(size);
      }
      return acc;
    }, []);
    
    uniqueSizes.sort((a, b) => {
      if (a.width !== b.width) return a.width - b.width;
      return a.height - b.height;
    });
    
    const options = { '': t('filters.allSizes') };
    uniqueSizes.forEach(size => {
      options[size.fileName] = size.label;
    });
    
    return options;
  }, [marketplaceSizes, t]);

  // Функция для извлечения baseCode из searchValue (ТОЛЬКО XXXX-XXXX)
  const extractBaseCode = useCallback((value) => {
    if (!value) return null;
    
    // Проверяем ТОЛЬКО формат XXXX-XXXX где X - число
    const pattern = /^(\d{4})-\d{4}$/;
    const match = value.match(pattern);
    
    return match ? match[1] : null;
  }, []);

  // Проверка наличия похожих товаров
  const checkSimilarProducts = useCallback(async (baseCode, currentSearchValue) => {
    if (!baseCode) return;
    
    setSimilarButtonState(prev => ({
      ...prev,
      isVisible: true,
      baseCode,
      originalSearch: currentSearchValue || ''
    }));
    
    try {
      const response = await apiCheckArticleHistories(baseCode);
      
      if (response && response.hasHistories && response.count > 0) {
        setSimilarButtonState(prev => ({
          ...prev,
          hasSimilar: true,
          count: response.count
        }));
      } else {
        setSimilarButtonState(prev => ({
          ...prev,
          hasSimilar: false,
          count: 0,
          isVisible: false
        }));
      }
    } catch (error) {
      console.error('Error checking similar products:', error);
      setSimilarButtonState(prev => ({
        ...prev,
        hasSimilar: false,
        isVisible: false
      }));
    }
  }, []);

  // Определяем плейсхолдер в зависимости от фильтра "Мои"
  const getSearchPlaceholder = () => {
    return filters.mine 
      ? t('filters.searchPlaceholderMine')
      : t('filters.searchPlaceholderAll');
  };

  // Функция для определения типа поиска
  const getSearchType = (value) => {
    if (!value || value.length < 2) return null;
    
    // Проверяем первые два символа
    const firstTwoChars = value.substring(0, 2);
    
    // Если фильтр "Мои" - ТОЛЬКО поиск по артикулам (цифры)
    if (filters.mine) {
      return 'articles';
    }
    
    // Если фильтр "Все" - определяем тип по первым символам
    if (/^\d{2}/.test(firstTwoChars)) {
      return 'articles';
    }
    
    return 'ownerSearch';
  };

  // Проверка, можно ли использовать значение для поиска
  const canUseSearchValue = (value) => {
    // Минимум 2 символа
    if (value.length < 2) return false;
    
    // Если фильтр "Мои" - проверяем, что это цифры
    if (filters.mine) {
      // Проверяем, что первые 2 символа - цифры
      const firstTwoChars = value.substring(0, 2);
      return /^\d{2}/.test(firstTwoChars);
    }
    
    // Если фильтр "Все" - можно любой текст
    return true;
  };

  // Функция отправки поискового запроса
  const performSearch = useCallback((value) => {
    if (!value || !canUseSearchValue(value)) {
      // При пустом или невалидном значении очищаем фильтры
      onFilterChange('search', '');
      onFilterChange('ownerSearch', '');
      lastPerformedSearchRef.current = '';
      return;
    }
    
    // Если это тот же поиск, что уже выполнен - не повторяем
    if (value === lastPerformedSearchRef.current) return;
    
    // Сбрасываем режим похожих если это новый поиск
    if (isSimilarSearchRef.current && value !== similarButtonState.baseCode) {
      isSimilarSearchRef.current = false;
      setSimilarButtonState(prev => ({
        ...prev,
        showSimilar: false
      }));
    }
    
    // Проверяем, есть ли baseCode для поиска похожих (ТОЛЬКО XXXX-XXXX)
    const baseCode = extractBaseCode(value);
    if (baseCode) {
      checkSimilarProducts(baseCode, value);
    } else {
      // Сбрасываем состояние кнопки если не формат XXXX-XXXX
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
    }
    
    const searchType = getSearchType(value);
    
    if (searchType === 'articles') {
      onFilterChange('search', value);
      onFilterChange('ownerSearch', '');
    } else if (searchType === 'ownerSearch') {
      onFilterChange('ownerSearch', value);
      onFilterChange('search', '');
    }
    
    lastPerformedSearchRef.current = value;
  }, [canUseSearchValue, onFilterChange, extractBaseCode, checkSimilarProducts, similarButtonState.baseCode]);

  // Обработчик клика по кнопке "Показать похожие"
  const handleShowSimilar = useCallback(() => {
    const baseCode = similarButtonState.baseCode;
    const originalSearch = similarButtonState.originalSearch || inputValue;
    
    if (baseCode) {
      setSimilarButtonState(prev => ({
        ...prev,
        showSimilar: true
      }));
      
      isSimilarSearchRef.current = true;
      
      // Выполняем поиск по baseCode
      onFilterChange('search', baseCode);
      onFilterChange('ownerSearch', '');
      
      // Сохраняем оригинальное значение в поле ввода
      setInputValue(originalSearch);
    }
  }, [similarButtonState.baseCode, similarButtonState.originalSearch, inputValue, onFilterChange]);

  // Обработчик клика по кнопке "Скрыть похожие"
  const handleHideSimilar = useCallback(() => {
    const originalSearch = similarButtonState.originalSearch;
    
    setSimilarButtonState(prev => ({
      ...prev,
      showSimilar: false
    }));
    
    isSimilarSearchRef.current = false;
    
    // Возвращаемся к оригинальному поиску
    if (originalSearch) {
      const searchType = getSearchType(originalSearch);
      
      if (searchType === 'articles') {
        onFilterChange('search', originalSearch);
        onFilterChange('ownerSearch', '');
      } else if (searchType === 'ownerSearch') {
        onFilterChange('ownerSearch', originalSearch);
        onFilterChange('search', '');
      }
      
      // Восстанавливаем оригинальное значение в поле ввода
      setInputValue(originalSearch);
    } else {
      // Если оригинального поиска нет, очищаем
      onFilterChange('search', '');
      onFilterChange('ownerSearch', '');
      setInputValue('');
    }
  }, [similarButtonState.originalSearch, onFilterChange]);

  // Функция сброса поиска
  const resetSearch = useCallback(() => {
    onFilterChange('search', '');
    onFilterChange('ownerSearch', '');
    
    setSimilarButtonState({
      isVisible: false,
      hasSimilar: false,
      baseCode: '',
      originalSearch: '',
      count: 0,
      showSimilar: false
    });
    
    isSimilarSearchRef.current = false;
    lastPerformedSearchRef.current = '';
  }, [onFilterChange]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    
    // СБРАСЫВАЕМ ОШИБКУ ПРИ ЛЮБОМ ВВОДЕ
    setHasError(false);
    
    // Если значение пустое, только скрываем кнопку
    if (!value) {
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
      return;
    }
    
    // ДЛЯ ДЕСКТОПНОГО ПРИЛОЖЕНИЯ НЕ ВАЛИДИРУЕМ В РЕАЛЬНОМ ВРЕМЕНИ
    // Валидация будет только при нажатии Enter
    
    // Проверяем длину - если меньше 8 символов (XXXX-XXXX), не проверяем
    if (value.length < 8) {
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
      return;
    }
    
    // Проверяем формат XXXX-XXXX
    const baseCode = extractBaseCode(value);
    if (baseCode) {
      checkSimilarProducts(baseCode, value);
    } else {
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    // Сбрасываем ошибку при очистке
    setHasError(false);
    resetSearch();
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleToggleMine = (value) => {
    // При переключении режима очищаем поиск
    if (inputValue) {
      setInputValue('');
      resetSearch();
    }
    
    onFilterChange('mine', value);
  };

  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split('_');
    onFilterChange('sortBy', sortBy);
    onFilterChange('sortOrder', sortOrder);
  };

  const handleMarketplaceChange = (value) => {
    onFilterChange('marketplace', value);
  };

  const handleSizeChange = (value) => {
    onFilterChange('size', value);
  };

  // Обработчик нажатия клавиш
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      // При нажатии Enter проверяем валидность и выполняем поиск
      const value = e.target.value;
      
      if (!value) {
        // При пустом поле очищаем фильтры
        onFilterChange('search', '');
        onFilterChange('ownerSearch', '');
        setHasError(false);
        return;
      }
      
      const isValid = canUseSearchValue(value);
      setHasError(!isValid);
      
      if (isValid) {
        performSearch(value);
      }
    }
  };

  // Компонент кнопки похожих товаров
  const SimilarProductsButton = () => {
    if (!similarButtonState.isVisible) return null;
    
    if (similarButtonState.hasSimilar) {
      if (similarButtonState.showSimilar) {
        // Кнопка "Скрыть похожие"
        return (
          <button
            className="similar-button"
            onClick={handleHideSimilar}
            style={{
              width: '172px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '9px 12px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="span" style={{ paddingTop: "2px" }}>
              {t('filters.hideSimilar')}
            </span> 
          </button>
        );
      } else {
        // Кнопка "Есть похожие"
        return (
          <button
            className="gallery-button"
            onClick={handleShowSimilar}
            style={{
              width: '172px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="span" style={{ paddingTop: "2px" }}>
              {t('filters.showSimilar')}
            </span> 
            <span className="span" style={{ paddingTop: "2px" }}>
              {similarButtonState.count}
            </span>
          </button>
        );
      }
    }
    
    return null;
  };

  // Инициализация при монтировании
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      
      // Устанавливаем начальное значение из пропса
      if (initialSearchValue) {
        setInputValue(initialSearchValue);
        
        // Автоматически выполняем поиск если значение валидно
        if (canUseSearchValue(initialSearchValue)) {
          performSearch(initialSearchValue);
        }
      }
    }
  }, [initialSearchValue, canUseSearchValue, performSearch]);

  return (
    <div className="filters-panel">
      <div className="filters-row">
        {/* Тоггл Все/Мои */}
        <div className="toggle-filter">
          <button
            className={`toggle-btn ${!filters.mine ? 'active' : ''}`}
            onClick={() => handleToggleMine(false)}
          >
            {t('filters.all')}
          </button>
          <button
            className={`toggle-btn ${filters.mine ? 'active' : ''}`}
            onClick={() => handleToggleMine(true)}
          >
            {t('filters.mine')}
          </button>
        </div>

        {/* Поиск по артикулам/владельцу */}
        <div className="search-filter-input">
          <div className="search-input-wrapper">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={getSearchPlaceholder()}
              value={inputValue}
              onChange={handleInputChange}
              onKeyUp={handleKeyPress}
              className={`search-input ${hasError ? 'error' : ''}`}
              disabled={loading}
            />
            {inputValue && (
              <button
                className="search-clear-btn"
                onClick={handleClearSearch}
                type="button"
                disabled={loading}
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {/* Кнопка похожих товаров */}
        <div style={{ width: '172px' }}>
          <SimilarProductsButton />
        </div>
                
        <div className="search-filter-wrapper">
          {/* Фильтр по маркетплейсу */}
          <div className="select-filter">
            <CustomSelect
              options={marketplaceOptions}
              value={filters.marketplace}
              onChange={handleMarketplaceChange}
              className="marketplace-select"
              disabled={loading}
            />
          </div>

          {/* Фильтр по размеру */}
          <div className="select-filter">
            <CustomSelect
              options={getAllSizeOptions}
              value={filters.size}
              onChange={handleSizeChange}
              className="size-select"
              disabled={loading}
            />
          </div>

          {/* Сортировка */}
          <div className="select-filter">
            <CustomSelect
              options={sortOptions}
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={handleSortChange}
              className="sort-select"
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryFilters;