import { useEffect, useState } from 'react';

export const ImageLibraryModal = ({ isOpen, onClose, onSelectImage }) => {
  const [images, setImages] = useState([]);

  useEffect(() => {
    // Загрузка списка изображений из public/images
    const loadImages = async () => {
      try {
        const response = await fetch('/images/image-list.json');
        const data = await response.json();
        setImages(data);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };
    
    if (isOpen) loadImages();
  }, [isOpen]);

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}  onClick={onClose}>
      <div className="modal-contents">
        <div className="modal-header">
          <h2>Библиотека изображений</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="image-grid">
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
        </div>
      </div>
    </div>
  );
};