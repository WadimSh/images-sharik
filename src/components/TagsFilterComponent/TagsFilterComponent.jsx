import { useState } from 'react';
import { IoSearch } from "react-icons/io5";

import { PREDEFINED_TAGS } from '../../constants/tags';
import './TagsFilterComponent.css';

export const TagsFilterComponent = ({ selectedFilterTags, onTagToggle, onClearAll, currentPage, setCurrentPage }) => {
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [customFilterTag, setCustomFilterTag] = useState('');
  const [filterSearchInput, setFilterSearchInput] = useState('');

  // Обработчик добавления кастомного тега
  const handleAddCustomFilterTag = () => {
    const trimmedTag = customFilterTag.trim();
    if (trimmedTag && !selectedFilterTags.includes(trimmedTag)) {
      onTagToggle(trimmedTag);
      setCustomFilterTag('');
      setCurrentPage(1);
    }
  };

  // Фильтрация предопределенных тегов по поиску
  const getFilteredPredefinedTags = () => {
    if (!filterSearchInput.trim()) return PREDEFINED_TAGS;
    
    const searchLower = filterSearchInput.toLowerCase();
    return PREDEFINED_TAGS.filter(tag => 
      tag.name.toLowerCase().includes(searchLower)
    );
  };

  return (
    <div className="tags-filter-section">
      <button 
        className={`tags-filter-toggle ${showTagFilter ? 'active' : ''}`}
        onClick={() => setShowTagFilter(!showTagFilter)}
      >
        <IoSearch size={18}/>
        <span>Фильтр по тегам</span>
        {selectedFilterTags.length > 0 && (
          <span className="filter-badge">{selectedFilterTags.length}</span>
        )}
      </button>

      {showTagFilter && (
        <div className="tags-filter-dropdown">
          <div className="filter-header">
            <h4>Фильтровать изображения по тегам</h4>
            {selectedFilterTags.length > 0 && (
              <button 
                className="clear-filters-btn"
                onClick={() => {
                  onClearAll();
                  setCurrentPage(1);
                }}
              >
                ✕ Очистить все
              </button>
            )}
          </div>

          {/* Поиск по тегам 
          <div className="filter-search">
            <input
              type="text"
              value={filterSearchInput}
              onChange={(e) => setFilterSearchInput(e.target.value)}
              placeholder="Поиск тегов..."
              className="filter-search-input"
            />
          </div>*/}

          {/* Выбранные теги фильтра */}
          {selectedFilterTags.length > 0 && (
            <div className="selected-filters-section">
              <div className="selected-filters-header">
                <span>Выбрано тегов для фильтрации: {selectedFilterTags.length}</span>
              </div>
              <div className="selected-filters-grid">
                {selectedFilterTags.map(tag => {
                  const predefinedTag = PREDEFINED_TAGS.find(t => t.name === tag);
                  return (
                    <div 
                      key={tag} 
                      className="selected-filter-tag"
                      style={predefinedTag ? { 
                        backgroundColor: predefinedTag.color + '20',
                        borderColor: predefinedTag.color 
                      } : {}}
                    >
                      <span className="selected-filter-text">{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          onTagToggle(tag);
                          setCurrentPage(1);
                        }}
                        className="selected-filter-remove"
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
          <div className="filter-tags-section">
            <div className="section-title">Tеги:</div>
            <div className="filter-tags-grid">
              {getFilteredPredefinedTags().map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    onTagToggle(tag.name);
                    setCurrentPage(1);
                  }}
                  className={`filter-tag-btn ${selectedFilterTags.includes(tag.name) ? 'selected' : ''}`}
                  style={{ 
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                    borderColor: tag.color
                  }}
                >
                  {tag.name}
                  {selectedFilterTags.includes(tag.name) && <span className="tag-check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Добавление своего тега для фильтрации */}
          <div className="filter-custom-tag-section">
            <div className="section-title">Добавить свой тег:</div>
            <div className="filter-custom-tag-input-group">
              <input
                type="text"
                value={customFilterTag}
                onChange={(e) => setCustomFilterTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomFilterTag()}
                placeholder="Введите тег для фильтрации"
                className="filter-form-input"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleAddCustomFilterTag}
                disabled={!customFilterTag.trim()}
                className="add-filter-tag-btn"
              >
                Добавить
              </button>
            </div>
            <div className="filter-hint">
              Можно ввести артикул (XXXX-XXXX), название или слово
            </div>
          </div>
        </div>
      )}
    </div>
  );
};