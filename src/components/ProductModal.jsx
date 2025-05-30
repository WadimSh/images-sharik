import { useState, useEffect } from 'react';

export const ProductModal = ({ isOpen, onClose, onSelectImage }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productImages, setProductImages] = useState([]);

  useEffect(() => {
    // Проверка формата при изменении значения
    const formatRegex = /^\d{4}-\d{4}$/;
    setIsValidFormat(formatRegex.test(searchQuery));
  }, [searchQuery]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Удаляем все нецифры
    let cleaned = value.replace(/[^\d]/g, '');
    // Добавляем дефис после 4 цифр
    if (cleaned.length > 4) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    // Ограничиваем длину
    const maxLength = 9; // 4 цифры + дефис + 4 цифры
    const newValue = cleaned.slice(0, maxLength);
    
    setSearchQuery(newValue);
  };
  
  const handleSaveTemplate = () => {
    if (!isValidFormat) return;
  
    setError(null); // Сброс предыдущих ошибок
    setIsLoading(true); // Добавить состояние загрузки если нужно
  
    // Кодируем поисковый запрос
    const encodedSearch = encodeURIComponent(searchQuery);
    
    fetch(`https://new.sharik.ru/api/rest/v1/products_lite/?search=${encodedSearch}`)
      .then(response => {
        if (!response.ok) {
          setError(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Проверка наличия результатов
        if (!data?.results?.length) {
          setError("Товар с таким артикулом не активен.");
        }
  
        // Получаем ID первого товара (или обрабатываем несколько)
        const productIds = data.results
          .slice(0, 5) // Лимит на случай множественных результатов
          .map(product => product.id)
          .filter(Boolean);
  
        if (productIds.length === 0) {
         setError("Не удалось получить ID товара");
        }
  
        return fetch(
          `https://new.sharik.ru/api/rest/v1/products_detailed/get_many/?ids=${productIds.join(',')}`
        );
      })
      .then(response => {
        if (!response.ok) {
          setError(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(detailedData => {
        // Формируем массив изображений
        if (Array.isArray(detailedData) && detailedData.length > 0) {
          const firstProduct = detailedData[0];
          
          if (firstProduct?.images) {
            const images = firstProduct.images.map(image => 
              `https://new.sharik.ru${image.image}`
            );
            setProductImages(images);
          } else {
            setError("У товара нет изображений");
            setProductImages([]);
          }
        } else {
          setError("Не удалось получить данные о товаре");
          setProductImages([]);
        }
      })
      .catch(error => {
        console.error('Ошибка:', error);
        setError(error.message || 'Произошла ошибка при поиске');
        
        // Для необработанных ошибок
        if (!error.message) {
          setError("Неизвестная ошибка при обращении к серверу");
        }
      })
      .finally(() => {
        setIsLoading(false); // Сброс состояния загрузки
      });
  };
  
  const handleClear = () => {
    setSearchQuery('');
    setProductImages([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveTemplate();
    }
  };
  
  return (
    <div className={`modal ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-contents" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить товар</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="wrapper-input">
          <div className="input-search">
            <input
              type="text"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Укажите код товара в виде XXXX-XXXX"
              maxLength={9}
              pattern="\d{4}-\d{4}"
              inputMode="numeric"
            />
            {searchQuery && (
              <button 
                className="clear-button"
                onClick={handleClear}
                aria-label="Очистить поле"
              >
                ×
              </button>
            )}
          </div>
          
          <button
            className="button-create"
            onClick={handleSaveTemplate}
            disabled={!isValidFormat}
          >
            Найти
          </button>
        </div>

        {/* Блок ошибок */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="skeleton-container">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="skeleton-item" />
            ))}
          </div>
        ) : productImages.length > 0 && (
          <div className="product-images-grid">
            <div className="images-container">
              {productImages.map((imgUrl, index) => (
                <div key={index} className="image-item">
                  <img 
                    src={imgUrl} 
                    alt={`Изображение товара ${index + 1}`}
                    onClick={() => onSelectImage(imgUrl, searchQuery)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};