import { useContext, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useGetCode } from '../../hooks/useGetCode';
import { apiGetAllImages, apiGetImagesExcludingMarketplaces } from '../../services/mediaService';
import { ImageSliderModal } from '../../components/ImageSliderModal';

// Функция преобразования артикула в тег
const articleToTag = (article) => {
  if (!article) return null;
  return article.trim();
};

export const Products = () => {  
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { article } = useParams();
  const { isAdmin, isUploader } = useAuth();
  const getCode = useGetCode();
  
  const [productInfo, setProductInfo] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [storageImages, setStorageImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    portal: null,
    storage: null
  });

  // Состояния для слайдера
  const [sliderConfig, setSliderConfig] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    source: null // 'portal' или 'storage'
  });

  const handleBack = () => {
    navigate(-1);
  };

  // Функция открытия слайдера для портала
  const openPortalSlider = (index) => {
    setSliderConfig({
      isOpen: true,
      images: productImages,
      currentIndex: index,
      source: 'portal'
    });
  };

  // Функция открытия слайдера для хранилища
  const openStorageSlider = (index) => {
    setSliderConfig({
      isOpen: true,
      images: storageImages,
      currentIndex: index,
      source: 'storage'
    });
  };

  // Функция закрытия слайдера
  const closeSlider = () => {
    setSliderConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Функция изменения индекса в слайдере
  const handleSliderIndexChange = (newIndex) => {
    setSliderConfig(prev => ({ ...prev, currentIndex: newIndex }));
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

            // Подготовка тегов с дублированием для бэкенда
            if (articleTag) {
              params.tags = [articleTag, articleTag];
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
                `https://mp.sharik.ru${file.thumbnailUrl}`
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

  // Получаем коды для маркетплейсов
  const wbCode = article ? getCode(article, "WB") : null;
  const ozCode = article ? getCode(article, "OZ") : null;
  
  // Проверяем, есть ли товар на какой-либо площадке
  const hasMarketplace = (wbCode !== article) || (ozCode !== article);

  return (
    <div className="products-container">
      {/* Шапка */}
      <div className='header-section' style={{ margin: '10px 10px 0px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>
          {article ? article : 'Неизвестный товар'}
        </h2>
        
        {/* Блок с информацией о маркетплейсах */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          marginLeft: 'auto'
        }}>
          {hasMarketplace ? (
            <>
              <span style={{ color: '#666', fontSize: '14px' }}>
                {t('grid.linkTo')}
              </span>
              {wbCode !== article && (
                <a 
                  className="marketplace-link"
                  href={`https://www.wildberries.ru/catalog/${wbCode}/detail.aspx`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_275_5)">
                      <path d="M0 239.894C0 155.923 0 113.938 16.3419 81.8655C30.7165 53.6535 53.6535 30.7165 81.8655 16.3419C113.938 0 155.923 0 239.894 0H271.106C355.077 0 397.062 0 429.135 16.3419C457.346 30.7165 480.284 53.6535 494.659 81.8655C511 113.938 511 155.923 511 239.894V271.106C511 355.077 511 397.062 494.659 429.135C480.284 457.346 457.346 480.284 429.135 494.659C397.062 511 355.077 511 271.106 511H239.894C155.923 511 113.938 511 81.8655 494.659C53.6535 480.284 30.7165 457.346 16.3419 429.135C0 397.062 0 355.077 0 271.106V239.894Z" fill="url(#paint0_linear_275_5)"/>
                      <path d="M386.626 180.313C368.325 180.313 351.797 185.847 337.686 195.32V108.862H298.648V268.31C298.648 316.821 338.115 355.859 386.411 355.859C434.708 355.859 474.623 317.054 474.623 267.862C474.623 218.669 435.584 180.313 386.626 180.313ZM209.461 279.576L173.736 186.511H146.391L110.45 279.576L74.5113 186.511H31.9255L94.781 350.149H122.126L159.839 252.679L197.767 350.149H225.111L287.753 186.511H245.4L209.461 279.576ZM386.43 316.84C359.963 316.84 337.686 295.674 337.686 268.096C337.686 240.517 358.638 219.585 386.645 219.585C414.652 219.585 435.604 241.413 435.604 268.096C435.604 294.778 413.327 316.84 386.43 316.84Z" fill="white"/>
                    </g>
                    <defs>
                      <linearGradient id="paint0_linear_275_5" x1="171.882" y1="555.132" x2="485.45" y2="32.5182" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#6F01FB"/>
                        <stop offset="1" stopColor="#FF49D7"/>
                      </linearGradient>
                      <clipPath id="clip0_275_5">
                        <rect width="511" height="511" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </a>
              )}
              {ozCode !== article && (
                <a 
                  className="marketplace-link"
                  href={`https://www.ozon.ru/product/${ozCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    textDecoration: 'none'
                  }}
                >
                  <svg width="30" height="30" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_275_2)">
                      <rect width="511" height="511" fill="white"/>
                      <path d="M106.458 0H404.542C463.335 0 511 47.6649 511 106.458V404.542C511 463.335 463.335 511 404.542 511H106.458C47.6649 511 0 463.335 0 404.542V106.458C0 47.6649 47.6649 0 106.458 0Z" fill="#2962FF"/>
                      <path d="M222.577 282.594H188.589L231.982 208.491C232.934 206.871 232.669 204.484 231.401 203.274C230.926 202.796 230.292 202.524 229.671 202.524H166.899C161.378 202.524 156.873 208.355 156.873 215.465C156.873 222.575 161.391 228.406 166.899 228.406H195.101L151.563 302.577C150.559 304.197 150.823 306.516 152.091 307.794C152.62 308.34 153.241 308.613 153.875 308.545H222.524C228.046 308.204 232.299 302.1 232.035 294.921C231.771 288.271 227.676 282.986 222.524 282.645V282.576L222.577 282.594ZM441.921 202.524C436.4 202.524 431.895 208.355 431.895 215.465V258.927L377.683 203.393C376.481 202.097 374.632 202.302 373.641 203.939C373.218 204.621 373.007 205.422 373.007 206.309V295.603C373.007 302.73 377.525 308.545 383.033 308.545C388.542 308.545 393.059 302.782 393.059 295.603V252.141L447.271 307.743C448.526 309.039 450.375 308.766 451.366 307.129C451.789 306.447 452 305.646 452 304.828V215.465C451.96 208.287 447.496 202.524 441.921 202.524ZM298.479 285.032C275.521 285.032 258.401 269.43 258.401 255.466C258.401 241.501 275.574 225.9 298.479 225.9C321.437 225.9 338.557 241.501 338.557 255.466C338.557 269.43 321.477 285.032 298.479 285.032ZM298.479 200C265.284 200 238.336 224.809 238.336 255.466C238.336 286.123 265.284 310.932 298.479 310.932C331.675 310.932 358.622 286.123 358.622 255.466C358.622 224.809 331.675 200 298.479 200ZM101.023 285.1C88.3687 285.1 78.0652 271.886 78.0652 255.534C78.0652 239.182 88.3026 225.9 100.971 225.9C113.638 225.9 123.929 239.114 123.929 255.466V255.534C123.929 271.818 113.691 285.032 101.023 285.1ZM101.023 200C77.2859 200 58.0528 224.809 58 255.466C58 286.106 77.2198 310.932 100.971 311C124.708 311 143.941 286.191 143.994 255.534V255.466C143.941 224.826 124.721 200 101.023 200Z" fill="white"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_275_2">
                        <rect width="511" height="511" fill="white"/>
                      </clipPath>
                    </defs>
                  </svg>
                </a>
              )}
            </>
          ) : (
            <span style={{ color: '#999', fontSize: '14px', fontStyle: 'italic' }}>
              {t('grid.linkNo')}
            </span>
          )}
        </div>
      </div>

      {/* Контейнер с панелью слева и контентом */}
      <div className="content-wrapper">
        {/* Пустая панель слева */}
        <div className="empty-sidebar">
          <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            <h4 style={{ margin: '0' }}>Информация о товаре:</h4>
              
          </div>
        </div>
        
        {/* Основной контент */}
        <div className="main-content">
          {loading && <div style={{ padding: '20px' }}>Загрузка...</div>}
          
          {/* Отображаем ошибки, но не блокируем отображение других данных */}
          {errors.portal && (
            <div style={{ padding: '10px 20px', color: '#ff6b6b', background: '#fff5f5', borderLeft: '2px solid #ffa1a1', borderRadius: '4px' }}>
              Ошибка портала: {errors.portal}
            </div>
          )}

          {errors.storage && (
            <div style={{ padding: '10px 20px', color: '#ff6b6b', background: '#fff5f5', borderLeft: '2px solid #ffa1a1', borderRadius: '4px' }}>
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

          {/* Секция с изображениями с портала */}
          {productImages.length > 0 && (
            <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
              <h3>Изображения с портала ({productImages.length}):</h3>
              <div className="image-grids">
                {productImages.map((img, index) => (
                  <div 
                    key={index} 
                    className="images_card"
                    onClick={() => openPortalSlider(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="images-container">
                      <img src={img} alt={`portal-${index}`} className="image-thumbnail" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Секция с изображениями из хранилища */}
          {storageImages.length > 0 && (
            <div style={{ padding: '20px' }}>
              <h3>Изображения из хранилища ({storageImages.length}):</h3>
              <div className="image-grids">
                {storageImages.map((img, index) => (
                  <div 
                    key={index} 
                    className="images_card"
                    onClick={() => openStorageSlider(index)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="images-container">
                      <img src={img} alt={`storage-${index}`} className="image-thumbnail" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Модалка слайдера */}
          {sliderConfig.isOpen && (
            <ImageSliderModal
              baseCode={sliderConfig.source === 'portal' ? `${article} (портал)` : `${article} (хранилище)`}
              images={sliderConfig.images}
              currentIndex={sliderConfig.currentIndex}
              onClose={closeSlider}
              onIndexChange={handleSliderIndexChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};