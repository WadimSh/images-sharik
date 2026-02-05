import { useEffect, useState, useContext } from "react";
import { LuImagePlus } from "react-icons/lu";
import { FiArrowLeft } from 'react-icons/fi';

import { useAuth } from "../../contexts/AuthContext"; 
import { apiGetAllImages, uploadGraphicFile } from "../../services/mediaService";
import { LanguageContext } from "../../contexts/contextLanguage";
import Pagination from "../../ui/Pagination/Pagination";
import { PREDEFINED_TAGS } from "../../constants/tags";
import './LibraryMediaModal.css';

export const LibraryMediaModal = ({ isOpen, onClose, setElements }) => {
  const { t } = useContext(LanguageContext);
  const { user } = useAuth(); 

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(18);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState('library');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!isOpen) return;
    
    if (step === 'library') {
      const controller = new AbortController();
      let timeoutId;

      const loadData = async () => {
        try {
          setIsLoading(true);
          
          const params = {
            page: currentPage,
            limit: itemsPerPage
          };
          
          const result = await apiGetAllImages(params);
          
          if (result && result.files) {
            setImages(result.files);
            setTotalCount(result.pagination.total);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error loading data:', error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      timeoutId = setTimeout(() => {
        loadData();
      }, 100);

      return () => {
        controller.abort();
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, currentPage, itemsPerPage, step]);

  // Создаем превью изображения
  useEffect(() => {
    if (selectedFile && step === 'upload') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        
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
  }, [selectedFile, step]);

  const getFullImageUrl = (thumbnailUrl) => {
    const baseUrl = 'https://mp.sharik.ru';
    return thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
  };

  const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);

  const handlePageChange = (page) => {
    if (isLoading) return; 
    setCurrentPage(page);
  };

  const handleSelectImage = async (imageUrl) => {
    try {
      const img = new Image();
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      const containerWidth = 450;
      const containerHeight = 600;
      
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const newWidth = img.naturalWidth * scale;
      const newHeight = img.naturalHeight * scale;
      
      const position = {
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2
      };
  
      const newElement = {
        id: generateUniqueId(),
        type: 'image',
        position,
        image: imageUrl,
        width: newWidth,
        height: newHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        isFlipped: false,
        rotation: 0
      };
  
      setElements(prev => [...prev, newElement]);
      onClose();
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Couldn`t upload image');
    }
  };

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Разрешены только JPEG, PNG и WebP файлы');
        return;
      }
      
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Файл превышает размер 100MB');
        return;
      }
      
      setSelectedFile(file);
      setOriginalFileName(file.name);
      
      // Сбрасываем выбранные теги
      setSelectedTags([]);
      
      setStep('upload');
    };
    
    input.click();
  };

  // Извлечение ВСЕХ артикулов из имени файла (подкапотом)
  const extractArticleCodesFromFileName = (fileName) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const articlePattern = /\d{4}-\d{4}/g;
    const matches = nameWithoutExt.match(articlePattern);
    return matches || [];
  };

  // Валидация артикула
  const validateArticle = (tag) => {
    const articleRegex = /^\d{4}-\d{4}$/;
    return articleRegex.test(tag);
  };

  // Проверка, является ли тег пользовательским (не артикул и не предопределенный)
  const isUserTag = (tag) => {
    const isArticle = validateArticle(tag);
    const isPredefined = PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag);
    return !isArticle && !isPredefined;
  };

  // Получаем только пользовательские теги (не артикулы и не предопределенные)
  const getUserTags = () => {
    return selectedTags.filter(tag => isUserTag(tag));
  };

  // Проверка, можно ли загружать (нужен хотя бы один не-артикульный тег)
  const canUpload = () => {
    const userTags = getUserTags();
    const hasPredefinedTags = selectedTags.some(tag => 
      PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag)
    );
    
    return userTags.length > 0 || hasPredefinedTags;
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
      // Проверяем, что это не артикул
      if (validateArticle(trimmedTag)) {
        alert('Нельзя добавить артикул как тег. Артикулы определяются автоматически из имени файла.');
        return;
      }
      
      setSelectedTags([...selectedTags, trimmedTag]);
      setCustomTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Умная генерация имени файла с поддержкой нескольких артикулов
  const generateFileName = () => {
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
    let baseName = fileNameWithoutExt;
    
    if (originalArticles.length > 0) {
      // Если в имени уже есть артикулы, оставляем их
      baseName = baseName.replace(/_\d+x\d+_\d{8}/g, '');
      baseName = baseName.replace(/_\d{8}$/g, '');
      baseName = baseName.replace(/_+$/, '');
      
      return `${baseName}_${imageDimensions.width}x${imageDimensions.height}_${datePart}.${extension}`;
    } else {
      // Если артикулов нет в оригинальном имени, используем очищенное имя
      baseName = baseName.replace(/_\d+x\d+_\d{8}/g, '');
      baseName = baseName.replace(/_\d{8}$/g, '');
      baseName = baseName.replace(/_+$/, '');
      
      return `${baseName}_${imageDimensions.width}x${imageDimensions.height}_${datePart}.${extension}`;
    }
  };

  // Функция для загрузки изображения на сервер
  const handleUploadImage = async () => {
    try {
      if (!selectedFile || !user || !user.company || user.company.length === 0) {
        alert('Ошибка: нет данных пользователя или компании');
        return;
      }
      
      // Проверяем, что выбран хотя бы один не-артикульный тег
      if (!canUpload()) {
        alert('Пожалуйста, выберите хотя бы один тег (не артикул)');
        return;
      }
      
      setIsUploading(true);
      
      const finalFileName = generateFileName();
      const blob = new Blob([selectedFile], { type: selectedFile.type });
      const processedFile = new File([blob], finalFileName, {
        type: selectedFile.type,
        lastModified: selectedFile.lastModified
      });
      
      // Извлекаем артикулы из имени файла (подкапотом)
      const extractedArticles = extractArticleCodesFromFileName(originalFileName);
      
      // Если нет артикулов в имени файла, добавляем 9999-9999
      const articleTags = extractedArticles.length > 0 
        ? extractedArticles 
        : ['9999-9999'];
      
      // Объединяем все теги: артикулы (из имени или 9999-9999) + выбранные пользователем теги
      const allTags = [...articleTags, ...selectedTags];
            
      const companyId = user.company[0].id;
      const uploadResult = await uploadGraphicFile(
        companyId,
        processedFile,
        null,
        allTags 
      );
      
      if (!uploadResult || !uploadResult.success) {
        throw new Error(uploadResult?.message || 'Не удалось загрузить файл на сервер');
      }
      
      const uploadedFile = uploadResult.data || uploadResult.file;
      
      if (!uploadedFile) {
        throw new Error('Нет данных о загруженном файле в ответе сервера');
      }
      
      const imageUrl = uploadedFile.url || uploadedFile.fileUrl;
      const thumbnailUrl = uploadedFile.thumbnailUrl || uploadedFile.previewUrl || imageUrl;
      
      if (!imageUrl) {
        throw new Error('Нет URL изображения в ответе сервера');
      }
      
      const fullImageUrl = getFullImageUrl(imageUrl);
      const fullThumbnailUrl = getFullImageUrl(thumbnailUrl);
      
      const img = new Image();
      img.src = fullImageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      const containerWidth = 450;
      const containerHeight = 600;
      
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const newWidth = img.naturalWidth * scale;
      const newHeight = img.naturalHeight * scale;
      
      const position = {
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2
      };
  
      const newElement = {
        id: generateUniqueId(),
        type: 'image',
        position,
        image: fullImageUrl,
        width: newWidth,
        height: newHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        isFlipped: false,
        rotation: 0        
      };
      
      setElements(prev => [...prev, newElement]);
      onClose();
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка при загрузке изображения на сервер: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackToLibrary = () => {
    setStep('library');
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedTags([]);
    setCustomTag('');
  };

  // Рендер контента
  const renderContent = () => {
    if (step === 'upload') {
      const displayedTags = selectedTags.filter(tag => !validateArticle(tag));
      const userTagsCount = getUserTags().length;
      const predefinedTagsCount = selectedTags.filter(tag => 
        PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag)
      ).length;
      
      return (
        <div className="upload-step-container">
          <div className="upload-preview-section">
            {imagePreview && (
              <div className="image-preview-wrapper">
                <img 
                  src={imagePreview} 
                  alt="Предпросмотр" 
                  className="image-preview-large"
                />
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
                          title={isUserTagFlag ? "Пользовательский тег" : "Предопределенный тег"}
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
      );
    }

    // Шаг библиотеки
    return (
      <>
        <div className="main-categories">
          <button onClick={handleImageClick} className="template-button" style={{ background: 'transparent', marginLeft: 'auto' }}>
            <LuImagePlus /> {t('Загрузить изображение')}
          </button>
        </div>

        <div className="modals-content">
          <div className="images-grids">
          {isLoading ? (
            <>
              {[...Array(24)].map((_, index) => (
                <div key={index} className="skeleton-item" />
              ))}
            </>
          ) : (
            <>
              {images.map((image) => (
                <div 
                  key={image._id} 
                  className="images_card"
                  onClick={() => handleSelectImage(getFullImageUrl(image.url))}
                >
                  <div className="images-container">
                    <img
                      src={getFullImageUrl(image.thumbnailUrl)}
                      alt={image.fileName}
                      loading="lazy"
                      className="image-thumbnail"
                      onError={(e) => {
                        e.target.src = getFullImageUrl(image.url);
                      }}
                    />
                  </div>
                  <div className="image-info-overlay">
                    <div className="image-filename" title={image.fileName}>
                      {image.fileName}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
          </div>
        </div>

        <div className="modals-footer">
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            disabled={isLoading} 
          />
        </div>
      </>
    );
  };

  return (
    <div className="modals-overlay" onClick={onClose}>
      <div className="modals-container" onClick={e => e.stopPropagation()}>
        <div className="modals-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 'upload' && (
              <button onClick={handleBackToLibrary} className="back-btn">
                <FiArrowLeft />
              </button>
            )}
            <h2>
              {step === 'library' ? 'Выберите изображение' : 'Добавьте теги к изображению'}
            </h2>
          </div>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {renderContent()}

        {step === 'upload' && (
          <div className="upload-footer">
            <button onClick={handleBackToLibrary} className="secondary-btn">
              Назад
            </button>
            <button 
              onClick={handleUploadImage} 
              disabled={isUploading || !user || !canUpload()}
              className={`primary-btn ${isUploading ? 'loading' : ''} ${!canUpload() ? 'disabled' : ''}`}
            >
              {isUploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};