import { useContext, useRef, useMemo, useState, useEffect, useCallback } from "react";
import { LanguageContext } from "../../contexts/contextLanguage";
import { CustomSelect } from "../../ui/CustomSelect/CustomSelect";
import { apiCheckArticleHistories } from '../../services/historiesService';
import './GalleryFilters.css';

const GalleryFilters = ({ 
  filters, 
  onFilterChange,
  marketplaceSizes 
}) => {
  const { t } = useContext(LanguageContext);
  const searchInputRef = useRef(null);
  const [searchValue, setSearchValue] = useState(filters.search || filters.ownerSearch || '');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [lastSearchValue, setLastSearchValue] = useState('');
  
  // Состояние для кнопки похожих товаров
  const [similarButtonState, setSimilarButtonState] = useState({
    isVisible: false,
    hasSimilar: false,
    baseCode: '',
    originalSearch: '', // сохраняем оригинальный поиск
    count: 0,
    showSimilar: false
  });

  // Реф для отслеживания, является ли текущий поиск похожим
  const isSimilarSearchRef = useRef(false);

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

  // Функция для извлечения baseCode из searchValue
  const extractBaseCode = useCallback((value) => {
    if (!value) return null;
    
    // Проверяем разные форматы артикулов
    const patterns = [
      /^(\d{4})-\d{4}$/, // XXXX-XXXX
      /^(\d{4})$/,       // XXXX
      /^(\d{4})_/,       // XXXX_...
      /^(\d{4})-/,       // XXXX-...
    ];
    
    for (const pattern of patterns) {
      const match = value.match(pattern);
      if (match) {
        return match[1]; // первые 4 цифры
      }
    }
    
    return null;
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
          count: response.count,
          isLoading: false
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

  // Функция для обновления состояния кнопки на основе текущего поиска
  const updateSimilarButtonFromSearch = useCallback((searchVal) => {
    if (!searchVal) {
      setSimilarButtonState({
        isVisible: false,
        hasSimilar: false,
        baseCode: '',
        originalSearch: '',
        count: 0,
        showSimilar: false
      });
      isSimilarSearchRef.current = false;
      return;
    }
    
    const baseCode = extractBaseCode(searchVal);
    if (baseCode && baseCode !== similarButtonState.baseCode) {
      checkSimilarProducts(baseCode, searchVal);
    }
  }, [extractBaseCode, checkSimilarProducts, similarButtonState.baseCode]);

  // Обработчик клика по кнопке "Показать похожие"
  const handleShowSimilar = useCallback(() => {
    const baseCode = similarButtonState.baseCode;
    const originalSearch = similarButtonState.originalSearch || searchValue;
    
    if (baseCode) {
      // Устанавливаем флаг показа похожих
      setSimilarButtonState(prev => ({
        ...prev,
        showSimilar: true
      }));
      
      isSimilarSearchRef.current = true;
      
      // Выполняем поиск по baseCode, НЕ меняя значение в инпуте
      onFilterChange('search', baseCode);
      onFilterChange('ownerSearch', '');
      
      // Обновляем lastSearchValue чтобы предотвратить повторный запрос
      setLastSearchValue(baseCode);
    }
  }, [similarButtonState.baseCode, similarButtonState.originalSearch, searchValue, onFilterChange]);

  // Обработчик клика по кнопке "Скрыть похожие"
  const handleHideSimilar = useCallback(() => {
    const originalSearch = similarButtonState.originalSearch;
    
    // Сбрасываем флаг показа похожих
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
      
      // Обновляем lastSearchValue
      setLastSearchValue(originalSearch);
    } else {
      // Если оригинального поиска нет, очищаем
      onFilterChange('search', '');
      onFilterChange('ownerSearch', '');
      setLastSearchValue('');
    }
  }, [similarButtonState.originalSearch, onFilterChange]);

  // Определяем плейсхолдер в зависимости от фильтра "Мои"
  const getSearchPlaceholder = () => {
    return filters.mine 
      ? t('filters.searchPlaceholderMine', 'Поиск по артикулам... (минимум 2 цифры)')
      : t('filters.searchPlaceholderAll', 'Поиск по артикулам или автору... (минимум 2 символа)');
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
  const performSearch = (value) => {
    // Если это поиск похожих, не обновляем originalSearch
    if (!isSimilarSearchRef.current) {
      // Проверяем, отличается ли новое значение от последнего отправленного
      if (value === lastSearchValue && value) return;
      
      // Проверяем, есть ли baseCode для поиска похожих
      const baseCode = extractBaseCode(value);
      if (baseCode) {
        checkSimilarProducts(baseCode, value);
      } else {
        // Сбрасываем состояние кнопки если не формат артикула
        setSimilarButtonState(prev => ({
          ...prev,
          isVisible: false,
          hasSimilar: false
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
      
      // Сохраняем последнее отправленное значение
      setLastSearchValue(value);
    }
  };

  // Функция сброса поиска
  const resetSearch = () => {
    onFilterChange('search', '');
    onFilterChange('ownerSearch', '');
    setLastSearchValue('');
    
    // Сбрасываем состояние кнопки похожих
    setSimilarButtonState({
      isVisible: false,
      isLoading: false,
      hasSimilar: false,
      baseCode: '',
      originalSearch: '',
      count: 0,
      showSimilar: false
    });
    
    isSimilarSearchRef.current = false;
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
    
    const isValid = canUseSearchValue(value);
    setHasError(!isValid);
    
    // Очищаем предыдущий таймаут
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Если значение невалидно или пустое - сбрасываем поиск
    if (!isValid || !value) {
      if (filters.search || filters.ownerSearch) {
        resetSearch();
      }
      return;
    }
    
    // Делаем debounce только если значение валидно и не равно последнему отправленному
    if (value !== lastSearchValue) {
      const newTimeout = setTimeout(() => {
        performSearch(value);
        setHasError(false);
      }, 800);
      
      setTypingTimeout(newTimeout);
    }
  };

  const handleClearSearch = () => {
    setSearchValue('');
    resetSearch();
    
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleToggleMine = (value) => {
    // При переключении режима очищаем поиск
    if (searchValue) {
      setSearchValue('');
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

  // Проверка на Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchValue.length > 0 && canUseSearchValue(searchValue)) {
      // Очищаем таймаут при ручном подтверждении
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      performSearch(searchValue);
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

  // Очищаем таймаут при размонтировании
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  // Синхронизируем локальное состояние с внешними фильтрами
  useEffect(() => {
    const currentFilterValue = filters.search || filters.ownerSearch || '';
    
    if (!currentFilterValue) {
      setSearchValue('');
      setLastSearchValue('');
      
      // Сбрасываем состояние кнопки похожих
      if (similarButtonState.isVisible) {
        setSimilarButtonState(prev => ({
          ...prev,
          isVisible: false,
          showSimilar: false
        }));
      }
      isSimilarSearchRef.current = false;
    } else {
      // Обновляем searchValue только если это не поиск похожих
      if (!isSimilarSearchRef.current || currentFilterValue !== similarButtonState.baseCode) {
        setSearchValue(currentFilterValue);
        setLastSearchValue(currentFilterValue);
        
        // Проверяем наличие похожих товаров для нового поиска
        updateSimilarButtonFromSearch(currentFilterValue);
      }
    }
  }, [filters.search, filters.ownerSearch, similarButtonState.baseCode, similarButtonState.isVisible, updateSimilarButtonFromSearch]);

  // При монтировании проверяем текущий поиск на наличие похожих
  useEffect(() => {
    const currentFilterValue = filters.search || filters.ownerSearch || '';
    if (currentFilterValue) {
      updateSimilarButtonFromSearch(currentFilterValue);
    }
  }, []);

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
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyUp={handleKeyPress}
              className={`search-input ${hasError ? 'error' : ''}`}
            />
            {searchValue && (
              <button
                className="search-clear-btn"
                onClick={handleClearSearch}
                type="button"
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
            />
          </div>

          {/* Фильтр по размеру */}
          <div className="select-filter">
            <CustomSelect
              options={getAllSizeOptions}
              value={filters.size}
              onChange={handleSizeChange}
              className="size-select"
            />
          </div>

          {/* Сортировка */}
          <div className="select-filter">
            <CustomSelect
              options={sortOptions}
              value={`${filters.sortBy}_${filters.sortOrder}`}
              onChange={handleSortChange}
              className="sort-select"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryFilters;