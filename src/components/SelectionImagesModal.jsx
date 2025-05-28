import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import { getCode } from "../constants/dataMap";

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
    const imagesCount = selectedImages.length;
    let collageElements;

    // Функция для создания элементов изображения и текста
    const createCollageElements = (item, index, imageSize, imageX, imageY) => {
      const { imageUrl, productCode } = item;

      // Элемент изображения
      const imageElement = {
        id: Date.now() + index * 2,
        type: "image",
        position: { x: imageX, y: imageY },
        isFlipped: false,
        image: imageUrl,
        width: imageSize,
        height: imageSize,
        originalWidth: 750,
        originalHeight: 750,
        isProduct: true
      };

      // Элемент текста
      const code = getCode(productCode);
      const textX = imageX + (imageSize - 128) / 2; // Центрирование текста (предполагаемая ширина текста 128px)
      const textY = imageY + imageSize - 38; // 28px (fontSize) + 10px (отступ)

      const textElement = {
        id: Date.now() + index * 2 + 1,
        type: "text",
        position: { x: textX, y: textY },
        text: code,
        fontSize: 24,
        color: "#333333",
        fontFamily: "FreeSetBold",
        fontStyle: "normal",
        fontWeight: "normal",
        isProductCode: true
      };

      return [imageElement, textElement];
    };

    if (imagesCount === 2) {
      collageElements = selectedImages.flatMap((item, index) => {
        const imageSize = 250;
        const positions = [
          { x: 15, y: 15 },
          { x: 180, y: 275 }
        ];
        return createCollageElements(
          item,
          index,
          imageSize,
          positions[index].x,
          positions[index].y
        );
      });
    } else if (imagesCount >= 3 && imagesCount <= 6) {
      const imageSize = 190;
      const elementsPerRow = 2;
      const gap = 10;
      const startX = (450 - (elementsPerRow * imageSize + (elementsPerRow - 1) * gap)) / 2;
      const startY = 5;

      collageElements = selectedImages.flatMap((item, index) => {
        const row = Math.floor(index / elementsPerRow);
        const col = index % elementsPerRow;
        const imageX = startX + col * (imageSize + gap);
        const imageY = startY + row * (imageSize + gap);

        return createCollageElements(item, index, imageSize, imageX, imageY);
      });
    } else {
      const imageSize = 145;
      const elementsPerRow = 3;
      const gap = 5;
      const startX = (450 - (elementsPerRow * imageSize + (elementsPerRow - 1) * gap)) / 2;
      const startY = 5;

      collageElements = selectedImages.flatMap((item, index) => {
        const row = Math.floor(index / elementsPerRow);
        const col = index % elementsPerRow;
        const imageX = startX + col * (imageSize + gap);
        const imageY = startY + row * (imageSize + gap);

        return createCollageElements(item, index, imageSize, imageX, imageY);
      });
    }

    // Сохранение данных и переход
    const selectedArticles = [...new Set(selectedImages.map(img => img.productCode))];
    sessionStorage.setItem('collage-articles', JSON.stringify(selectedArticles));
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
            disabled={selectedImages.length <= 1}
          >
            Создать коллаж
          </button>
        </div>
      </div>
    </div>
  );
};