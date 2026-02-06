import { useState } from "react";
import { uploadGraphicFile } from "../services/mediaService";
import { PREDEFINED_TAGS } from "../constants/tags";

export const transliterateText = (text) => {
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

export const formatFileName = (fileName) => {
  const cleaned = fileName.trim();
  const transliterated = transliterateText(cleaned);
  return transliterated.toLowerCase();
};

export const DragDropUploadModal = ({ 
  isOpen, 
  onClose, 
  fileInfo,
  user,
  onUploadComplete 
}) => {
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Извлечение артикулов из имени файла
  const extractArticleCodesFromFileName = (fileName) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const articlePattern = /\d{4}-\d{4}/g;
    const matches = nameWithoutExt.match(articlePattern);
    return matches || [];
  };
  
  // Проверка артикула
  const validateArticle = (tag) => {
    const articleRegex = /^\d{4}-\d{4}$/;
    return articleRegex.test(tag);
  };
  
  // Проверка пользовательского тега
  const isUserTag = (tag) => {
    const isArticle = validateArticle(tag);
    const isPredefined = PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag);
    return !isArticle && !isPredefined;
  };
  
  const canUpload = () => {
    const userTags = selectedTags.filter(tag => isUserTag(tag));
    const hasPredefinedTags = selectedTags.some(tag => 
      PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag)
    );
    return userTags.length > 0 || hasPredefinedTags;
  };
  
  // Генерация имени файла
  const generateFileName = () => {
    const { originalFileName, dimensions } = fileInfo;
    const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
    const extension = originalFileName.split('.').pop();
    
    const now = new Date();
    const datePart = now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '');
    
    // Находим все артикулы в оригинальном имени
    const originalArticles = extractArticleCodesFromFileName(originalFileName);
    
    // Транслитерируем имя (кириллица -> латиница)
    let cleanedName = formatFileName(fileNameWithoutExt);
    
    // Убираем старые размеры и даты если есть
    cleanedName = cleanedName.replace(/_\d+x\d+_\d{8}/g, '');
    cleanedName = cleanedName.replace(/_\d{8}_\d{6}/g, '');
    cleanedName = cleanedName.replace(/_\d{6}/g, '');
    cleanedName = cleanedName.replace(/_+$/, '');
    
    // Убираем артикулы из cleanedName чтобы не дублировать
    if (originalArticles.length > 0) {
      originalArticles.forEach(article => {
        cleanedName = cleanedName.replace(new RegExp(`_?${article}_?`, 'g'), '');
      });
    }
    
    // Убираем 9999-9999 если случайно есть
    cleanedName = cleanedName.replace(/^9999-9999_/, '');
    cleanedName = cleanedName.replace(/_9999-9999_/g, '_');
    cleanedName = cleanedName.replace(/_9999-9999$/, '');
    
    // Очищаем от лишних подчеркиваний
    cleanedName = cleanedName.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    
    let finalName;
    
    if (originalArticles.length > 0) {
      // Если в имени есть артикулы, используем первый найденный
      const mainArticle = originalArticles[0];
      finalName = `${mainArticle}_${cleanedName || 'image'}_${dimensions.width}x${dimensions.height}_${datePart}.${extension}`;
    } else {
      // Если артикулов нет, добавляем 9999-9999 в начало
      finalName = `9999-9999_${cleanedName || 'image'}_${dimensions.width}x${dimensions.height}_${datePart}.${extension}`;
    }
    
    // Фикс для двойных подчеркиваний
    finalName = finalName.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    
    return finalName;
  };
  
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
      if (validateArticle(trimmedTag)) {
        alert('Нельзя добавить артикул как тег');
        return;
      }
      setSelectedTags([...selectedTags, trimmedTag]);
      setCustomTag('');
    }
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };
  
  const handleUpload = async () => {
    if (!fileInfo || !user || !user.company || user.company.length === 0) {
      alert('Ошибка: нет данных пользователя или компании');
      return;
    }
    
    if (!canUpload()) {
      alert('Пожалуйста, выберите хотя бы один тег');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Генерируем имя файла
      const finalFileName = generateFileName();
      
      // Создаем обработанный файл
      const blob = new Blob([fileInfo.file], { type: fileInfo.file.type });
      const processedFile = new File([blob], finalFileName, {
        type: fileInfo.file.type,
        lastModified: fileInfo.file.lastModified
      });
      
      // Извлекаем артикулы
      const extractedArticles = extractArticleCodesFromFileName(fileInfo.originalFileName);
      
      // Добавляем 9999-9999 если нет артикулов
      const articleTags = extractedArticles.length > 0 
        ? extractedArticles 
        : ['9999-9999'];
      
      // Все теги
      const allTags = [...articleTags, ...selectedTags];
      
      // Загружаем на сервер
      const companyId = user.company[0].id;
      const uploadResult = await uploadGraphicFile(
        companyId,
        processedFile,
        null,
        allTags
      );
      
      if (!uploadResult || !uploadResult.success) {
        throw new Error(uploadResult?.message || 'Ошибка загрузки');
      }
      
      const uploadedFile = uploadResult.data || uploadResult.file;
      
      if (!uploadedFile) {
        throw new Error('Нет данных о файле');
      }
      
      // Возвращаем результат
      onUploadComplete({
        url: uploadedFile.url || uploadedFile.fileUrl,
        thumbnailUrl: uploadedFile.thumbnailUrl || uploadedFile.previewUrl,
        fileName: uploadedFile.fileName || finalFileName,
        dimensions: fileInfo.dimensions
      });
      
      onClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  if (!isOpen) return null;
  
  const displayedTags = selectedTags.filter(tag => !validateArticle(tag));
  const userTagsCount = selectedTags.filter(tag => isUserTag(tag)).length;
  const predefinedTagsCount = selectedTags.filter(tag => 
    PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag)
  ).length;
  
  return (
    <div className="modals-overlay" onClick={onClose}>
      <div className="modals-container" onClick={e => e.stopPropagation()}>
        <div className="modals-header">
          <h2>Добавьте теги к изображению</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="upload-step-container">
          <div className="upload-preview-section">
            {fileInfo.imagePreview && (
              <div className="image-preview-wrapper">
                <img 
                  src={fileInfo.imagePreview} 
                  alt="Предпросмотр" 
                  className="image-preview-large"
                />
                <div className="image-info-overlay">
                  <div className="image-original-name" title={fileInfo.originalFileName}>
                    {fileInfo.originalFileName}
                  </div>
                  <div className="image-dimensions">
                    {fileInfo.dimensions.width} × {fileInfo.dimensions.height} px
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="upload-form-section">
            <div className="form-group">
              <label>
                Выберите теги изображения:
                <span className="required-star">*</span>
              </label>
              
              <div className="tags-section-info">
                <div className="section-info-row">
                  <span>Предопределенные теги:</span>
                </div>
              </div>
              
              <div className="tags-grid">
                {PREDEFINED_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.name)}
                    className={`tag-btn ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                    style={{ 
                      backgroundColor: tag.color + '20', 
                      color: tag.color, 
                      borderColor: tag.color 
                    }}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.name) && <span className="tag-check">✓</span>}
                  </button>
                ))}
              </div>
              
              <div className="tags-section-info">
                <div className="section-info-row">
                  <span>Создать свой тег:</span>
                </div>
              </div>
              
              <div className="custom-tag-section">
                <div className="custom-tag-input-group">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    placeholder="Введите название тега"
                    className="form-input"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim()}
                    className="add-custom-tag-btn"
                  >
                    Добавить
                  </button>
                </div>
              </div>
              
              {displayedTags.length > 0 && (
                <div className="selected-tags-section">
                  <div className="selected-tags-header">
                    <span>Выбрано тегов: {displayedTags.length}</span>
                    <span className="tags-breakdown">
                      ({predefinedTagsCount} предопределенных, {userTagsCount} пользовательских)
                    </span>
                  </div>
                  <div className="selected-tags-grid">
                    {displayedTags.map(tag => {
                      const isUserTagFlag = isUserTag(tag);
                      return (
                        <div 
                          key={tag} 
                          className={`selected-tag-item ${isUserTagFlag ? 'user-tag' : ''}`}
                        >
                          <span className="selected-tag-text">{tag}</span>
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
              
              {!canUpload() && (
                <div className="validation-error">
                  ⚠ Для загрузки необходимо выбрать хотя бы один тег
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="upload-footer">
          <button onClick={onClose} className="secondary-btn">
            Отмена
          </button>
          <button 
            onClick={handleUpload} 
            disabled={isUploading || !user || !canUpload()}
            className={`primary-btn ${isUploading ? 'loading' : ''} ${!canUpload() ? 'disabled' : ''}`}
          >
            {isUploading ? 'Загрузка...' : 'Загрузить'}
          </button>
        </div>
      </div>
    </div>
  );
};
