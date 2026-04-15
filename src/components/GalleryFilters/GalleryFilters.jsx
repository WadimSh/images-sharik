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
  
  const [inputValue, setInputValue] = useState('');
  const [hasError, setHasError] = useState(false);
  
  const [similarButtonState, setSimilarButtonState] = useState({
    isVisible: false,
    hasSimilar: false,
    baseCode: '',
    originalSearch: '',
    count: 0,
    showSimilar: false,
    isLoading: false // Добавляем состояние загрузки
  });

  const isSimilarSearchRef = useRef(false);
  const isInitialMountRef = useRef(true);
  const lastPerformedSearchRef = useRef('');
  const checkSimilarTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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

  const extractBaseCode = useCallback((value) => {
    if (!value) return null;
    
    const pattern = /^(\d{4})-\d{4}$/;
    const match = value.match(pattern);
    
    return match ? match[1] : null;
  }, []);

  // Проверка наличия похожих товаров (вызывается только после основного поиска)
  const checkSimilarProducts = useCallback(async (baseCode, currentSearchValue) => {
    if (!baseCode) return;
    
    // Очищаем предыдущий таймаут
    if (checkSimilarTimeoutRef.current) {
      clearTimeout(checkSimilarTimeoutRef.current);
    }
    
    // Устанавливаем состояние видимости кнопки сразу
    setSimilarButtonState(prev => ({
      ...prev,
      isVisible: true,
      baseCode,
      originalSearch: currentSearchValue || '',
      isLoading: true
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
          isVisible: false,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error checking similar products:', error);
      setSimilarButtonState(prev => ({
        ...prev,
        hasSimilar: false,
        isVisible: false,
        isLoading: false
      }));
    }
  }, []);

  const getSearchPlaceholder = () => {
    return filters.mine 
      ? t('filters.searchPlaceholderMine')
      : t('filters.searchPlaceholderAll');
  };

  const getSearchType = (value) => {
    if (!value || value.length < 2) return null;
    
    const firstTwoChars = value.substring(0, 2);
    
    if (filters.mine) {
      return 'articles';
    }
    
    if (/^\d{2}/.test(firstTwoChars)) {
      return 'articles';
    }
    
    return 'ownerSearch';
  };

  const canUseSearchValue = (value) => {
    if (value.length < 2) return false;
    
    if (filters.mine) {
      const firstTwoChars = value.substring(0, 2);
      return /^\d{2}/.test(firstTwoChars);
    }
    
    return true;
  };

  // Функция отправки поискового запроса
  const performSearch = useCallback((value) => {
    // Очищаем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value || !canUseSearchValue(value)) {
      onFilterChange('search', '');
      onFilterChange('ownerSearch', '');
      lastPerformedSearchRef.current = '';
      
      // Скрываем кнопку похожих при пустом поиске
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
      return;
    }
    
    if (value === lastPerformedSearchRef.current) return;
    
    if (isSimilarSearchRef.current && value !== similarButtonState.baseCode) {
      isSimilarSearchRef.current = false;
      setSimilarButtonState(prev => ({
        ...prev,
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
    
    // ЗАДЕРЖКА перед проверкой похожих товаров
    // Это дает время основному запросу выполниться первым
    const baseCode = extractBaseCode(value);
    if (baseCode) {
      checkSimilarTimeoutRef.current = setTimeout(() => {
        checkSimilarProducts(baseCode, value);
      }, 500); // Задержка 500ms после выполнения основного поиска
    } else {
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
    }
  }, [canUseSearchValue, onFilterChange, extractBaseCode, checkSimilarProducts, similarButtonState.baseCode]);

  const handleShowSimilar = useCallback(() => {
    const baseCode = similarButtonState.baseCode;
    const originalSearch = similarButtonState.originalSearch || inputValue;
    
    if (baseCode) {
      setSimilarButtonState(prev => ({
        ...prev,
        showSimilar: true
      }));
      
      isSimilarSearchRef.current = true;
      
      // СНАЧАЛА выполняем поиск по baseCode
      onFilterChange('search', baseCode);
      onFilterChange('ownerSearch', '');
      
      // Сохраняем оригинальное значение в поле ввода
      setInputValue(originalSearch);
      
      // ЗАДЕРЖКА перед обновлением lastPerformedSearchRef
      setTimeout(() => {
        lastPerformedSearchRef.current = baseCode;
      }, 100);
    }
  }, [similarButtonState.baseCode, similarButtonState.originalSearch, inputValue, onFilterChange]);

  const handleHideSimilar = useCallback(() => {
    const originalSearch = similarButtonState.originalSearch;
    
    setSimilarButtonState(prev => ({
      ...prev,
      showSimilar: false
    }));
    
    isSimilarSearchRef.current = false;
    
    if (originalSearch) {
      const searchType = getSearchType(originalSearch);
      
      if (searchType === 'articles') {
        onFilterChange('search', originalSearch);
        onFilterChange('ownerSearch', '');
      } else if (searchType === 'ownerSearch') {
        onFilterChange('ownerSearch', originalSearch);
        onFilterChange('search', '');
      }
      
      setInputValue(originalSearch);
      
      setTimeout(() => {
        lastPerformedSearchRef.current = originalSearch;
      }, 100);
    } else {
      onFilterChange('search', '');
      onFilterChange('ownerSearch', '');
      setInputValue('');
    }
  }, [similarButtonState.originalSearch, onFilterChange]);

  const resetSearch = useCallback(() => {
    // Очищаем все таймауты
    if (checkSimilarTimeoutRef.current) {
      clearTimeout(checkSimilarTimeoutRef.current);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    onFilterChange('search', '');
    onFilterChange('ownerSearch', '');
    
    setSimilarButtonState({
      isVisible: false,
      hasSimilar: false,
      baseCode: '',
      originalSearch: '',
      count: 0,
      showSimilar: false,
      isLoading: false
    });
    
    isSimilarSearchRef.current = false;
    lastPerformedSearchRef.current = '';
  }, [onFilterChange]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setHasError(false);
    
    // Очищаем предыдущие таймауты при вводе
    if (checkSimilarTimeoutRef.current) {
      clearTimeout(checkSimilarTimeoutRef.current);
    }
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (!value) {
      setSimilarButtonState(prev => ({
        ...prev,
        isVisible: false,
        hasSimilar: false,
        showSimilar: false
      }));
      return;
    }
  };

  const handleClearSearch = () => {
    setInputValue('');
    setHasError(false);
    resetSearch();
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleToggleMine = (value) => {
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const value = e.target.value;
      
      if (!value) {
        onFilterChange('search', '');
        onFilterChange('ownerSearch', '');
        setHasError(false);
        resetSearch();
        return;
      }
      
      const isValid = canUseSearchValue(value);
      setHasError(!isValid);
      
      if (isValid) {
        performSearch(value);
      }
    }
  };

  const SimilarProductsButton = () => {
    if (!similarButtonState.isVisible) return null;
    
    if (similarButtonState.isLoading) {
      return null
    }
    
    if (similarButtonState.hasSimilar) {
      if (similarButtonState.showSimilar) {
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

  // Очистка таймаутов при размонтировании
  useEffect(() => {
    return () => {
      if (checkSimilarTimeoutRef.current) {
        clearTimeout(checkSimilarTimeoutRef.current);
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Инициализация при монтировании
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      
      if (initialSearchValue) {
        setInputValue(initialSearchValue);
        
        if (canUseSearchValue(initialSearchValue)) {
          // Задержка перед выполнением поиска при инициализации
          searchTimeoutRef.current = setTimeout(() => {
            performSearch(initialSearchValue);
          }, 100);
        }
      }
    }
  }, [initialSearchValue, canUseSearchValue, performSearch]);

  return (
    <div className="filters-panel">
      <div className="filters-row">
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
        
        <div style={{ width: '172px' }}>
          <SimilarProductsButton />
        </div>
                
        <div className="search-filter-wrapper">
          <div className="select-filter">
            <CustomSelect
              options={marketplaceOptions}
              value={filters.marketplace}
              onChange={handleMarketplaceChange}
              className="marketplace-select"
              disabled={loading}
            />
          </div>

          <div className="select-filter">
            <CustomSelect
              options={getAllSizeOptions}
              value={filters.size}
              onChange={handleSizeChange}
              className="size-select"
              disabled={loading}
            />
          </div>

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