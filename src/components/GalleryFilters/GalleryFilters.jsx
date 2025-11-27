import { useContext, useRef, useMemo } from "react";

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
    
    // Собираем все размеры из всех маркетплейсов
    Object.values(marketplaceSizes).forEach(sizes => {
      sizes.forEach(size => {
        allSizes.push(size);
      });
    });
    
    // Убираем дубликаты по fileName
    const uniqueSizes = allSizes.reduce((acc, size) => {
      if (!acc.find(s => s.fileName === size.fileName)) {
        acc.push(size);
      }
      return acc;
    }, []);
    
    // Сортируем по размеру (можно настроить логику сортировки)
    uniqueSizes.sort((a, b) => {
      // Сортируем по ширине, затем по высоте
      if (a.width !== b.width) return a.width - b.width;
      return a.height - b.height;
    });
    
    // Преобразуем в объект для селекта
    const options = { '': t('filters.allSizes') };
    uniqueSizes.forEach(size => {
      options[size.fileName] = size.label;
    });
    
    return options;
  }, [marketplaceSizes, t]);

  // Определяем плейсхолдер в зависимости от фильтра "Мои"
  const getSearchPlaceholder = () => {
    return filters.mine 
      ? t('filters.searchPlaceholderMine', 'Поиск по артикулам...')
      : t('filters.searchPlaceholderAll', 'Поиск по артикулам или автору...');
  };

  const handleSearchChange = (value) => {
    onFilterChange('search', value);
  };

  const handleClearSearch = () => {
    onFilterChange('search', '');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleToggleMine = (value) => {
    onFilterChange('mine', value);
  };

  const handleSortChange = (value) => {
    const [sortBy, sortOrder] = value.split('_');
    onFilterChange('sortBy', sortBy);
    onFilterChange('sortOrder', sortOrder);
  };

  const handleMarketplaceChange = (value) => {
    onFilterChange('marketplace', value);
    // Теперь размер не сбрасывается при смене маркетплейса
  };

  const handleSizeChange = (value) => {
    onFilterChange('size', value);
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
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            {filters.search && (
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

          {/* Фильтр по размеру - теперь независимый */}
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