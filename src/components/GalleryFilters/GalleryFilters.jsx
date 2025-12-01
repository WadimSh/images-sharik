import { useContext, useRef, useMemo, useState, useEffect } from "react";
import { LanguageContext } from "../../contexts/contextLanguage";
import { CustomSelect } from "../../ui/CustomSelect/CustomSelect";
import './GalleryFilters.css';

const GalleryFilters = ({ 
  filters, 
  onFilterChange,
  marketplaceSizes 
}) => {
  const { t } = useContext(LanguageContext);
  const searchInputRef = useRef(null);
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [hasError, setHasError] = useState(false);

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
      return 'articles'; // В режиме "Мои" всегда поиск по артикулам
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

  const handleSearchChange = (value) => {
    setSearchValue(value);

    const isError = canUseSearchValue(value);
    setHasError(!isError);
    
    // Очищаем предыдущий таймаут
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Проверяем, можно ли использовать значение для поиска
    if (!canUseSearchValue(value)) {
      // Если нельзя использовать - очищаем поиск
      if (filters.search || filters.ownerSearch) {
        onFilterChange('search', '');
        onFilterChange('ownerSearch', '');
      }
      return;
    }
    
    // Устанавливаем новый таймаут для задержки поиска (500ms)
    const newTimeout = setTimeout(() => {
      const searchType = getSearchType(value);
      
      if (searchType === 'articles') {
        onFilterChange('search', value);
        onFilterChange('ownerSearch', '');
      } else if (searchType === 'ownerSearch') {
        onFilterChange('ownerSearch', value);
        onFilterChange('search', '');
      }

      setHasError(false);
    }, 500);
    
    setTypingTimeout(newTimeout);
  };

  const handleClearSearch = () => {
    setSearchValue('');
    onFilterChange('search', '');
    onFilterChange('ownerSearch', '');
    
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
      onFilterChange('search', '');
      onFilterChange('ownerSearch', '');
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
    if (!filters.search && !filters.ownerSearch) {
      setSearchValue('');
    } else if (filters.search) {
      setSearchValue(filters.search);
    } else if (filters.ownerSearch) {
      setSearchValue(filters.ownerSearch);
    }
  }, [filters.search, filters.ownerSearch]);

  // Проверка на Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && searchValue.length > 0 && canUseSearchValue(searchValue)) {
      const searchType = getSearchType(searchValue);
      
      if (searchType === 'articles') {
        onFilterChange('search', searchValue);
        onFilterChange('ownerSearch', '');
      } else if (searchType === 'ownerSearch') {
        onFilterChange('ownerSearch', searchValue);
        onFilterChange('search', '');
      }
    }
  };

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