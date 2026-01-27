import { useState, useEffect, useRef, useMemo } from 'react';
import { FiUploadCloud, FiX, FiPlus } from 'react-icons/fi';
import { MdClose } from "react-icons/md";
import './ImageUploadModal.css';

const ImageUploadModal = ({ isOpen, onClose, onUpload, initialFileName }) => {
  const [articles, setArticles] = useState(['']);
  const [fileName, setFileName] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [tagColors, setTagColors] = useState({}); // Сохраняем цвета тегов
  const customTagInputRef = useRef(null);

  // Готовые теги с цветами
  const predefinedTags = useMemo(() => [
    { id: 1, name: 'Belbal', color: '#FF6B6B' },
    { id: 2, name: 'Gemar', color: '#4ECDC4' },
    { id: 3, name: 'Букет', color: '#FFD166' },
    { id: 4, name: 'С ребенком', color: '#06D6A0' },
    { id: 5, name: 'В интерьере', color: '#118AB2' },
    { id: 6, name: 'На природе', color: '#073B4C' },
    { id: 7, name: 'Полиграфия', color: '#EF476F' },
  ], []);

  // Цвета для случайных тегов
  const randomColors = useMemo(() => [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
    '#118AB2', '#073B4C', '#EF476F', '#7209B7',
    '#F15BB5', '#9B5DE5', '#00BBF9', '#00F5D4',
    '#FF9E00', '#8338EC', '#3A86FF', '#FB5607',
    '#5A189A', '#4361EE', '#38B000', '#FF006E'
  ], []);

  // Получить цвет для тега (сохраняем в состоянии)
  const getTagColor = (tagName) => {
    // Сначала ищем в предопределенных тегах
    const predefinedTag = predefinedTags.find(tag => tag.name === tagName);
    if (predefinedTag) {
      return predefinedTag.color;
    }
    
    // Если цвет уже сохранен - возвращаем его
    if (tagColors[tagName]) {
      return tagColors[tagName];
    }
    
    // Иначе генерируем новый цвет и сохраняем
    const randomColor = randomColors[
      Math.floor(Math.random() * randomColors.length)
    ];
    
    // Сохраняем цвет для этого тега
    setTagColors(prev => ({
      ...prev,
      [tagName]: randomColor
    }));
    
    return randomColor;
  };

  // Обновляем состояние fileName когда изменяется initialFileName
  useEffect(() => {
    if (initialFileName) {
      setFileName(initialFileName);
    }
  }, [initialFileName]);

  // Сбрасываем форму при открытии/закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setArticles(['']);
        setFileName('');
        setSelectedTags([]);
        setCustomTag('');
        setTagColors({}); // Сбрасываем цвета тоже
      }, 300);
    } else {
      if (initialFileName) {
        setFileName(initialFileName);
      }
    }
  }, [isOpen, initialFileName]);

  // Валидация артикулов
  const validateArticle = (article) => {
    const articleRegex = /^\d{4}-\d{4}$/;
    return articleRegex.test(article);
  };

  // Проверка всех полей
  useEffect(() => {
    const hasValidArticles = articles.every(article => 
      article === '' || validateArticle(article)
    );
    const hasAtLeastOneArticle = articles.some(article => article.trim() !== '');
    setIsValid(hasValidArticles && hasAtLeastOneArticle && fileName.trim() !== '');
  }, [articles, fileName]);

  const handleArticleChange = (index, value) => {
    const newArticles = [...articles];
    newArticles[index] = value;
    setArticles(newArticles);
  };

  const addArticleField = () => {
    if (articles.length < 5) {
      setArticles([...articles, '']);
    }
  };

  const removeArticleField = (index) => {
    if (articles.length > 1) {
      const newArticles = articles.filter((_, i) => i !== index);
      setArticles(newArticles);
    }
  };

  // Обработчики для тегов
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmedTag = customTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  const handleSubmit = () => {
    const filteredArticles = articles.filter(article => article.trim() !== '');
    const allTags = [...filteredArticles, ...selectedTags];
    
    onClose();
    onUpload(fileName, allTags);
    setArticles(['']);
    setFileName('');
    setSelectedTags([]);
    setCustomTag('');
    setTagColors({});
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setArticles(['']);
      setFileName('');
      setSelectedTags([]);
      setCustomTag('');
      setTagColors({});
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="image-upload-modal-overlay" onClick={handleClose}>
      <div className="image-upload-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="image-upload-modal-content">
          <div className="image-upload-modal-header">
            <h3>Загрузка изображения</h3>
            <button onClick={handleClose} className="image-upload-modal-close">
              <FiX />
            </button>
          </div>
          
          <div className="image-upload-modal-body">
            {/* Поле для имени файла */}
            <div className="image-upload-form-group">
              <label htmlFor="fileName">Имя файла:</label>
              <input
                id="fileName"
                type="text"
                value={fileName || ''}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Введите имя файла"
                className="image-upload-file-name-input"
                autoComplete="off"
              />
              <div className="image-upload-input-hint">
                Будет использовано для сохранения файла
              </div>
            </div>

            {/* Поля для артикулов */}
            <div className="image-upload-form-group">
              <label>Артикулы товаров:</label>
              <div className="image-upload-articles-container">
                {articles.map((article, index) => (
                  <div key={index} className="image-upload-article-input-wrapper">
                    <div className="image-upload-article-input-group">
                      <input
                        type="text"
                        value={article}
                        onChange={(e) => handleArticleChange(index, e.target.value)}
                        placeholder="XXXX-XXXX (например: 1234-5678)"
                        className={`image-upload-article-input ${article && !validateArticle(article) ? 'error' : ''}`}
                        autoComplete="off"
                      />
                      {articles.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeArticleField(index)}
                          className="image-upload-remove-article-btn"
                        >
                          <span>×</span>
                        </button>
                      )}
                    </div>
                    {article && !validateArticle(article) && (
                      <div className="image-upload-error-message">Формат: XXXX-XXXX</div>
                    )}
                  </div>
                ))}
              </div>
              
              {articles.length < 5 && (
                <button 
                  type="button" 
                  onClick={addArticleField}
                  className="image-upload-add-article-btn"
                >
                  + Добавить еще артикул
                </button>
              )}
            </div>

            {/* Раздел для тегов */}
            <div className="image-upload-form-group">
              <label>Теги:</label>
              
              {/* Предопределенные теги */}
              <div className="image-upload-tags-container">
                {predefinedTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.name)}
                    className={`image-upload-tag ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                    style={{
                      '--tag-color': tag.color,
                      '--tag-color-rgb': hexToRgb(tag.color)
                    }}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.name) && <span className="tag-check">✓</span>}
                  </button>
                ))}
              </div>

              {/* Пользовательские теги */}
              <div className="image-upload-custom-tag-container">
                <input
                  ref={customTagInputRef}
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Добавить свой тег"
                  className="image-upload-custom-tag-input"
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  disabled={!customTag.trim()}
                  className="image-upload-add-tag-btn"
                >
                  <FiPlus />
                </button>
              </div>

              {/* Выбранные теги */}
              {selectedTags.length > 0 && (
                <div className="image-upload-selected-tags">
                  <div className="selected-tags-label">Выбрано тегов: {selectedTags.length}</div>
                  <div className="selected-tags-list">
                    {selectedTags.map(tag => {
                      const tagColor = getTagColor(tag);
                      return (
                        <div 
                          key={tag} 
                          className="selected-tag-item"
                          style={{
                            '--selected-tag-color': tagColor,
                            '--selected-tag-color-rgb': hexToRgb(tagColor)
                          }}
                        >
                          <span className="selected-tag-text">{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTag(tag)}
                            className="selected-tag-remove"
                          >
                            <MdClose size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="image-upload-modal-footer">
            <button onClick={handleClose} className="image-upload-btn image-upload-btn-secondary">
              Отмена
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={!isValid}
              className={`image-upload-btn image-upload-btn-primary ${!isValid ? 'disabled' : ''}`}
            >
              <FiUploadCloud /> Загрузить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Вспомогательная функция для преобразования HEX в RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
    : '102, 217, 232'; // fallback color
};

export default ImageUploadModal;