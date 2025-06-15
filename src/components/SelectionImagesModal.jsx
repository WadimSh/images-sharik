import { useState, useEffect, useContext } from "react";
import { useNavigate } from 'react-router-dom';

import { LanguageContext } from '../context/contextLanguage';
import { useMarketplace } from "../context/contextMarketplace";
import { getCode } from "../utils/getCodeProduct";
import { productsDB } from "../utils/handleDB";

export const SelectionImagesModal = ({ isOpen, onClose, articles }) => {
  const navigate = useNavigate();
  const { marketplace } = useMarketplace();
  const { t } = useContext(LanguageContext);
  const [products, setProducts] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [limitReached, setLimitReached] = useState(false);
  
  useEffect(() => {
    const loadProducts = async () => {
      if (isOpen && articles) {
        try {
          const loadedProducts = await Promise.all(
            articles.map(async (baseCode) => {
              // Получаем товар по точному совпадению кода
              const product = await productsDB.get(`product-${baseCode}`);
              
              if (!product?.data) return null;
  
              return {
                ...product.data,
                code: baseCode,
                images: product.data.images || []
              };
            })
          );
          setProducts(loadedProducts.filter(Boolean));
        } catch (error) {
          console.error('Ошибка при загрузке продуктов:', error);
        }
      }
    };
  
    loadProducts();
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
      const code = getCode(productCode, marketplace);
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
    localStorage.setItem('collage-articles', JSON.stringify(selectedArticles));
    localStorage.setItem("design-collage", JSON.stringify(collageElements));
    onClose();
    navigate('/template/collage');
  };

  return (
    <div className={`modal ${isOpen ? 'open' : ''}`}  onClick={onClose}>
      <div className="modal-contente" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('selection.title')}</h2>
          <button onClick={onClose} className="close-btn" aria-label={t('modals.close')}>&times;</button>
        </div>

        {limitReached && (
          <div className="limit-warning">
            {t('selection.limitWarning')}
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
                        alt={`${t('selection.imageAlt')} ${ index + 1 }`}
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
            {`${t('selection.counter')} ${selectedImages.length}/10`}
          </div>
          <button 
            className="confirm-button"
            onClick={handleConfirmSelection}
            disabled={selectedImages.length <= 1}
          >
            {t('selection.createCollage')}
          </button>
        </div>
      </div>
    </div>
  );
};