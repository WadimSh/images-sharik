import { useEffect, useState } from 'react';

export const ImageLibraryModal = ({ isOpen, onClose, onSelectImage }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    
    // Загрузка списка изображений из public/images
    const loadImages = async () => {
      try {
        setIsLoading(true);
        // Искусственная задержка для демонстрации скелетона
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch('/images/image-list.json', {
          signal: controller.signal
        });
        const data = await response.json();
        setImages(data);
      } catch (error) {
        if (error.name !== 'AbortError') { // Игнорируем ошибку отмены запроса
          console.error('Error loading images:', error);
        }
      } finally {
        setIsLoading(false); // Гарантированный сброс состояния загрузки
      }
    };

    if (isOpen) loadImages();

    return () => controller.abort(); // Очистка при размонтировании
  }, [isOpen]);
  
  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}  onClick={onClose}>
      <div className="modal-contents">
        <div className="modal-header">
          <h2>Библиотека изображений</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        {isLoading ? (
          <div className="skeleton-container">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="skeleton-item" />
            ))}
          </div>
        ) : images.length > 0 && (<div className="image-grid">
          {images.map((img, index) => (
            <div 
              key={index}
              className="images-item"
              onClick={() => onSelectImage(img)}
              data-filename={img} // Добавляем атрибут с именем файла
            >
              <img 
                src={`/images/${img}`} 
                alt={`Decoration ${index + 1}`}
              />
            </div>
          ))}
        </div>)}
      </div>
    </div>
  );
};