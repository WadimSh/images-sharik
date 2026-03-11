// components/SidebarFilters/SidebarFilters.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { FaSearch, FaTimes, FaChevronDown, FaChevronUp, FaTag, FaUser, FaSort } from 'react-icons/fa';
import { RiFilterFill } from 'react-icons/ri';
import { IoMdImages } from 'react-icons/io';
import { LanguageContext } from '../../contexts/contextLanguage';
import { PREDEFINED_TAGS } from '../../constants/tags';
import './SidebarFilters.css';

// Функция транслитерации
const transliterateText = (text) => {
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
  
  let result = text.replace(/[а-яёА-ЯЁ]/g, char => translitMap[char] || char);
  
  result = result.replace(/[^\w\s.-]/g, '_'); 
  result = result.replace(/\s+/g, '_'); 
  result = result.replace(/_+/g, '_'); 
  result = result.replace(/^_+|_+$/g, ''); 
  
  return result;
};

const SidebarFilters = ({ 
  isOpen, 
  onClose, 
  filters, 
  onFilterChange,
  onApplyFilters,
  onResetFilters,
  totalResults 
}) => {
  const { t } = useContext(LanguageContext);
  const sidebarRef = useRef(null);
  
  const [expandedSections, setExpandedSections] = useState({
    search: true,
    tags: true,
    article: true,
    author: true,
    sort: true
  });

  const [localFilters, setLocalFilters] = useState(filters);
  const [customTagInput, setCustomTagInput] = useState('');
  const [tagSearchInput, setTagSearchInput] = useState('');
  
  // Отдельное состояние для отображаемого текста в поиске
  const [searchDisplayValue, setSearchDisplayValue] = useState(filters.search || '');

  // Закрытие по клику на оверлей
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Обработчик нажатия Escape
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Обновление локальных фильтров при изменении пропсов
  useEffect(() => {
    setLocalFilters(filters);
    setSearchDisplayValue(filters.search || '');
  }, [filters]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Обработчик для поиска с транслитерацией под капотом
  const handleSearchChange = (e) => {
    const rawValue = e.target.value;
    setSearchDisplayValue(rawValue); // Показываем пользователю то, что он ввел
    
    // Транслитерируем для отправки в запрос
    const hasCyrillic = /[а-яёА-ЯЁ]/.test(rawValue);
    const processedValue = hasCyrillic ? transliterateText(rawValue) : rawValue;
    
    setLocalFilters(prev => ({
      ...prev,
      search: processedValue // Сохраняем транслитерированное значение
    }));
  };

  // Очистка поля поиска
  const clearSearch = () => {
    setSearchDisplayValue('');
    setLocalFilters(prev => ({
      ...prev,
      search: ''
    }));
  };

  // Очистка поля автора
  const clearAuthor = () => {
    setLocalFilters(prev => ({
      ...prev,
      author: ''
    }));
  };

  // Очистка поля артикула
  const clearArticle = () => {
    setLocalFilters(prev => ({
      ...prev,
      article: ''
    }));
  };

  // Обработчик добавления кастомного тега
  const handleAddCustomTag = () => {
    const trimmedTag = customTagInput.trim();
    if (trimmedTag && !localFilters.tags.includes(trimmedTag)) {
      setLocalFilters(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setCustomTagInput('');
    }
  };

  // Удаление тега
  const handleRemoveTag = (tagToRemove) => {
    setLocalFilters(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Обработчик переключения предопределенного тега
  const handlePredefinedTagToggle = (tagName) => {
    setLocalFilters(prev => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tagName)
        ? currentTags.filter(t => t !== tagName)
        : [...currentTags, tagName];
      return {
        ...prev,
        tags: newTags
      };
    });
  };

  // Фильтрация предопределенных тегов по поиску
  const getFilteredPredefinedTags = () => {
    if (!tagSearchInput.trim()) return PREDEFINED_TAGS;
    
    const searchLower = tagSearchInput.toLowerCase();
    return PREDEFINED_TAGS.filter(tag => 
      tag.name.toLowerCase().includes(searchLower)
    );
  };

  const handleArticleChange = (value) => {
    // Форматирование артикула XXXX-XXXX
    let formatted = value.replace(/[^\d-]/g, '');
    if (formatted.length > 4 && !formatted.includes('-')) {
      formatted = formatted.slice(0, 4) + '-' + formatted.slice(4, 8);
    }
    if (formatted.length > 9) {
      formatted = formatted.slice(0, 9);
    }
    
    setLocalFilters(prev => ({
      ...prev,
      article: formatted
    }));
  };

  const handleApply = () => {
    onFilterChange(localFilters);
    onApplyFilters();
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      tags: [],
      article: '',
      author: '',
      sortBy: 'uploadDate',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
    setSearchDisplayValue('');
    onFilterChange(resetFilters);
    onResetFilters();
    setCustomTagInput('');
    setTagSearchInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="sidebar-filters-overlay" onClick={handleOverlayClick}>
      <div className="sidebar-filters" ref={sidebarRef}>
        <div className="sidebar-filters-header">
          <div className="header-title">
            <RiFilterFill className="filter-icon" />
            <h3>Фильтры</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="sidebar-filters-content">
          {/* Поиск по имени файла */}
          <div className="filter-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('search')}
            >
              <div className="section-title">
                <FaSearch className="section-icon" />
                <span>Поиск по названию</span>
              </div>
              {expandedSections.search ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
            </div>
            {expandedSections.search && (
              <div className="section-content">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Введите название файла..."
                    value={searchDisplayValue}
                    onChange={handleSearchChange}
                    className="filter-input"
                  />
                  {searchDisplayValue && (
                    <button 
                      className="clear-input-btn"
                      onClick={clearSearch}
                      type="button"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Поиск по автору */}
          <div className="filter-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('author')}
            >
              <div className="section-title">
                <FaUser className="section-icon" />
                <span>Автор</span>
              </div>
              {expandedSections.author ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
            </div>
            {expandedSections.author && (
              <div className="section-content">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Введите имя автора..."
                    value={localFilters.author || ''}
                    onChange={(e) => handleInputChange('author', e.target.value)}
                    className="filter-input"
                  />
                  {localFilters.author && (
                    <button 
                      className="clear-input-btn"
                      onClick={clearAuthor}
                      type="button"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Поиск по артикулу */}
          <div className="filter-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('article')}
            >
              <div className="section-title">
                <IoMdImages className="section-icon" />
                <span>Поиск по артикулу</span>
              </div>
              {expandedSections.article ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
            </div>
            {expandedSections.article && (
              <div className="section-content">
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="XXXX-XXXX"
                    value={localFilters.article || ''}
                    onChange={(e) => handleArticleChange(e.target.value)}
                    className="filter-input article-input"
                    maxLength="9"
                  />
                  {localFilters.article && (
                    <button 
                      className="clear-input-btn"
                      onClick={clearArticle}
                      type="button"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                <small className="input-hint">Формат: 1234-5678</small>
              </div>
            )}
          </div>

          {/* Фильтр по тегам */}
          <div className="filter-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('tags')}
            >
              <div className="section-title">
                <FaTag className="section-icon" />
                <span>Теги</span>
              </div>
              {expandedSections.tags ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
            </div>
            {expandedSections.tags && (
              <div className="section-content">
                {/* Поиск по тегам 
                <div className="tag-search-wrapper">
                  <FaSearch className="tag-search-icon" />
                  <input
                    type="text"
                    value={tagSearchInput}
                    onChange={(e) => setTagSearchInput(e.target.value)}
                    placeholder="Поиск тегов..."
                    className="tag-search-input"
                  />
                </div>*/}

                {/* Выбранные теги */}
                {localFilters.tags.length > 0 && (
                  <div className="selected-tags-section">
                    <div className="selected-tags-header">
                      <span className="selected-tags-count">Выбрано: {localFilters.tags.length}</span>
                      <button 
                        className="clear-tags-btn"
                        onClick={() => handleInputChange('tags', [])}
                      >
                        Очистить все
                      </button>
                    </div>
                    <div className="selected-tags-grid">
                      {localFilters.tags.map(tag => {
                        const predefinedTag = PREDEFINED_TAGS.find(t => t.name === tag);
                        return (
                          <div 
                            key={tag} 
                            className="selected-tag-item"
                          >
                            <span className="selected-tag-text" style={predefinedTag ? { color: predefinedTag.color } : {}}>
                              {tag}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="selected-tag-remove"
                            >
                              ×
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Предопределенные теги */}
                <div className="predefined-tags-section">
                  <div className="tags-grid">
                    {getFilteredPredefinedTags().map(tag => (
                      <button
                        key={tag.id}
                        className={`tag-btn ${localFilters.tags.includes(tag.name) ? 'active' : ''}`}
                        style={{ 
                          borderColor: tag.color,
                          color: localFilters.tags.includes(tag.name) ? 'white' : tag.color,
                          backgroundColor: localFilters.tags.includes(tag.name) ? tag.color : 'transparent'
                        }}
                        onClick={() => handlePredefinedTagToggle(tag.name)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Добавление своего тега */}
                <div className="custom-tag-section">
                  <div className="section-subtitle">Указать свой тег:</div>
                  <div className="custom-tag-input-group">
                    <input
                      type="text"
                      value={customTagInput}
                      onChange={(e) => setCustomTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                      placeholder="Например: Школа, Сервировка"
                      className="custom-tag-input"
                      autoComplete="off"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomTag}
                      disabled={!customTagInput.trim()}
                      className="add-tag-btn"
                    >
                      Добавить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Сортировка */}
          <div className="filter-section">
            <div 
              className="section-header"
              onClick={() => toggleSection('sort')}
            >
              <div className="section-title">
                <FaSort className="section-icon" />
                <span>Сортировка</span>
              </div>
              {expandedSections.sort ? <FaChevronUp className="chevron-icon" /> : <FaChevronDown className="chevron-icon" />}
            </div>
            {expandedSections.sort && (
              <div className="section-content">
                <select
                  value={localFilters.sortBy || 'uploadDate'}
                  onChange={(e) => handleInputChange('sortBy', e.target.value)}
                  className="sort-select"
                >
                  <option value="uploadDate">По дате загрузки</option>
                  <option value="fileName">По имени файла</option>
                  <option value="size">По размеру</option>
                </select>
                
                <div className="sort-order">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="desc"
                      checked={(localFilters.sortOrder || 'desc') === 'desc'}
                      onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                    />
                    <span>Сначала новые</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sortOrder"
                      value="asc"
                      checked={(localFilters.sortOrder || 'desc') === 'asc'}
                      onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                    />
                    <span>Сначала старые</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="sidebar-filters-footer">
          <div className="filter-stats">
            <IoMdImages className="stats-icon" />
            <span>
              Найдено: <strong>{totalResults}</strong> {totalResults === 1 ? 'изображение' : 
                totalResults > 1 && totalResults < 5 ? 'изображения' : 'изображений'}
            </span>
          </div>
          <div className="filter-actions">
            <button className="reset-btn" onClick={handleReset}>
              Сбросить
            </button>
            <button className="apply-btn" onClick={handleApply}>
              Применить фильтры
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarFilters;