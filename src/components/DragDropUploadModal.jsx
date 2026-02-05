import { useState } from "react";
import { uploadGraphicFile } from "../services/mediaService";

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
  
  // Предопределенные теги
  const predefinedTags = [
    { id: 13, name: 'Фон', color: '#f500f1' },
    { id: 14, name: 'Элемент', color: '#f50045' },
    { id: 1, name: 'Belbal', color: '#FF6B6B' },
    { id: 2, name: 'Gemar', color: '#4ECDC4' },
    { id: 3, name: 'Букет', color: '#FFD166' },
    { id: 4, name: 'С ребенком', color: '#06D6A0' },
    { id: 5, name: 'В интерьере', color: '#118AB2' },
    { id: 6, name: 'На природе', color: '#073B4C' },
    { id: 7, name: 'Полиграфия', color: '#EF476F' },
    { id: 8, name: 'Производство', color: '#7209B7' },
    { id: 9, name: 'Фестиваль', color: '#F15BB5' },
    { id: 10, name: 'Семинар', color: '#9B5DE5' },
    { id: 11, name: 'Выставка', color: '#00BBF9' },
    { id: 12, name: 'Студия', color: '#00F5D4' },
  ];
  
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
    const isPredefined = predefinedTags.some(predefinedTag => predefinedTag.name === tag);
    return !isArticle && !isPredefined;
  };
  
  const canUpload = () => {
    const userTags = selectedTags.filter(tag => isUserTag(tag));
    const hasPredefinedTags = selectedTags.some(tag => 
      predefinedTags.some(predefinedTag => predefinedTag.name === tag)
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
    
    // Находим артикулы в оригинальном имени
    const originalArticles = extractArticleCodesFromFileName(originalFileName);
    let baseName = fileNameWithoutExt;
    
    if (originalArticles.length > 0) {
      baseName = baseName.replace(/_\d+x\d+_\d{8}/g, '');
      baseName = baseName.replace(/_\d{8}$/g, '');
      baseName = baseName.replace(/_+$/, '');
      
      return `${baseName}_${dimensions.width}x${dimensions.height}_${datePart}.${extension}`;
    } else {
      baseName = baseName.replace(/_\d+x\d+_\d{8}/g, '');
      baseName = baseName.replace(/_\d{8}$/g, '');
      baseName = baseName.replace(/_+$/, '');
      
      return `${baseName}_${dimensions.width}x${dimensions.height}_${datePart}.${extension}`;
    }
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
    predefinedTags.some(predefinedTag => predefinedTag.name === tag)
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
                {predefinedTags.map(tag => (
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
