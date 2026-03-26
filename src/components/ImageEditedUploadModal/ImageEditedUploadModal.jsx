import { useState, useEffect, useRef, useMemo } from 'react';
import { FiX, FiPlus, FiArrowLeft, FiUser, FiCheck, FiEdit2 } from 'react-icons/fi';
import { MdClose } from "react-icons/md";

import { PREDEFINED_TAGS } from '../../constants/tags';
import './ImageEditedUploadModal.css';

const ImageEditedUploadModal = ({ 
  isOpen, 
  onClose, 
  onUpload, 
  user, 
  selectedFile,
  existingImageData // Новый пропс с данными существующего изображения
}) => {
  const [articles, setArticles] = useState(['']);
  const [imageDescription, setImageDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [tagColors, setTagColors] = useState({});
  const [step, setStep] = useState(1); // 1 - ввод данных, 2 - подтверждение
  const [imageInfo, setImageInfo] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const customTagInputRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const EXCLUDED_TAGS = ['Wildberries', 'Ozon'];
  
  // Проверяем размер экрана
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 570);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Создаем превью изображения и извлекаем данные из существующего файла
  useEffect(() => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        
        // Получаем размеры изображения
        const img = new Image();
        img.onload = () => {
          setImageDimensions({
            width: img.width,
            height: img.height
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile]);

  // Инициализация данных из существующего изображения
const extractDescriptionFromFileName = (fileName, articles) => {
  if (!fileName) return '';
  
  // Убираем расширение
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
  
  // Убираем хвост с размерами и датой
  const tailRegex = /_\d+x\d+_\d{8}_\d{6}$/;
  let nameWithoutTail = nameWithoutExt.replace(tailRegex, '');
  
  // Если хвост не найден, пробуем другой формат
  if (nameWithoutTail === nameWithoutExt) {
    // Пробуем найти хвост с другим разделителем
    const altTailRegex = /_\d+x\d+_\d{8}_\d{6}$/i;
    nameWithoutTail = nameWithoutExt.replace(altTailRegex, '');
  }
  
  // Разбиваем на части
  const parts = nameWithoutTail.split('_');
  
  // Если есть артикулы, удаляем их из начала
  let descriptionParts = [...parts];
  
  // Удаляем артикулы из начала
  articles.forEach(article => {
    const index = descriptionParts.findIndex(part => part === article);
    if (index !== -1) {
      descriptionParts.splice(index, 1);
    }
  });
  
  // Удаляем признак хранилища (BW или ED)
  const storageIndex = descriptionParts.findIndex(part => part === 'BW' || part === 'ED' || part === 'WB' || part === 'OZ');
  if (storageIndex !== -1) {
    descriptionParts.splice(storageIndex, 1);
  }
  
  // Оставшиеся части - это описание (может содержать подчеркивания)
  let description = descriptionParts.join('_');
  
  // Декодируем URL-encoded символы
  try {
    description = decodeURIComponent(description);
  } catch (e) {
    // Если декодирование не удалось, оставляем как есть
  }
  
  return description;
};

// Функция для фильтрации исключенных тегов
const filterExcludedTags = (tags) => {
  if (!tags) return [];
  return tags.filter(tag => !EXCLUDED_TAGS.includes(tag));
};

// Использование в useEffect
useEffect(() => {
  if (existingImageData && isOpen) {
    // Извлекаем артикулы из тегов
    const articleRegex = /^\d{4}-\d{4}$/;
    const allTags = existingImageData.tags || [];
    
    // Фильтруем исключенные теги
    const filteredTags = filterExcludedTags(allTags);

    const existingArticles = filteredTags.filter(tag => articleRegex.test(tag)) || [];
    const existingNonArticles = filteredTags.filter(tag => !articleRegex.test(tag)) || [];
    
    // Устанавливаем артикулы
    if (existingArticles.length > 0) {
      setArticles(existingArticles);
    } else {
      setArticles(['']);
    }
    
    // Устанавливаем остальные теги
    setSelectedTags(existingNonArticles);
    
    // Извлекаем описание из имени файла
    const description = extractDescriptionFromFileName(
      existingImageData.fileName,
      existingArticles
    );
    
    setImageDescription(description);
  }
}, [existingImageData, isOpen]);

  // Генерация имени файла на основе введенных данных
  const generateFileName = () => {
    // 1. Артикулы
    const validArticles = articles.filter(article => article.trim() !== '' && /^\d{4}-\d{4}$/.test(article));
    const articlesPart = validArticles.join('_');
    
    // 2. Признак редактированного изображения
    const storagePart = 'edited';
    
    // 3. Описание от пользователя (транслитерируем и приводим к нижнему регистру)
    const descriptionPart = formatDescription(imageDescription) || 'image';
    
    // 4. Размер изображения
    const dimensionsPart = `${imageDimensions.width}x${imageDimensions.height}`;
    
    // 5. Дата загрузки в формате ДДММГГГГ
    const now = new Date();
    const datePart = now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '');
    
    // 6. Время загрузки
    const timePart = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/:/g, '');
    
    // Собираем все части
    const fileNameParts = [
      articlesPart,
      descriptionPart,
      storagePart,
      dimensionsPart,
      `${datePart}_${timePart}`
    ].filter(part => part && part.trim()); // Убираем пустые части
    
    return `${fileNameParts.join('_')}.webp`;
  };

  // Транслитерация для автоматической генерации
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

  const formatDescription = (description) => {
    const cleaned = description.trim();
    const transliterated = transliterateText(cleaned);
    return transliterated.toLowerCase();
  };

  // Цвета для случайных тегов
  const randomColors = useMemo(() => [
    '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0',
    '#118AB2', '#073B4C', '#EF476F', '#7209B7',
    '#F15BB5', '#9B5DE5', '#00BBF9', '#00F5D4',
    '#FF9E00', '#8338EC', '#3A86FF', '#FB5607',
    '#5A189A', '#4361EE', '#38B000', '#FF006E'
  ], []);

  // Получить цвет для тега
  const getTagColor = (tagName) => {
    const predefinedTag = PREDEFINED_TAGS.find(tag => tag.name === tagName);
    if (predefinedTag) {
      return predefinedTag.color;
    }
    
    if (tagColors[tagName]) {
      return tagColors[tagName];
    }
    
    const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
    setTagColors(prev => ({ ...prev, [tagName]: randomColor }));
    return randomColor;
  };

  // Сбрасываем форму при закрытии
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        if (!existingImageData) {
          setArticles(['']);
          setImageDescription('');
          setSelectedTags([]);
        }
        setCustomTag('');
        setTagColors({});
        setStep(1);
        setImageInfo(null);
        setImagePreview(null);
        setImageDimensions({ width: 0, height: 0 });
      }, 300);
    }
  }, [isOpen, existingImageData]);

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
    const isDescriptionValid = imageDescription.trim().length > 0 && imageDescription.length <= 40;
    const hasSelectedTags = selectedTags.some(tag => tag.trim() !== '');
    
    setIsValid(hasValidArticles && hasAtLeastOneArticle && isDescriptionValid && hasSelectedTags);
  }, [articles, imageDescription, selectedTags]);

  const handleArticleChange = (index, value) => {
    const newArticles = [...articles];
    newArticles[index] = value;
    setArticles(newArticles);
  };

  const addArticleField = () => {
    if (articles.length < 10) {
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
    if (EXCLUDED_TAGS.includes(tag)) {
      return;
    }

    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (EXCLUDED_TAGS.includes(customTag.trim())) {
      setCustomTag('');
      return;
    }
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

  // Подготовка данных для второго этапа
  const prepareImageInfo = () => {
    const filteredArticles = articles.filter(article => article.trim() !== '' && validateArticle(article));
    const allTags = [...filteredArticles, ...selectedTags];
    
    // Форматируем размер файла
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Генерируем финальное имя файла
    const finalFileName = generateFileName();

    return {
      originalFileName: selectedFile?.name || existingImageData?.fileName || '',
      imageDescription: imageDescription,
      finalFileName,
      articles: filteredArticles,
      tags: selectedTags,
      allTags,
      dimensions: `${imageDimensions.width} × ${imageDimensions.height}`,
      fileSize: formatFileSize(selectedFile?.size || 0),
      author: user?.name || user?.email || 'Неизвестный пользователь',
      previewUrl: imagePreview,
      mimeType: selectedFile?.type || 'image/webp',
      storageType: 'ED',
      uploadDate: new Date().toLocaleString('ru-RU')
    };
  };

  const handleNextStep = () => {
    const imageData = prepareImageInfo();
    setImageInfo(imageData);
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleFinalSubmit = () => {
    if (imageInfo) {
      // Закрываем модалку
      onClose();
      
      // Передаем данные в handleUpload
      setTimeout(() => {
        onUpload(imageInfo.finalFileName, imageInfo.allTags);
      }, 100);
      
      // Сбрасываем состояние
      setTimeout(() => {
        if (!existingImageData) {
          setArticles(['']);
          setImageDescription('');
          setSelectedTags([]);
        }
        setCustomTag('');
        setTagColors({});
        setStep(1);
        setImageInfo(null);
        setImagePreview(null);
        setImageDimensions({ width: 0, height: 0 });
      }, 300);
    }
  };

  const handleClose = (e) => {
    e.stopPropagation(); 
    onClose();
    setTimeout(() => {
      if (!existingImageData) {
        setArticles(['']);
        setImageDescription('');
        setSelectedTags([]);
      }
      setCustomTag('');
      setTagColors({});
      setStep(1);
      setImageInfo(null);
      setImagePreview(null);
      setImageDimensions({ width: 0, height: 0 });
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="image-upload-modal-overlay" onClick={handleClose}>
      <div 
        className="image-upload-modal-container" 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // Останавливаем всплытие всех событий клавиатуры
          e.stopPropagation();
        }}
        tabIndex={-1}
      >
        <div className="image-upload-modal-content">
          {/* Заголовок */}
          <div className="image-upload-modal-header">
            {step === 2 && (
              <button onClick={handlePrevStep} className="image-upload-back-btn">
                <FiArrowLeft />
              </button>
            )}
            <h3>
              {step === 1 ? 'Сохранение отредактированного изображения' : 'Подтверждение сохранения'}
            </h3>
            <button onClick={handleClose} className="image-upload-modal-close">
              <FiX />
            </button>
          </div>

          {/* Мобильное сообщение */}
          {isMobile && step === 1 && (
            <div className="mobile-upload-hint">
              <div className="hint-content">
                <span>
                  <strong>Обратите внимание!</strong> 
                  Вы можете изменить теги перед сохранением.
                </span>
              </div>
            </div>
          )}

          {/* Основной контент */}
          <div className="image-upload-modal-body">
            {step === 1 ? (
              <>
                {/* Поле для описания изображения */}
                <div className="image-upload-form-group">
                  <label htmlFor="imageDescription">
                    Краткое описание изображения: 
                    <span className="char-counter">
                      {imageDescription.length}/40
                    </span>
                  </label>
                  <input
                    id="imageDescription"
                    type="text"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value.slice(0, 40))}
                    placeholder="Например: букет шаров Анаграм Чебурашка магазин"
                    className="image-upload-file-name-input"
                    autoComplete="off"
                    maxLength={50}
                  />
                </div>

                {/* Поля для артикулов */}
                <div className="image-upload-form-group">
                  <label>Артикулы товаров на изображении (формат XXXX-XXXX):</label>
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
                  
                  {articles.length < 10 && (
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
                  <label>Дополнительные теги:</label>
                  
                  {/* Предопределенные теги */}
                  <div className="image-upload-tags-container">
                    {PREDEFINED_TAGS.map(tag => (
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
                      <FiPlus />  Добавить
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
              </>
            ) : (
              /* Второй этап - подтверждение */
              <div className="confirmation-step">
                {/* Изображение */}
                <div className="image-preview-container">
                  {imagePreview && (
                    <div className="image-previews-wrapper">
                      <img 
                        src={imagePreview} 
                        alt="Предпросмотр" 
                        className="image-preview"
                      />
                    </div>
                  )}
                </div>

                {/* Информация о файле */}
                <div className="file-info-section">
                  <h4>Информация о файле</h4>
                  
                  <div className="info-grid">
                    <div className="info-rows">
                      <span className="info-labels">Имя файла:</span>
                      <span className="info-values file-name-final">{imageInfo?.finalFileName}</span>
                    </div>
                    <div className="info-rows">
                      <span className="info-labels">Размеры:</span>
                      <span className="info-values">{imageInfo?.dimensions} px</span>
                    </div>
                    <div className="info-rows">
                      <span className="info-labels">Объем:</span>
                      <span className="info-values">{imageInfo?.fileSize}</span>
                    </div>
                    <div className="info-rows">
                      <span className="info-labels">Дата сохранения:</span>
                      <span className="info-values">{imageInfo?.uploadDate}</span>
                    </div>
                  </div>

                  {/* Артикулы */}
                  {imageInfo?.articles && imageInfo.articles.length > 0 && (
                    <div className="tags-section">
                      <h5>Артикулы:</h5>
                      <div className="tags-list">
                        {imageInfo.articles.map((article, index) => (
                          <span key={index} className="article-tag">{article}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Теги */}
                  {imageInfo?.tags && imageInfo.tags.length > 0 && (
                    <div className="tags-section">
                      <h5>Дополнительные теги:</h5>
                      <div className="tags-list">
                        {imageInfo.tags.map((tag, index) => {
                          const tagColor = getTagColor(tag);
                          return (
                            <span 
                              key={index} 
                              className="tag-item"
                              style={{
                                '--tag-color': tagColor,
                                '--tag-color-rgb': hexToRgb(tagColor)
                              }}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Автор */}
                  <div className="info-rows author-row">
                    <span className="info-labels">
                      <FiUser className="author-icon" /> Автор
                    </span>
                    <span className="info-values author-name">{imageInfo?.author}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Футер с кнопками */}
          <div className="image-upload-modal-footer">
            {step === 1 ? (
              <>
                <button onClick={handleClose} className="image-upload-btn image-upload-btn-secondary">
                  Отмена
                </button>
                <button 
                  onClick={handleNextStep} 
                  disabled={!isValid}
                  className={`image-upload-btn image-upload-btn-primary ${!isValid ? 'disabled' : ''}`}
                >
                  Далее <FiArrowLeft className="rotate-180" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handlePrevStep} className="image-upload-btn image-upload-btn-secondary">
                  <FiArrowLeft /> Вернуться
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="image-upload-btn image-upload-btn-success"
                >
                  <FiCheck /> Сохранить
                </button>
              </>
            )}
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
    : '102, 217, 232';
};

export default ImageEditedUploadModal;