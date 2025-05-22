import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

export const SelectionImagesModal = ({ isOpen, onClose, articles }) => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [limitReached, setLimitReached] = useState(false);
  
  useEffect(() => {
    if (isOpen && articles) {
      const loadedProducts = articles.map(baseCode => {
        // Ищем все записи для этого базового кода
        const productKeys = Object.keys(sessionStorage)
          .filter(key => key.startsWith(`product-${baseCode}`));
        
        // Собираем все изображения со всех вариантов товара
        const allImages = productKeys.flatMap(key => {
          const data = JSON.parse(sessionStorage.getItem(key));
          return data?.images || [];
        });
        
        // Берем метаданные из первой найденной записи
        const firstProductData = productKeys.length > 0 
          ? JSON.parse(sessionStorage.getItem(productKeys[0]))
          : null;

        return firstProductData 
          ? { 
              ...firstProductData,
              code: baseCode,
              images: [...new Set(allImages)] // Убираем дубликаты
            }
          : null;
      }).filter(Boolean);
      
      setProducts(loadedProducts);
    }
  }, [isOpen, articles]);

  useEffect(() => {
    setLimitReached(selectedImages.length >= 10);
  }, [selectedImages]);

  const handleImageSelect = (productCode, imageUrl) => {
    setSelectedImages(prev => {
      const isSelected = prev.some(item => 
        item.productCode === productCode && item.imageUrl === imageUrl
      );
      
      if (isSelected) {
        return prev.filter(item => 
          !(item.productCode === productCode && item.imageUrl === imageUrl)
        );
      } else {
        if (prev.length >= 10) return prev;
        return [...prev, { productCode, imageUrl }];
      }
    });
  };

  const handleConfirmSelection = () => {
  const startPosition = { x: 20, y: 20 };
  const horizontalStep = 160;
  const verticalStep = 180; // Шаг между рядами
  const elementsPerRow = 3;
  const overlap = 40;

  const collageElements = selectedImages.map(({ imageUrl }, index) => {
    const row = Math.floor(index / elementsPerRow);
    const col = index % elementsPerRow;

    // Позиция X с наездом
    const positionX = startPosition.x + (horizontalStep * col) - (overlap * col);
    
    // Позиция Y без смещения внутри ряда
    const positionY = startPosition.y + (verticalStep * row) + (overlap * col);

    // Границы холста
    const maxX = 450 - 146;
    const maxY = 600 - 146;

    return {
      id: Date.now() + index,
      type: "image",
      position: {
        x: Math.min(positionX, maxX),
        y: Math.min(positionY, maxY)
      },
      isFlipped: false,
      image: imageUrl,
      width: 146,
      height: 146,
      originalWidth: 750,
      originalHeight: 750
    };
  });

  sessionStorage.setItem("design-collage", JSON.stringify(collageElements));
  onClose();
  navigate('/template/collage');
};

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}  onClick={onClose}>
      <div className="modal-contente" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Выберите изображения для коллажа</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {limitReached && (
          <div className="limit-warning">
            Выбрано максимальное количество изображений (10). Снимите выделение с ненужных изображений, чтобы добавить новые.
          </div>
        )}

        <div className="products-list">
          {products.map(product => (
            <div key={product.code} className="product-item">
              <div className="product-info">
                <p>{product.code}</p>
                <h3>{product.name}</h3>
              </div>
              <div className="product-images">
                {product.images.map((image, index) => {
                  const isChecked = selectedImages.some(item => 
                    item.productCode === product.code && item.imageUrl === image
                  );
                  const isDisabled = !isChecked && selectedImages.length >= 10;

                  return (
                    <div 
                      key={`${product.code}-${index}`} 
                      className={`image-container ${isDisabled ? 'disabled' : ''}`}
                    >
                      <img 
                        src={image} 
                        alt={`Изображение ${index + 1}`}
                        className="product-image"
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleImageSelect(product.code, image)}
                          disabled={isDisabled}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <div className="selection-counter">
            Выбрано: {selectedImages.length}/10 изображений
          </div>
          <button 
            className="confirm-button"
            onClick={handleConfirmSelection}
          >
            Создать коллаж
          </button>
        </div>
      </div>
    </div>
  );
};