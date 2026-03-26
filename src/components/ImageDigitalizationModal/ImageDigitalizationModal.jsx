import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PiCopySimpleBold } from "react-icons/pi";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { HiOutlineDownload } from "react-icons/hi";
import { FaTimes, FaTags, FaPlus } from "react-icons/fa";
import { RiImageEditLine } from "react-icons/ri";

import ImageEditor from "../ImageEditor/ImageEditor";
import { useAuth } from "../../contexts/AuthContext";
import { Tooltip } from "../../ui/Tooltip/Tooltip";
import { PREDEFINED_TAGS } from "../../constants/tags";
import './ImageDigitalizationModal.css';

// Функция для получения цвета тега
const getTagColor = (tag) => {
  const predefinedTag = PREDEFINED_TAGS.find(t => t.name === tag);
  if (predefinedTag) {
    return predefinedTag.color;
  }
  
  if (tag === "нет кода") {
    return 'rgb(244, 67, 54)';
  }
  
  const colors = [
    'rgb(91, 154, 255)',
    'rgb(80, 197, 111)',
    'rgb(255, 208, 67)',
    'rgb(207, 89, 227)',
    'rgb(29, 183, 168)',
    'rgb(255, 171, 45)',
    'rgb(197, 90, 255)',
    'rgb(255, 52, 130)',
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Список защищенных тегов (неудаляемые)
const PROTECTED_TAGS = ['Wildberries', 'Ozon', '9999-9999'];

export const ImageDigitalizationModal = ({
  isOpen, 
  onClose,
  images, 
  imageData, 
  currentIndex = 0,
  onAddTag,
  onRemoveTag,
  onTagClick,
  onEditorClose
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();  

  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const [currentImageData, setCurrentImageData] = useState(imageData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [tagColors, setTagColors] = useState({});
  const [showTagPopover, setShowTagPopover] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const [isTagOperationLoading, setIsTagOperationLoading] = useState(false);
  const [tagSearchTerm, setTagSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  
  const tagButtonRef = useRef(null);
  const popoverRef = useRef(null);
 
  useEffect(() => {
    if (isOpen) {
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);

  // Закрытие поповера при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target) &&
          tagButtonRef.current && !tagButtonRef.current.contains(event.target)) {
        setShowTagPopover(false);
        setCustomTag('');
        setTagSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Синхронизация с пропсами
  useEffect(() => {
    if (imageData) {
      setCurrentImageData(imageData);
      updateTagColors(imageData.tags);
    }
  }, [imageData]);

  useEffect(() => {
    if (images && imageData) {
      const index = images.findIndex(img => img._id === imageData._id);
      setCurrentImageIndex(index >= 0 ? index : currentIndex);
    }
  }, [images, imageData, currentIndex]);

  const updateTagColors = (tags) => {
    if (tags && Array.isArray(tags)) {
      const colors = {};
      tags.forEach(tag => {
        colors[tag] = getTagColor(tag);
      });
      setTagColors(colors);
    }
  };

  const handleClose = () => {
    setShowTagPopover(false);
    onClose();
  };

  const handlePrevImage = (e) => {
    e.stopPropagation(); 
    if (!images || images.length === 0) return;
    
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    const newImage = images[newIndex];
    setCurrentImageIndex(newIndex);
    setCurrentImageData(newImage);
    setShowTagPopover(false);
    updateTagColors(newImage.tags);
  };

  const handleNextImage = (e) => {
    e.stopPropagation(); 
    if (!images || images.length === 0) return;
    
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    const newImage = images[newIndex];
    setCurrentImageIndex(newIndex);
    setCurrentImageData(newImage);
    setShowTagPopover(false);
    updateTagColors(newImage.tags);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      handlePrevImage(e);
    } else if (e.key === 'ArrowRight') {
      handleNextImage(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, currentImageIndex, images]);

  const handleDownload = async () => {
    if (!currentImageData || isDownloading) return;
    setIsDownloading(true);
    
    try {
      const fullImageUrl = `https://mp.sharik.ru${currentImageData.url}`;
      const fileName = currentImageData.fileName;

      let finalFileName = fileName;
      if (!fileName.includes('.')) {
        const extension = currentImageData.mimeType?.split('/')[1] || 'jpg';
        finalFileName = `${fileName}.${extension}`;
      }

      const response = await fetch(fullImageUrl);
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = finalFileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);

    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      alert(`Не удалось скачать файл: ${error.message}. Попробуйте еще раз.`);
      const fullImageUrl = `https://mp.sharik.ru${currentImageData.url}`;
      window.open(fullImageUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove, e) => {
    e.stopPropagation();
    
    if (PROTECTED_TAGS.includes(tagToRemove)) {
      alert(`Тег "${tagToRemove}" является системным и не может быть удален`);
      return;
    }
    
    if (!currentImageData || isTagOperationLoading || !onRemoveTag) return;

    // Запрашиваем подтверждение перед удалением
    const confirmDelete = window.confirm(`Вы уверены, что хотите удалить тег "${tagToRemove}"?`);
  
    if (!confirmDelete) {
      return; // Если пользователь отменил, выходим из функции
    }
    
    setIsTagOperationLoading(true);
    try {
      await onRemoveTag(currentImageData._id, tagToRemove);
      // Обновляем локальное состояние
      const updatedTags = currentImageData.tags.filter(t => t !== tagToRemove);
      const updatedImageData = { ...currentImageData, tags: updatedTags };
      setCurrentImageData(updatedImageData);
      updateTagColors(updatedTags);
    } catch (error) {
      console.error('Ошибка при удалении тега:', error);
    } finally {
      setIsTagOperationLoading(false);
    }
  };

  const handleAddTag = async (tagToAdd) => {
    if (!tagToAdd || !currentImageData || isTagOperationLoading || !onAddTag) return;
    
    setIsTagOperationLoading(true);
    try {
      await onAddTag(currentImageData._id, tagToAdd);
      
      // Обновляем локальное состояние
      const updatedTags = [...(currentImageData.tags || []), tagToAdd];
      const updatedImageData = { ...currentImageData, tags: updatedTags };
      setCurrentImageData(updatedImageData);
      updateTagColors(updatedTags);
      
      setCustomTag('');
      setTagSearchTerm('');
      setShowTagPopover(false);
    } catch (error) {
      console.error('Ошибка при добавлении тега:', error);
    } finally {
      setIsTagOperationLoading(false);
    }
  };

  const handleAddCustomTag = () => {
    if (customTag.trim()) {
      handleAddTag(customTag.trim());
    }
  };

  // Обработчик клика по тегу
  const handleTagClick = (tag, e) => {
    e.stopPropagation();
    onTagClick(tag);
  };

  // Фильтрация предопределенных тегов
  const filteredPredefinedTags = PREDEFINED_TAGS.filter(tag => 
    tag.name.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  // Проверка, можно ли удалять тег
  const canDeleteTag = (tag) => {
    return !PROTECTED_TAGS.includes(tag);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Функция для проверки, является ли тег артикулом (формат XXXX-XXXX, где X - цифра)
  const isArticleTag = (tag) => {
    const articleRegex = /^\d{4}-\d{4}$/;
    return articleRegex.test(tag);
  };

  // Функция для обработки клика по артикулу
  const handleArticleClick = (article, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/sign-in');
      return;
    }

    if (article === '9999-9999') return;
        
    window.open(`/#/products/${article}`, '_blank');
  };

  const handleEdit = () => {
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    if (onEditorClose) {
      onEditorClose(); // Вызываем обновление списка
    }
  };

  // Получаем все теги, которые являются артикулами (кроме 9999-9999)
  const articleTags = (currentImageData?.tags || []).filter(tag => 
    isArticleTag(tag) && tag !== '9999-9999'
  );

  if (!isOpen || !currentImageData) {
    return null;
  }

  const fullImageUrl = `https://mp.sharik.ru${currentImageData.url}`;
  const fullThumbnailUrl = `https://mp.sharik.ru${currentImageData.thumbnailUrl}`;
  const tags = currentImageData.tags || [];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content image-digitalization-modal" style={{ minWidth: '60vw', maxWidth: '1000px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '0' }}>
            <h3 style={{ margin: '0', fontSize: '20px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: '1', minWidth: '0' }}>{currentImageData.fileName}</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Tooltip 
              content={"Добавить тег"}
              position={"bottom"}
            >
              <button 
                ref={tagButtonRef}
                className={`modal-tags-btn ${showTagPopover ? 'active' : ''}`}
                onClick={() => setShowTagPopover(!showTagPopover)}
                disabled={isTagOperationLoading}
              >
                <FaTags size={18} />
              </button>
            </Tooltip>
            
            <button 
              className="modal-close-btn"
              onClick={handleClose}
            >
              &times;
            </button>
          </div>
        </div>
        
        {/* Поповер для добавления тега */}
        {showTagPopover && (
          <div className="tag-popover" ref={popoverRef}>
            <div className="tag-popover-arrow"></div>
            <div className="tag-popover-content">
              <h4>Добавить тег</h4>
              
              {/* Список предустановленных тегов */}
              <div className="tag-popover-predefined">
                {filteredPredefinedTags.length > 0 ? (
                  filteredPredefinedTags.map(tag => (
                    <button
                      key={tag.id}
                      className="predefined-tag-btn"
                      style={{ 
                        backgroundColor: tag.color + '20',
                        color: tag.color,
                        borderColor: tag.color
                      }}
                      onClick={() => handleAddTag(tag.name)}
                      disabled={isTagOperationLoading || currentImageData.tags?.includes(tag.name)}
                    >
                      {tag.name}
                      {currentImageData.tags?.includes(tag.name) && (
                        <span className="tag-check">✓</span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="no-tags-found">Теги не найдены</div>
                )}
              </div>
              
              {/* Разделитель */}
              <div className="tag-popover-divider">
                <span>или создайте свой</span>
              </div>
              
              {/* Свой тег */}
              <div className="tag-popover-custom">
                <div className="custom-tag-input-group">
                  <input
                    type="text"
                    placeholder="Введите свой тег"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    className="custom-tag-input"
                  />
                  <button
                    className="add-custom-tags-btn"
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim() || isTagOperationLoading}
                  >
                    <FaPlus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="modal-bodies">
          <div className="image-modal-container">
            {/* Левая часть - изображение с тегами */}
            <div className="image-modal-preview">
              <div className="modal-image-container">
                <img
                  src={fullImageUrl}
                  alt={currentImageData.fileName}
                  className="modal-image-thumbnail"
                  onError={(e) => {
                    e.target.src = fullThumbnailUrl;
                  }}
                />
                
                {/* Теги поверх изображения */}
                {tags.length > 0 && (
                  <div className="image-tags-overlay">
                    <div className="tags-container-overlay">
                      {tags.map((tag, index) => (
                        <div key={index} className="tag-overlay-wrapper">
                          <span 
                            className="tag-overlay"
                            style={{
                              backgroundColor: tagColors[tag],
                              zIndex: tags.length - index,
                              cursor: 'pointer' // Добавляем указатель
                            }}
                            onClick={(e) => handleTagClick(tag, e)}
                          >
                            {tag}
                          </span>
                          {/* Кнопка удаления только для незащищенных тегов */}
                          {canDeleteTag(tag) && (
                            <button
                              className="tag-remove-btn"
                              onClick={(e) => handleRemoveTag(tag, e)}
                              disabled={isTagOperationLoading}
                              style={{
                                zIndex: tags.length - index + 1
                              }}
                            >
                              <FaTimes size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Правая часть - информация */}
            <div className="image-modal-info">
              <div className="image-info-section">
                <h4>Основная информация</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="infos-label">Имя файла:</span>
                    <span className="infos-value" title={currentImageData.fileName}>
                      {currentImageData.fileName}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="infos-label">Размер:</span>
                    <span className="infos-value">
                      {currentImageData.width} × {currentImageData.height} px
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="infos-label">Объем:</span>
                    <span className="infos-value">
                      {formatFileSize(currentImageData.size)}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="infos-label">Автор:</span>
                    <span className="infos-value">
                      {currentImageData.uploadedBy?.username || currentImageData.uploadedBy?.email}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="infos-label">Загружено:</span>
                    <span className="infos-value">
                      {formatDate(currentImageData.uploadDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Секция с артикулами */}
              {articleTags.length > 0 && (
                <div className="image-info-section">
                  <h4>Артикулы</h4>
                  <div className="articles-container">
                    {articleTags.map((article, index) => (
                      <button
                        key={index}
                        className="article-btn"
                        onClick={(e) => handleArticleClick(article, e)}
                      >
                        {article}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="info-item" style={{ marginTop: 'auto' }}>
                <button 
                  className="downloads-btn"
                  onClick={handleEdit}
                  disabled={isDownloading}
                >
                  <RiImageEditLine size={16} />
                  <span>Изменить</span>
                </button>

                <button 
                  className="downloads-btn"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  <HiOutlineDownload size={16} />
                  <span>{isDownloading ? 'Скачивание...' : 'Скачать'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="modal-buttons" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <h4 style={{ margin: '0', fontWeight: '600', fontSize: '16px', color: '#333' }}>Ссылка:</h4>
            <code style={{ fontSize: '12px', paddingTop: '4px' }}>{fullImageUrl}</code>
          </div>
          <button 
            className="copy-btn"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(fullImageUrl);
            }}
          >
            <PiCopySimpleBold size={18} />
          </button>
        </div>
      </div>
      
      {/* Кнопки навигации по краям модалки */}
      {images && images.length > 1 && (
        <>
          <button 
            className="modal-nav-btn modal-nav-prev"
            onClick={handlePrevImage}
          >
            <HiOutlineChevronLeft size={28} />
          </button>
          
          <button 
            className="modal-nav-btn modal-nav-next"
            onClick={handleNextImage}
          >
            <HiOutlineChevronRight size={28} />
          </button>
        </>
      )}

      <ImageEditor
        isOpen={showEditor}
        imageUrl={fullImageUrl}
        imageData={currentImageData}
        onClose={handleEditorClose}
      />
    </div>
  );
};