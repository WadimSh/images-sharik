import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { FaRegHeart, FaHeart } from 'react-icons/fa';

import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';
import GalleryFilters from '../../components/GalleryFilters/GalleryFilters';
import { PreviewDesign } from '../../components/PreviewDesign';

import { useMarketplace } from '../../contexts/contextMarketplace';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { historyDB } from '../../utils/handleDB';
import { apiGetAllHistories, apiToggleLikeHistoriy, apiDeleteHistoriy, apiBulkDeactivateHistories } from '../../services/historiesService';
import { SIZE_PRESETS_BY_MARKETPLACE } from '../../constants/sizePresetsByMarketplace';

export const Gallery2 = () => {
  const navigate = useNavigate();

  const { t } = useContext(LanguageContext);
  const { marketplace, toggleMarketplace } = useMarketplace();
  const { user } = useAuth();

  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingItemKey, setLoadingItemKey] = useState(null);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [likingItem, setLikingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    mine: false,
    search: '',      // для поиска по артикулам (если первые 2 символа цифры)
    ownerSearch: '', // для поиска по автору (если первые 2 символа НЕ цифры)
    marketplace: '',
    size: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const currentUserId = user?.id || null; 
  
  const transformDesignData = (design) => {
    const likesArray = design.likes || [];
    const likesCount = likesArray.length;
    const hasLiked = currentUserId ? likesArray.includes(currentUserId) : false;
    
    return {
      ...design,
      likesCount,
      hasLiked
    };
  };

  const isDesignBelongsToUser = (design) => {
    if (!user || !design.owner) return false;

    return design.owner._id === user.id;
  }

  const loadDesignsFromBackend = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...filters
      };
      
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const result = await apiGetAllHistories(params);
      
      if (result && result.data) {
        const transformedDesigns = result.data.map(transformDesignData);
        setDesigns(transformedDesigns);
        setTotalCount(result.pagination.total);
      } else {
        setDesigns([]);
        setTotalCount(0);
      }
      
    } catch (error) {
      console.error('Error loading designs from backend:', error);
      setDesigns([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  };

  const handleToggleLike = async (designId, e) => {
    e.stopPropagation();

    if (!user) {
      navigate('/sign-in');
      return;
    }
    
    if (likingItem === designId) return;
    
    try {
      setLikingItem(designId);
      
      // Оптимистичное обновление UI
      setDesigns(prev => prev.map(design => {
        if (design.id === designId) {
          const newHasLiked = !design.hasLiked;
          const newLikesCount = newHasLiked ? 
            (design.likesCount || 0) + 1 : 
            Math.max(0, (design.likesCount || 0) - 1);
          
          return {
            ...design,
            hasLiked: newHasLiked,
            likesCount: newLikesCount
          };
        }
        return design;
      }));
      
      const result = await apiToggleLikeHistoriy(designId);
      
      if (result && result.success && result.data) {
        setDesigns(prev => prev.map(design => {
          if (design.id === designId) {
            return {
              ...design,
              hasLiked: result.data.hasLiked,
              likesCount: result.data.likesCount
            };
          }
          return design;
        }));
      } else {
        console.warn('Like toggle response was not successful:', result);
        await loadDesignsFromBackend();
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      await loadDesignsFromBackend();
    } finally {
      setLikingItem(null);
    }
  };

  useEffect(() => {
    loadDesignsFromBackend();
  }, [loadDesignsFromBackend]);
 
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

  // Функция для парсинга и форматирования заголовка
  const parseDesignTitle = (design) => {
    
    return {
      articles: design.articles || '---',
      marketplace: design.marketplace || t('views.galleryUndefined'),
      marketplaceName: design.marketplace === 'WB' ? 'Wildberries' : 
                       design.marketplace === 'OZ' ? 'Ozon' : 
                       design.marketplace === 'AM' ? 'Amazon' : 
                       design.marketplace || t('views.galleryUndefined'),
      designType: design.type === 'collage' ? t('views.galleryCollage') : t('views.galleryDesign'),
      dimensions: design.size || t('views.galleryUndefined'),
      date: design.createdAt ? new Date(design.createdAt).toLocaleDateString() : t('views.galleryUndefined'),
      time: design.createdAt ? new Date(design.createdAt).toLocaleTimeString() : t('views.galleryUndefined'),
      owner: design.owner?.username || '---'
    };
  };

  const handleBack = () => {
    navigate(-1);
  };


  // переделать

  // Функция для удаления дизайна
  const handleDelete = async (key) => {
    try {
      // Получаем дизайн по ключу или ID
      const design = designs.find(item => item.key === key || item.id === key);

      if (!design) {
        console.error('Design not found:', key);
        return;
      }

      // Проверяем, что дизайн принадлежит текущему пользователю
      if (!isDesignBelongsToUser(design)) {
        console.error('Cannot delete: design does not belong to current user');
        // Можно показать сообщение пользователю
        alert('Вы можете удалять только свои дизайны');
        return;
      }

      // Проверяем наличие ID для удаления с бэкенда
      if (!design.id) {
        console.error('Design has no ID for backend deletion:', design);
        alert('Ошибка: дизайн не может быть удален');
        return;
      }

      // Показываем подтверждение
      if (!window.confirm('Вы уверены, что хотите удалить этот дизайн?')) {
        return;
      }

      // Оптимистичное обновление UI - сразу удаляем из интерфейса
      setDesigns(prev => prev.filter(item => item.id !== design.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      // Удаляем с бэкенда
      await apiDeleteHistoriy(design.id);
      console.log('Design deleted from backend:', design.id);

      // Показываем сообщение об успехе (опционально)
      // Можно добавить Toast или другое уведомление

    } catch (error) {
      console.error('Error deleting design:', error);

      // Восстанавливаем дизайн в UI при ошибке
      const design = designs.find(item => item.key === key || item.id === key);
      if (design) {
        setDesigns(prev => [...prev, design].sort((a, b) => {
          // Сохраняем исходный порядок сортировки
          return new Date(b.createdAt) - new Date(a.createdAt);
        }));
      }

      // Обработка ошибок
      if (error.response?.status === 404) {
        alert('Дизайн не найден или уже удален');
      } else if (error.response?.status === 403) {
        alert('У вас нет прав для удаления этого дизайна');
      } else if (error.response?.status === 401) {
        alert('Необходима авторизация');
        // Перенаправляем на страницу входа
        navigate('/sign-in');
      } else if (error.response?.status === 400) {
        alert('Некорректный запрос на удаление');
      } else {
        alert('Ошибка при удалении дизайна. Пожалуйста, попробуйте снова.');
      }
    }
  };

  // Функция для массового удаления выбранных дизайнов
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
  
    // Проверяем ограничение в 100 элементов
    if (selectedItems.size > 100) {
      alert(`Можно удалить не более 100 дизайнов за раз. Вы выбрали: ${selectedItems.size}`);
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите удалить ${selectedItems.size} выбранных дизайнов?`)) {
      return;
    }

    try {
      const idsToDelete = [];
      const validDesigns = [];

      // Собираем только валидные ID
      selectedItems.forEach(key => {
        const design = designs.find(item => item.key === key || item.id === key);
        if (design && design.id && isDesignBelongsToUser(design)) {
          // Проверка формата MongoDB ID
          if (/^[0-9a-fA-F]{24}$/.test(design.id)) {
            idsToDelete.push(design.id);
            validDesigns.push(design);
          }
        }
      });

      if (idsToDelete.length === 0) {
        alert('Нет выбранных дизайнов, которые можно удалить');
        return;
      }

      // Оптимистичное обновление
      setDesigns(prev => prev.filter(design => 
        !validDesigns.some(d => d.id === design.id)
      ));

      setSelectedItems(new Set());
      setIsSelectionMode(false);

      // Отправляем на бэкенд
      await apiBulkDeactivateHistories(idsToDelete);

      // Успешное удаление
      console.log(`Bulk deletion successful: ${idsToDelete.length} items`);

    } catch (error) {
      console.error('Bulk deletion error:', error);

      // При ошибке перезагружаем данные
      await loadDesignsFromBackend();
      setSelectedItems(new Set());
      setIsSelectionMode(false);

      // Показываем сообщение об ошибке
      const errorMsg = error.response?.data?.message || 'Ошибка при удалении дизайнов';
      alert(errorMsg);
    }
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

  

  return (
    <div>
      <div className='header-section' style={{ margin: '10px 10px 0px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.subtitle')}</h2>
      </div>

      {/* Панель фильтров */}
      <GalleryFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        marketplaceSizes={SIZE_PRESETS_BY_MARKETPLACE}
      />

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

      {/* Пагинация */} 
        <PaginationPanel
          currentPage={currentPage}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
          itemsPerPageOptions={[10, 25, 50]}
        />
        
      {loading ? (
        <div className="loader-container-gallery">
          <div className="loader"></div>
        </div>
      ) : (
      <div className="items-grid-container" style={{ paddingBottom: '86px' }}>
        {designs.length === 0 ? (
          <div 
          style={{ color: '#333', fontSize: '16px', textAlign: 'center', marginTop: '20px' }}>
            <p>{t('views.galleryMessageTitle')}</p>
            <p>{t('views.galleryMessageSubtitle')}</p>
          </div>
        ) : (
        <div className="items-grid">
          {designs.map((design) => {
            const info = parseDesignTitle(design);
            const isSelected = selectedItems.has(design.key || design.id);
            const isHovered = hoveredItem === (design.key || design.id);
            const isLiking = likingItem === design.id;
            const belongsToUser = isDesignBelongsToUser(design);
            
            return (
              <div 
                key={design.key || design.id} 
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                onMouseEnter={() => setHoveredItem(design.key || design.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
               
              <div 
                className='item-card'
                style={{ flexDirection: 'column', width: '100%', maxWidth: '270px', maxHeight: '360px', minWidth: '270px', minHeight: '360px', position: 'relative' }}
                onClick={(e) => {
                  if (isSelectionMode) {
                    toggleItemSelection(design.key || design.id, e);
                  } else {
                    marketplace !== info.marketplace && toggleMarketplace(info.marketplace);
                    handleItemClick(design);
                  }
                }}
                role="button"
                tabIndex={0}
                onMouseEnter={() => setHoveredItem(design.key || design.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                
                {/* Кнопка лайка */}
                <button
                  className="like-button"
                  onClick={(e) => handleToggleLike(design.id, e)}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    border: 'none',
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    paddingBottom: design.likesCount > 0 ? '10px' : '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 5,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {isLiking ? (
                    <div className="loader-small"></div>
                  ) : design.hasLiked ? (
                    <FaHeart color="#ff4757" size={design.likesCount > 0 ? 16 : 20} />
                  ) : (
                    <FaRegHeart color="#ff4757" size={design.likesCount > 0 ? 16 : 20} />
                  )}
                </button>
                
                {/* Счетчик лайков - ВСЕГДА видим если есть лайки */}
                {design.likesCount > 0 && (
                  <div 
                    className="likes-count"
                    onClick={(e) => handleToggleLike(design.id, e)}
                    style={{
                      cursor: 'pointer',
                      position: 'absolute',
                      bottom: '12px',
                      right: '19px',
                      width: '20px',
                      textAlign: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#2d2d2d',
                      zIndex: 5
                    }}
                  >
                    {design.likesCount}
                  </div>
                )}
                
                {/* Кнопка удаления */}
                {belongsToUser && (
                  <button
                    className="delete-buttons"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(design.id);
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
                )}
                                
                {/* Чекбокс выбора - ТОЛЬКО при наведении */}
                {(isHovered || isSelected) && belongsToUser && (
                  <div 
                    className="selection-checkbox-container"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItemSelection(design.key || design.id, e);
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
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                )}
              
                <div className="item-content">
                  <PreviewDesign elements={design.data} size={design.size} />
              
                  {loadingItemKey === (design.key || design.id) && 
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

                  <div className="info-row">
                    <span className="info-label">{t('Автор:')}</span>
                    <span className="info-value">{info.owner}</span>
                  </div>

                  </div>
              </div>
            );
          })} 
        </div>)}
      </div>)}
    </div>
    
  );
};