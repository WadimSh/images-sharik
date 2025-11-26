import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { FaRegHeart, FaHeart } from 'react-icons/fa';

import { PreviewDesign } from '../../components/PreviewDesign';
import { useMarketplace } from '../../contexts/contextMarketplace';
import { LanguageContext } from '../../contexts/contextLanguage';
import { historyDB } from '../../utils/handleDB';
import { apiGetAllHistories, apiCreateHistoriy } from '../../services/historiesService';

import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';

// Парсит код истории для извлечения articles, marketplace, type, size
// Артикулы разделены подчеркиванием, каждый артикул может содержать дефисы
const parseHistoryCode = (code) => {
  const parts = code.split('_');
  
  if (parts.length < 6) {
    return {
      articles: [],
      marketplace: '',
      type: 'unknown',
      size: ''
    };
  }
  
  // Определяем индекс типа (collage, main, slideX)
  let typeIndex = -1;
  let type = 'unknown';
  
  // Ищем тип дизайна
  if (parts.includes('collage')) {
    typeIndex = parts.indexOf('collage');
    type = 'collage';
  } else if (parts.includes('main')) {
    typeIndex = parts.indexOf('main');
    type = 'main';
  } else {
    // Ищем любой слайд (slideX)
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('slide')) {
        typeIndex = i;
        type = parts[i]; // сохраняем как "slide1", "slide2" и т.д.
        break;
      }
    }
  }
  
  // Если не нашли тип, возвращаем значения по умолчанию
  if (typeIndex === -1) {
    return {
      articles: [],
      marketplace: '',
      type: 'unknown',
      size: ''
    };
  }
  
  // Артикулы - это все части ДО marketplace (то есть до typeIndex - 1)
  const articles = parts.slice(0, typeIndex - 1);
  const marketplace = parts[typeIndex - 1] || '';
  const size = parts[typeIndex + 1] || '';
  
  return {
    articles, // массив артикулов, где каждый элемент - это артикул (может содержать дефисы)
    marketplace,
    type,
    size
  };
};

// Преобразует историю из формата IndexedDB в формат бэкенда
const transformHistoryForBackend = (historyItem) => {
  try {
    const { code, data } = historyItem;
    
    // Парсим код для извлечения дополнительных полей
    const parsedInfo = parseHistoryCode(code);
    
    // Формируем объект для бэкенда
    return {
      name: code, // code становится name
      data: data, // data остается как есть
      company: localStorage.getItem('company'), // ID компании из localStorage
      articles: parsedInfo.articles,
      marketplace: parsedInfo.marketplace,
      type: parsedInfo.type,
      size: parsedInfo.size
    };
  } catch (error) {
    console.error('Ошибка преобразования истории:', error, historyItem);
    return null;
  }
};

export const Gallery = () => {
  const navigate = useNavigate();
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingItemKey, setLoadingItemKey] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const { t } = useContext(LanguageContext);
  const { marketplace, toggleMarketplace } = useMarketplace();

  const is = localStorage.getItem('migrat')
  const [isMigrat, setMigrat] = useState(is)

  // ----
  const [localLikes, setLocalLikes] = useState(() => {
    // Загружаем из localStorage при инициализации
    const saved = localStorage.getItem('gallery-likes');
    return saved ? JSON.parse(saved) : {};
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(100);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении количества
  };
  // Функция для переключения лайка
  const handleToggleLike = (designKey, e) => {
    e.stopPropagation();
    
    setLocalLikes(prev => {
      const currentLike = prev[designKey] || { likesCount: 0, hasLiked: false };
      const newLike = {
        likesCount: currentLike.hasLiked ? currentLike.likesCount - 1 : currentLike.likesCount + 1,
        hasLiked: !currentLike.hasLiked
      };
      
      const newLikes = {
        ...prev,
        [designKey]: newLike
      };
      
      // Сохраняем в localStorage
      localStorage.setItem('gallery-likes', JSON.stringify(newLikes));
      return newLikes;
    });
  };
  // -----

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
    // Удаляем из выбранных, если был выбран
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  // Функция для массового удаления выбранных дизайнов
  const handleBulkDelete = async () => {
    try {
      const keysToDelete = Array.from(selectedItems);
      
      // Удаляем из базы данных
      for (const key of keysToDelete) {
        await historyDB.delete(key);
      }
      
      // Обновляем состояние
      setDesigns(prev => prev.filter(item => !selectedItems.has(item.key)));
      setSelectedItems(new Set());
      setIsSelectionMode(false);
            
    } catch (error) {
      console.error('Error during bulk deletion:', error);
    }
  };

  // Функция для отмены выбора
  const handleCancelSelection = () => {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  };

  // Функция переключения выбора элемента
  const toggleItemSelection = (key, e) => {
    e.stopPropagation();
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      
      // Если есть выбранные элементы, включаем режим выбора
      if (newSet.size > 0 && !isSelectionMode) {
        setIsSelectionMode(true);
      }
      // Если все элементы отменены, выключаем режим выбора
      else if (newSet.size === 0 && isSelectionMode) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  // Функция извлечения данных для построения структуры данных для страницы генерации
  const handleItemClick = async (design) => {
    // Если включен режим выбора, обрабатываем клик как выбор элемента
    if (isSelectionMode) {
      toggleItemSelection(design.key, { stopPropagation: () => {} });
      return;
    }

    setLoadingItemKey(design.key); // Устанавливаем ключ загружаемой карточки
    
    // Проверяем, является ли дизайн коллажем
    if (design.key.includes('_collage')) {
      try {
        // Получаем данные дизайна из таблицы history
        const historyItem = await historyDB.get(design.key);
            
        if (!historyItem) {
            throw new Error('The design was not found in the history');
        }
        
        // Сохраняем основной объект коллажа
        localStorage.setItem('design-collage', JSON.stringify(historyItem.data));
        localStorage.setItem('size', JSON.stringify(design.size))
        // Извлекаем артикулы из ключа
        const articles = extractArticlesFromKey(design.key);
        
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
      const historyItem = await historyDB.get(design.key);
            
      if (!historyItem) {
          throw new Error('The design was not found in the history');
      }

      // Извлекаем информацию о типе дизайна
      const designInfo = extractDesignInfo(design.key);

      // Формируем ключ для sessionStorage
      const storageKey = `design-${designInfo.article}_${designInfo.slideNumber}`;

      // Сохраняем данные в sessionStorage
      sessionStorage.setItem(storageKey, JSON.stringify(historyItem.data));
      sessionStorage.setItem('size', JSON.stringify(design.size))
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
      
      //try {
      //  const result = await apiGetAllHistories()
      //  console.log(result)
      //} catch (error) {
      //  console.log(error);
      //}
  
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
          let size = ''
          
          // Ищем индекс части с датой (обычно это предпоследняя часть)
          if (parts.length >= 6) {
            size = parts[parts.length - 3];
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
            sortKey: `${sortableDate} ${sortableTime}`, // Ключ для сортировки
            size: size
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

  const handleMigration = async () => {
    try {
      // Получаем все записи из таблицы history
      const allHistoryItems = await historyDB.getAll();

      console.log(`Найдено ${allHistoryItems.length} историй для миграции`);

      let successCount = 0;
      let errorCount = 0;

      // Преобразуем и отправляем истории
      const historiesToMigrate = allHistoryItems.map(historyItem => {
        return transformHistoryForBackend(historyItem);
      }).filter(Boolean);
    
      const sortedHistories = historiesToMigrate
        .map(history => {
          const size = new Blob([JSON.stringify(history.data)]).size;
          return { history, size };
        })
        .sort((a, b) => a.size - b.size)
        .map(item => item.history);
      
      for (const historyData of sortedHistories) {
        try {
          const dataSize = new Blob([JSON.stringify(historyData.data)]).size;
          console.log(`Размер истории ${historyData.name}: ${(dataSize / 1024 / 1024).toFixed(2)} MB`);
        
          // ДИНАМИЧЕСКАЯ ЗАДЕРЖКА в зависимости от размера
          let delay = 200; // базовая задержка
          if (dataSize > 5 * 1024 * 1024) delay = 2000; // 2s для >5MB
          else if (dataSize > 2 * 1024 * 1024) delay = 1000; // 1s для >2MB
          else if (dataSize > 1 * 1024 * 1024) delay = 500; // 0.5s для >1MB
        
          await apiCreateHistoriy(historyData);
          successCount++;
          console.log(`✅ История ${historyData.name} успешно мигрирована`);
        
          await new Promise(resolve => setTimeout(resolve, delay));
        } catch (error) {
          errorCount++;
          console.warn(`❌ Ошибка при миграции истории ${historyData.name}:`, error);
        
          // ПРОБУЕМ ПОВТОРИТЬ запрос с увеличенной задержкой
          if (error.message.includes('timeout') || error.message.includes('network')) {
            console.log(`🔄 Повторная попытка для ${historyData.name}...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // 3s пауза
            try {
              await apiCreateHistoriy(historyData);
              successCount++;
              errorCount--;
              console.log(`✅ История ${historyData.name} мигрирована после повтора`);
            } catch (retryError) {
              console.warn(`❌ Повторная ошибка для ${historyData.name}:`, retryError);
            }
          }
        }
      }
    
      console.log(`Миграция завершена: ${successCount} успешно, ${errorCount} с ошибками`);
      localStorage.setItem('migrat', true);
      setMigrat(true)    
    } catch (migrationError) {
      console.error('Критическая ошибка при миграции историй:', migrationError);
    }
  }

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
      marketplaceName: marketplace === 'WB' ? 'Wildberries' : marketplace === 'OZ' ? 'Ozon' : marketplace === 'AM' ? 'Amazon' : marketplace,
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
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.subtitle')}</h2>

        {!isMigrat && <button onClick={handleMigration} className="template-button">Миграция данных</button>}
      </div>

      {/* Панель массового удаления */}
    
        <div className={`bulk-action-bar ${isSelectionMode ? 'visible' : ''}`}>
          <div className="bulk-action-info">
            {t('selection.counter')} {selectedItems.size}
          </div>
          <div className="bulk-action-buttons">
            <button 
              className="bulk-cancel-button"
              onClick={handleCancelSelection}
            >
              {t('modals.cancel')}
            </button>
            <button 
              className="bulk-delete-button"
              onClick={handleBulkDelete}
              disabled={selectedItems.size === 0}
            >
              {t('modals.delete')} ({selectedItems.size})
            </button>
          </div>
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
            const likeInfo = localLikes[design.key] || { likesCount: 0, hasLiked: false };
            const isSelected = selectedItems.has(design.key);
            const isHovered = hoveredItem === design.key;
            
            return (
              <div 
                key={design.key} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                onMouseEnter={() => setHoveredItem(design.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
              
              <div 
                className='item-card'
                style={{ flexDirection: 'column', width: '100%', maxWidth: '270px', maxHeight: '360px', minWidth: '270px', minHeight: '360px', position: 'relative' }}
                onClick={(e) => {
                  if (isSelectionMode) {
                    toggleItemSelection(design.key, e);
                  } else {
                    marketplace !== info.marketplace && toggleMarketplace(info.marketplace);
                    handleItemClick(design);
                  }
                }}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredItem(design.key)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Счетчик лайков - ВСЕГДА видим если есть лайки 
                {likeInfo.likesCount > 0 && (
                  <div 
                    className="likes-count"
                    style={{
                      position: 'absolute',
                      bottom: '42px',
                      right: '16px',
                      width: '20px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#626262',
                      zIndex: 5
                    }}
                  >
                    {likeInfo.likesCount}
                  </div>
                )}*/}
                {/* Кнопка лайка - ВСЕГДА видима 
                <button
                  className="like-button"
                  onClick={(e) => handleToggleLike(design.key, e)}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {likeInfo.hasLiked ? (
                    <FaHeart color="#ff4757" size={16} />
                  ) : (
                    <FaRegHeart color="#ff4757" size={16} />
                  )}
                </button>*/}
                
                
                {/* Кнопка удаления - ВСЕГДА видима */}
                <button
                  className="delete-buttons"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(design.key);
                  }}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    fontSize: '18px',
                    fontWeight: '400',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  ×
                </button>
                
                {/* Чекбокс выбора - ТОЛЬКО при наведении */}
                {(isHovered || isSelected) && (
                  <div 
                    className="selection-checkbox-container"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(design.key, e);
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      zIndex: 10
                    }}
                  >
                    <input
                      type="checkbox"
                      className="selection-checkbox"
                      checked={isSelected}
                      readOnly
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}

                <div className="item-content">
                  <PreviewDesign elements={design.data} size={design.size} />
              
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
        {/*<div style={{ marginTop: 'auto', borderTop: "1px solid #ccc" }}>
          <PaginationPanel
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
            itemsPerPageOptions={[10, 25, 50, 100]} // опционально
          />
        </div>*/}
        
      </div>
    </div>
  );
};