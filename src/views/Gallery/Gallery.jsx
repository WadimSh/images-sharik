import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

import { PreviewDesign } from '../../components/PreviewDesign';
import { useMarketplace } from '../../contexts/contextMarketplace';
import { LanguageContext } from '../../contexts/contextLanguage';
import { historyDB } from '../../utils/handleDB';

export const Gallery = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingItemKey, setLoadingItemKey] = useState(null);
  const { t } = useContext(LanguageContext)
  const { marketplace, toggleMarketplace } = useMarketplace();

  const processProductsMeta = (productsData) => {
    if (!Array.isArray(productsData)) {
      console.error('Incorrect data for processing:', productsData);
      return [];
    }
  
    return productsData.map(item => {
      if (!item || !item.images || !Array.isArray(item.images)) {
        console.warn('Incorrect product element:', item);
        return null;
      }
  
      const properties = item.properties || [];
      const originProperties = item.origin_properties || [];
  
      // Формируем массив ссылок на изображения
      const images = item.images.map(image => 
        `https://new.sharik.ru${image.image}`
      );

      const propertiesList = properties.map(prop => ({ name: prop.name, value: prop.value }));
      const originPropertiesList = originProperties.map(prop => ({ name: prop.name, value: prop.value }));

      // Добавляем определение типа шаблона
      const brandProperty = originPropertiesList.find(p => p.name === 'Торговая марка');
      const brand = brandProperty ? brandProperty.value : '';
      const templateType = brand.toLowerCase() === 'gemar' ? 'gemar' : brand.toLowerCase() === 'belbal' ? 'belbal' : 'main';
  
      return {
        code: item.code,
        name: item.name,
        multiplicity: item.multiplicity,
        link: `https://new.sharik.ru/tovary-dly-prazdnika/${item.slug}`,
        images: images, // Массив ссылок на все изображения товара
        properties: propertiesList,
        originProperties: originPropertiesList,
        templateType: templateType, // Добавлено новое поле
      };
    }); // Фильтруем некорректные элементы
  };

  // Функция для удаления дизайна
  const handleDelete = async (key) => {
    await historyDB.delete(key);
    setDesigns(prev => prev.filter(item => item.key !== key));
  };

  // Функция извлечения данных для построения структуры данных для страницы генерации
  const handleItemClick = async (key) => {
    setLoadingItemKey(key); // Устанавливаем ключ загружаемой карточки
    
    // Проверяем, является ли дизайн коллажем
    if (key.includes('_collage')) {
      try {
        // Получаем данные дизайна из таблицы history
        const historyItem = await historyDB.get(key);
            
        if (!historyItem) {
            throw new Error('The design was not found in the history');
        }
        
        // Сохраняем основной объект коллажа
        localStorage.setItem('design-collage', JSON.stringify(historyItem.data));
        
        // Извлекаем артикулы из ключа
        const articles = extractArticlesFromKey(key);
        
        // Сохраняем массив артикулов
        localStorage.setItem('collage-articles', JSON.stringify(articles));
        
        // Перенаправляем на страницу коллажа
        navigate('/template/collage');
        return;
      } catch (error) {
        console.error('Error in collage processing:', error);
      } finally {
        setLoadingItemKey(null); // Изменено здесь
      }
    }
    
    // Обработка обычных дизайнов (не коллажей)
    try {
      // Получаем данные дизайна из таблицы history
      const historyItem = await historyDB.get(key);
            
      if (!historyItem) {
          throw new Error('The design was not found in the history');
      }

      // Извлекаем информацию о типе дизайна
      const designInfo = extractDesignInfo(key);

      // Формируем ключ для sessionStorage
      const storageKey = `design-${designInfo.article}_${designInfo.slideNumber}`;

      // Сохраняем данные в sessionStorage
      sessionStorage.setItem(storageKey, JSON.stringify(historyItem.data));

      // Выполняем запросы последовательно с await
      const searchResponse = await fetch(
        `https://new.sharik.ru/api/rest/v1/products_lite/?page_size=1&search=${designInfo.article}`
      );

      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        throw new Error("A product with this item number is not active.");
      }

      const productIds = searchData.results.map(product => product.id);
      const idsParam = productIds.join(',');

      const detailedResponse = await fetch(
        `https://new.sharik.ru/api/rest/v1/products_detailed/get_many/?ids=${idsParam}`
      );

      if (!detailedResponse.ok) {
        throw new Error('Error when receiving detailed information');
      }

      const detailedData = await detailedResponse.json();

      // Обрабатываем полученные данные API
      const processedMetaResults = processProductsMeta(detailedData);

      // Сохраняем обработанные данные
      processedMetaResults.forEach(item => {
        if (item) {
          sessionStorage.setItem(
            `product-${item.code}`, 
            JSON.stringify(item)
          );
        }
      });

      // Формируем роут для перехода
      const route = `/template/${designInfo.article}_${designInfo.slideNumber}`;

      // Перенаправляем
      navigate(route);
    } catch (error) {
      console.error('Design processing error:', error);
    } finally {
      setLoadingItemKey(null); // Сбрасываем после завершения
    }
  };

  // Функция для извлечения информации о дизайне из ключа
  const extractDesignInfo = (key) => {
    const parts = key.split('_');

    // Извлекаем артикул (первая часть)
    const article = parts[0];

    // Определяем номер слайда
    let slideNumber = 1; // По умолчанию main = 1

    // Ищем часть, содержащую информацию о типе слайда
    const slidePart = parts.find(part => 
      part === 'main' || part.startsWith('slide')
    );

    if (slidePart) {
      if (slidePart === 'main') {
        slideNumber = 1;
      } else if (slidePart.startsWith('slide')) {
        // Извлекаем номер из slide2, slide3 и т.д.
        const numberPart = slidePart.replace('slide', '');
        const parsedNumber = parseInt(numberPart, 10);
        if (!isNaN(parsedNumber)) {
          slideNumber = parsedNumber;
        }
      }
    }

    return {
      article,
      slideNumber
    };
  };

  // Функция для извлечения артикулов из ключа
  const extractArticlesFromKey = (key) => {
    // Разбиваем ключ на части
    const parts = key.split('_');
    
    // Первая часть содержит артикулы
    const articlesPart = parts[0];
    
    // Разделяем артикулы (могут быть через дефис или подчеркивание)
    const articlePattern = /\d{4}-\d{4}/g;
    const matches = articlesPart.match(articlePattern);
    
    return matches || [];
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Функция для загрузки дизайнов из истории
  const loadDesigns = async () => {
    try {
      setLoading(true);
  
      // Регулярное выражение для поиска ключей с артикулами
      const articlePattern = /^\d{4}-\d{4}/;
  
      // Получаем все записи из таблицы history
      const allHistoryItems = await historyDB.getAll();
  
      // Фильтруем, преобразуем и сортируем данные
      const loadedDesigns = allHistoryItems
        .filter(item => articlePattern.test(item.code)) // Фильтруем по шаблону артикула
        .map(item => {
          // Парсим дату и время из ключа
          const parts = item.code.split('_');
          let date = '';
          let time = '';
          
          // Ищем индекс части с датой (обычно это предпоследняя часть)
          if (parts.length >= 6) {
            date = parts[parts.length - 2];
            time = parts[parts.length - 1];
          }
          
          // Преобразуем дату и время в формат для сортировки
          const sortableDate = date.length === 8 
            ? `${date.substring(4)}-${date.substring(2, 4)}-${date.substring(0, 2)}` 
            : '1970-01-01'; // Если дата не распознана, ставим минимальную
          
          const sortableTime = time.length >= 4 
            ? `${time.substring(0, 2)}:${time.substring(2, 4)}:${time.length >= 6 ? time.substring(4, 6) : '00'}` 
            : '00:00:00';
          
          return {
            key: item.code,
            data: item.data,
            title: item.code,
            sortKey: `${sortableDate} ${sortableTime}` // Ключ для сортировки
          };
        })
        // Сортируем по убыванию (новые сначала)
        .sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  
      setDesigns(loadedDesigns);
  
    } catch (error) {
      console.error('Error loading designs from the database:', error);
    } finally {
      setLoading(false);
    }
  };

   // Функция для парсинга и форматирования заголовка
   const parseDesignTitle = (title) => {
    const parts = title.split('_');
    
    // Проверяем минимальное количество частей
    if (parts.length < 6) {
      return {
        articles: title,
        marketplace: t('views.galleryUndefined'),
        designType: t('views.galleryUndefined'),
        dimensions: t('views.galleryUndefined'),
        date: t('views.galleryUndefined'),
        time: t('views.galleryUndefined'),
      };
    }
    
    // Определяем индекс типа дизайна (коллаж или слайд)
    let designTypeIndex = -1;
    let designType = t('views.galleryUndefined');
    
    // Сначала ищем "collage" или "main"
    if (parts.includes('collage')) {
      designTypeIndex = parts.indexOf('collage');
      designType = t('views.galleryCollage');
    } else if (parts.includes('main')) {
      designTypeIndex = parts.indexOf('main');
      designType = t('views.galleryDesign');
    } else {
      // Ищем любой слайд (slideX)
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('slide')) {
          designTypeIndex = i;
          designType = t('views.galleryDesign');
          break;
        }
      }
    }
    
    // Если не нашли тип дизайна, возвращаем неизвестные значения
    if (designTypeIndex === -1) {
      return {
        articles: title,
        marketplace: t('views.galleryUndefined'),
        designType: t('views.galleryUndefined'),
        dimensions: t('views.galleryUndefined'),
        date: t('views.galleryUndefined'),
        time: t('views.galleryUndefined'),
      };
    }
    
    // Извлекаем данные
    const articles = parts.slice(0, designTypeIndex - 1).join(', ');
    const marketplace = parts[designTypeIndex - 1];
    const dimensions = parts[designTypeIndex + 1];
    const date = parts[designTypeIndex + 2];
    const time = parts[designTypeIndex + 3];
    
    // Форматируем дату
    const formattedDate = date.length === 8 
      ? `${date.substring(0,2)}.${date.substring(2,4)}.${date.substring(4)}`
      : date;
    
    // Форматируем время
    const formattedTime = time.length === 6 
      ? `${time.substring(0,2)}:${time.substring(2,4)}`
      : time.length === 4 
        ? `${time.substring(0,2)}:${time.substring(2)}`
        : time;
    
    return {
      articles,
      marketplace,
      marketplaceName: marketplace === 'WB' ? 'Wildberries' : marketplace === 'OZ' ? 'Ozon' : marketplace,
      designType, // Уже определили как "Коллаж" или "Дизайн"
      dimensions,
      date: formattedDate,
      time: formattedTime
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      await loadDesigns();
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loader-container-gallery">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div>
      <div className='header-section' style={{ margin: '10px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
        {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.subtitle')}</h2>
      </div>
      <div className="items-grid-container">
        {designs.length === 0 ? (
          <div 
          style={{ color: '#333', fontSize: '16px', textAlign: 'center', marginTop: '20px' }}>
            <p>{t('views.galleryMessageTitle')}</p>
            <p>{t('views.galleryMessageSubtitle')}</p>
          </div>
        ) : (
        <div className="items-grid">
          {designs.map((design) => {
            const info = parseDesignTitle(design.title);
            return (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div 
                key={design.key} 
                className="item-card" 
                style={{ flexDirection: 'column', width: '100%', maxWidth: '270px', maxHeight: '360px', minWidth: '270px', minHeight: '360px' }}
                onClick={(e) => {
                  e.stopPropagation();
                  marketplace !== info.marketplace && toggleMarketplace();
                  handleItemClick(design.key);
                }}
                role="button"
                tabIndex={0}
              >
                <button
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(design.key);
                  }}
                >
                  ×
                </button>

                <div className="item-content">
                  <PreviewDesign elements={design.data} />

                  {loadingItemKey === design.key && 
                    <div className="loader-container-gallery">
                      <div className="loader"></div>
                    </div>
                  }

                </div>

              </div>
              <div className="design-info-plate">
                  <div className="info-row" style={{ fontSize: '14px', marginBottom: '10px' }}>
                    <span className="info-label">{info.designType} {t('views.galleryLabelFor')} {info.marketplaceName}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">{t('views.galleryLabelProducts')}</span>
                    <span className="info-value">{info.articles}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">{t('views.galleryLabelSlideSize')}</span>
                    <span className="info-value">{info.dimensions}</span>
                  </div>

                  <div className="info-row">
                    <span className="info-label">{t('views.galleryLabelGenerated')}</span>
                    <span className="info-value">{info.date} {t('views.galleryLabelAt')} {info.time}</span>
                  </div>

                  </div>
              </div>
            );
          })} 
        </div>)}
      </div>
    </div>
  );
};