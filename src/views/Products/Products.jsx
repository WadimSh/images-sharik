import { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { apiGetAllImages, apiGetImagesExcludingMarketplaces } from '../../services/mediaService';

// Функция преобразования артикула в тег (скопируйте из вашего кода)
const articleToTag = (article) => {
  if (!article) return null;
  // Здесь должна быть логика преобразования артикула в тег
  // Например: return article.trim();
  return article.trim();
};

export const Products = () => {  
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { article } = useParams();
  const { isAdmin, isUploader } = useAuth();
  
  const [productInfo, setProductInfo] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [storageImages, setStorageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    portal: null,
    storage: null
  });

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const fetchProductData = async () => {
      if (!article) {
        console.log('Артикул не указан');
        return;
      }

      setLoading(true);
      setErrors({ portal: null, storage: null });

      // Сбрасываем состояния перед новой загрузкой
      setProductInfo(null);
      setProductImages([]);
      setStorageImages([]);

      try {
        // 1. Запрос на портал - оборачиваем в try/catch отдельно
        try {
          const searchQuery = encodeURIComponent(article);
          const searchResponse = await fetch(`https://new.sharik.ru/api/rest/v1/products_lite/?page_size=100&search=${searchQuery}&ordering=relevance&supplier_category__isnull=False`);
          
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            console.log('Результаты поиска товара:', searchData);

            if (searchData.results && searchData.results.length > 0) {
              // Берем первый найденный товар
              const productId = searchData.results[0].id;
              const productCode = searchData.results[0].code;
              
              try {
                // 2. Запрос детальной информации по ID товара
                const detailedResponse = await fetch(`https://new.sharik.ru/api/rest/v1/products_detailed/${productId}/`);
                
                if (detailedResponse.ok) {
                  const detailedData = await detailedResponse.json();
                  
                  console.log('Детальная информация о товаре:', detailedData);
                  setProductInfo(detailedData);

                  // Формируем массив ссылок на изображения из портала
                  if (detailedData.images && Array.isArray(detailedData.images)) {
                    const portalImages = detailedData.images.map(img => 
                      `https://new.sharik.ru${img.image}`
                    );
                    console.log('Изображения с портала:', portalImages);
                    setProductImages(portalImages);
                  }
                } else {
                  console.warn('Не удалось получить детальную информацию о товаре');
                  setErrors(prev => ({ ...prev, portal: 'Детальная информация не загрузилась' }));
                }
              } catch (detailError) {
                console.warn('Ошибка при запросе детальной информации:', detailError);
                setErrors(prev => ({ ...prev, portal: 'Ошибка загрузки детальной информации' }));
              }
            } else {
              console.log('Товар с артикулом', article, 'не найден на портале');
              setErrors(prev => ({ ...prev, portal: 'Товар не найден на портале' }));
            }
          } else {
            console.warn('Ошибка при поиске товара:', searchResponse.status);
            setErrors(prev => ({ ...prev, portal: `Ошибка поиска: ${searchResponse.status}` }));
          }
        } catch (portalError) {
          console.warn('Ошибка при запросе к порталу:', portalError);
          setErrors(prev => ({ ...prev, portal: 'Не удалось подключиться к порталу' }));
        }

        // 3. Запрос в хранилище по артикулу с использованием специфичной логики
        try {
          // Преобразуем артикул в тег
          const articleTag = articleToTag(article);
          
          if (articleTag) {
            // Формируем params как в loadImagesFromBackend
            const params = {
              page: 1,
              limit: 100,
              sortBy: 'uploadDate',
              sortOrder: 'desc'
            };

            // Подготовка тегов с дублированием для бэкенда (как в вашем коде)
            if (articleTag) {
              params.tags = [articleTag, articleTag]; // Дублируем для одного тега
            }

            // Очищаем пустые параметры
            Object.keys(params).forEach(key => {
              if (params[key] === '' || params[key] === undefined || 
                  (Array.isArray(params[key]) && params[key].length === 0)) {
                delete params[key];
              }
            });

            console.log('Параметры запроса к хранилищу:', params);

            // Выбираем нужный API метод в зависимости от прав
            const storageResponse = (isAdmin || isUploader) 
              ? await apiGetAllImages(params)
              : await apiGetImagesExcludingMarketplaces(params);

            console.log('Ответ от хранилища:', storageResponse);

            if (storageResponse && storageResponse.files && Array.isArray(storageResponse.files)) {
              const storageImageUrls = storageResponse.files.map(file => 
                `https://mp.sharik.ru${file.url}`
              );
              console.log('Изображения из хранилища:', storageImageUrls);
              setStorageImages(storageImageUrls);
            } else {
              console.warn('Хранилище вернуло пустой ответ или неверный формат');
              setErrors(prev => ({ ...prev, storage: 'Нет изображений в хранилище' }));
            }
          } else {
            console.warn('Не удалось преобразовать артикул в тег');
            setErrors(prev => ({ ...prev, storage: 'Неверный формат артикула' }));
          }
        } catch (storageError) {
          console.warn('Ошибка при запросе к хранилищу:', storageError);
          setErrors(prev => ({ ...prev, storage: 'Не удалось подключиться к хранилищу' }));
          setStorageImages([]);
        }

      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [article, isAdmin, isUploader]);

  // Выводим в консоль при изменении состояний
  useEffect(() => {
    if (productInfo) {
      console.log('Стейт productInfo обновлен:', productInfo);
    }
  }, [productInfo]);

  useEffect(() => {
    if (productImages.length > 0) {
      console.log('Стейт productImages обновлен:', productImages);
    }
  }, [productImages]);

  useEffect(() => {
    if (storageImages.length > 0) {
      console.log('Стейт storageImages обновлен:', storageImages);
    }
  }, [storageImages]);

  return (
    <div>
      <div className='header-section' style={{ margin: '10px 10px 0px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>
          {article ? article : 'Неизвестный товар'}
        </h2>
      </div>

      {loading && <div style={{ padding: '20px' }}>Загрузка...</div>}
      
      {/* Отображаем ошибки, но не блокируем отображение других данных */}
      {errors.portal && (
        <div style={{ padding: '10px 20px', color: '#ff6b6b', background: '#fff5f5', borderBottom: '1px solid #ffc9c9' }}>
          Ошибка портала: {errors.portal}
        </div>
      )}

      {errors.storage && (
        <div style={{ padding: '10px 20px', color: '#ff6b6b', background: '#fff5f5', borderBottom: '1px solid #ffc9c9' }}>
          Ошибка хранилища: {errors.storage}
        </div>
      )}

      {/* Визуализация данных для отладки */}
      {productInfo && (
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h3>Информация о товаре:</h3>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(productInfo, null, 2)}
          </pre>
        </div>
      )}

      {productImages.length > 0 && (
        <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
          <h3>Изображения с портала ({productImages.length}):</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {productImages.map((img, index) => (
              <div key={index} style={{ width: '150px' }}>
                <img src={img} alt={`portal-${index}`} style={{ width: '100%', height: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {storageImages.length > 0 && (
        <div style={{ padding: '20px' }}>
          <h3>Изображения из хранилища ({storageImages.length}):</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {storageImages.map((img, index) => (
              <div key={index} style={{ width: '150px' }}>
                <img src={img} alt={`storage-${index}`} style={{ width: '100%', height: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};