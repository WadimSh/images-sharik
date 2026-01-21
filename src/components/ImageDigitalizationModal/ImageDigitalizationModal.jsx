import { useEffect, useState } from "react";
import { PiCopySimpleBold } from "react-icons/pi";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { HiOutlineDownload } from "react-icons/hi";
import './ImageDigitalizationModal.css';

// Функция для получения цвета тега
const getTagColor = (tag) => {
  if (tag === "нет кода") {
    return 'rgba(244, 67, 54, 0.7)'; // полупрозрачный красный для "нет кода"
  }
  
  // Для других тегов генерируем случайный цвет или используем хеш
  const colors = [
    'rgba(66, 133, 244, 0.4)',   // синий
    'rgba(52, 168, 83, 0.4)',    // зеленый
    'rgba(251, 188, 4, 0.4)',    // желтый
    'rgba(171, 71, 188, 0.4)',   // фиолетовый
    'rgba(0, 150, 136, 0.4)',    // бирюзовый
    'rgba(255, 152, 0, 0.4)',    // оранжевый
    'rgba(96, 125, 139, 0.4)',   // серо-голубой
    'rgba(156, 39, 176, 0.4)',   // фиолетовый
  ];
  
  // Используем хеш тега для детерминированного выбора цвета
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ImageDigitalizationModal = ({
  isOpen, 
  onClose,
  images, 
  imageData, 
  currentIndex = 0 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const [currentImageData, setCurrentImageData] = useState(imageData);
  const [isDownloading, setIsDownloading] = useState(false);
  const [tagColors, setTagColors] = useState({});

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

  useEffect(() => {
    setCurrentImageData(imageData);
    if (images && imageData) {
      const index = images.findIndex(img => img._id === imageData._id);
      setCurrentImageIndex(index >= 0 ? index : currentIndex);
      
      // Генерируем цвета для тегов текущего изображения
      if (imageData.tags && Array.isArray(imageData.tags)) {
        const colors = {};
        imageData.tags.forEach(tag => {
          colors[tag] = getTagColor(tag);
        });
        setTagColors(colors);
      }
    }
  }, [imageData, images, currentIndex]);

  const handleClose = () => {
    onClose();
  };

  const handlePrevImage = (e) => {
    e.stopPropagation(); 
    if (!images || images.length === 0) return;
    
    const newIndex = currentImageIndex > 0 ? currentImageIndex - 1 : images.length - 1;
    setCurrentImageIndex(newIndex);
    setCurrentImageData(images[newIndex]);
    
    // Обновляем цвета тегов для нового изображения
    if (images[newIndex].tags && Array.isArray(images[newIndex].tags)) {
      const colors = {};
      images[newIndex].tags.forEach(tag => {
        colors[tag] = getTagColor(tag);
      });
      setTagColors(colors);
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation(); 
    if (!images || images.length === 0) return;
    
    const newIndex = currentImageIndex < images.length - 1 ? currentImageIndex + 1 : 0;
    setCurrentImageIndex(newIndex);
    setCurrentImageData(images[newIndex]);
    
    // Обновляем цвета тегов для нового изображения
    if (images[newIndex].tags && Array.isArray(images[newIndex].tags)) {
      const colors = {};
      images[newIndex].tags.forEach(tag => {
        colors[tag] = getTagColor(tag);
      });
      setTagColors(colors);
    }
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

      // Добавляем расширение если его нет
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

  if (!isOpen || !currentImageData) {
    return null;
  }

  const fullImageUrl = `https://mp.sharik.ru${currentImageData.url}`;
  const fullThumbnailUrl = `https://mp.sharik.ru${currentImageData.thumbnailUrl}`;
  const tags = currentImageData.tags || [];

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" style={{ minWidth: '60vw', maxWidth: '1000px', maxHeight: '700px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3>{currentImageData.fileName}</h3>
          </div>
          <button 
            className="modal-close-btn"
            onClick={handleClose}
          >
            &times;
          </button>
        </div>
        
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
                        <span 
                          key={index}
                          className="tag-overlay"
                          style={{
                            backgroundColor: tagColors[tag],
                            transform: `translateX(${index * 5}px)`,
                            zIndex: tags.length - index
                          }}
                        >
                          {tag}
                        </span>
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
                    <span className="info-label">Имя файла:</span>
                    <span className="info-value" title={currentImageData.fileName}>
                      {currentImageData.fileName}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Размер изображения:</span>
                    <span className="info-value">
                      {currentImageData.width} × {currentImageData.height} px
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Объем файла:</span>
                    <span className="info-value">
                      {formatFileSize(currentImageData.size)}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Автор:</span>
                    <span className="info-value">
                      {currentImageData.uploadedBy?.name || currentImageData.uploadedBy?.email}
                    </span>
                  </div>
                  
                  <div className="info-item">
                    <span className="info-label">Загружено:</span>
                    <span className="info-value">
                      {formatDate(currentImageData.uploadDate)}
                    </span>
                  </div>
                </div>
                
              </div>
              <div className="info-item" style={{ marginTop: 'auto' }}>
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
            aria-label="Предыдущее изображение"
          >
            <HiOutlineChevronLeft size={28} />
          </button>
          
          <button 
            className="modal-nav-btn modal-nav-next"
            onClick={handleNextImage}
            aria-label="Следующее изображение"
          >
            <HiOutlineChevronRight size={28} />
          </button>
        </>
      )}
    </div>
  );
};