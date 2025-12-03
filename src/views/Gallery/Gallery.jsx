import { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { FaRegHeart, FaHeart } from 'react-icons/fa';

import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';
import GalleryFilters from '../../components/GalleryFilters/GalleryFilters';
import { PreviewDesign } from '../../components/PreviewDesign';

import { useMarketplace } from '../../contexts/contextMarketplace';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { apiGetAllHistories, apiToggleLikeHistory, apiDeleteHistory, apiBulkDeactivateHistories } from '../../services/historiesService';
import { SIZE_PRESETS_BY_MARKETPLACE } from '../../constants/sizePresetsByMarketplace';

export const Gallery = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
  
  // Инициализируем фильтры с возможностью получения search из URL
  const [filters, setFilters] = useState({
    mine: false,
    search: '',
    ownerSearch: '',
    marketplace: '',
    size: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  
  const currentUserId = user?.id || null; 
  
  // Функция для извлечения query-параметров из URL
  const getSearchFromUrl = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('search') || '';
  };
  
  // Инициализация фильтров с учетом URL параметров
  useEffect(() => {
    if (isInitialized) return; // Защита от повторной инициализации
    
    const urlSearch = getSearchFromUrl();
    
    if (urlSearch) {
      // Определяем, является ли поиск по артикулу или по автору
      const isArticleSearch = /^\d{2}/.test(urlSearch);
      
      setFilters(prev => ({
        ...prev,
        search: isArticleSearch ? urlSearch : '',
        ownerSearch: !isArticleSearch ? urlSearch : ''
      }));
      
      // Очищаем URL после использования
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    
    setIsInitialized(true);
  }, [location.search, isInitialized]);

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

  const loadDesignsFromBackend = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        ...currentFilters
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
  }, [currentPage, itemsPerPage, currentUserId]); // Убрали filters из зависимостей

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

  // Основной эффект для загрузки данных
  useEffect(() => {
    if (isInitialized) {
      loadDesignsFromBackend(filters);
    }
  }, [loadDesignsFromBackend, filters, isInitialized]); // Теперь filters правильно обновляется

  // Эффект для обработки изменения currentPage и itemsPerPage
  useEffect(() => {
    if (isInitialized) {
      loadDesignsFromBackend(filters);
    }
  }, [currentPage, itemsPerPage, isInitialized]); // Отдельный эффект для пагинации

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
      
      const result = await apiToggleLikeHistory(designId);
      
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
        loadDesignsFromBackend(filters);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      loadDesignsFromBackend(filters);
    } finally {
      setLikingItem(null);
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
      
      if (newSet.size > 0 && !isSelectionMode) {
        setIsSelectionMode(true);
      } else if (newSet.size === 0 && isSelectionMode) {
        setIsSelectionMode(false);
      }
      
      return newSet;
    });
  };

  // Функция для парсинга и форматирования заголовка
  const parseDesignTitle = (design) => {
    const getArticlesDisplay = () => {
      if (!design.articles) return t('views.galleryUndefined');

      if (design.type === 'collage') {
        // Для коллажа: массив артикулов через пробел
        return Array.isArray(design.articles) 
          ? design.articles.join(' ')
          : design.articles;
      } else {
        if (Array.isArray(design.articles)) {
          return design.articles[0] || t('views.galleryUndefined');
        }
        return design.articles;
      }
    };

    return {
      articles: getArticlesDisplay(),
      marketplace: design.marketplace || t('views.galleryUndefined'),
      marketplaceName: design.marketplace === 'WB' ? 'Wildberries' : 
                       design.marketplace === 'OZ' ? 'Ozon' : 
                       design.marketplace === 'AM' ? 'Amazon' : 
                       design.marketplace || t('views.galleryUndefined'),
      designType: design.type === 'collage' ? t('views.galleryCollage') : t('views.galleryDesign'),
      dimensions: design.size || t('views.galleryUndefined'),
      date: design.createdAt ? new Date(design.createdAt).toLocaleDateString() : t('views.galleryUndefined'),
      time: design.createdAt ? new Date(design.createdAt).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      }) : t('views.galleryUndefined'),
      owner: design.owner?.username || t('views.galleryUndefined')
    };
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Функция для удаления дизайна
  const handleDelete = async (key) => {
    try {
      const design = designs.find(item => item.key === key || item.id === key);

      if (!design) {
        console.error('Design not found:', key);
        return;
      }

      if (!isDesignBelongsToUser(design)) {
        alert('Вы можете удалять только свои дизайны');
        return;
      }

      if (!design.id) {
        alert('Ошибка: дизайн не может быть удален');
        return;
      }

      if (!window.confirm('Вы уверены, что хотите удалить этот дизайн?')) {
        return;
      }

      // Оптимистичное обновление UI
      setDesigns(prev => prev.filter(item => item.id !== design.id));
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });

      await apiDeleteHistory(design.id);
      console.log('Design deleted from backend:', design.id);

    } catch (error) {
      console.error('Error deleting design:', error);

      const design = designs.find(item => item.key === key || item.id === key);
      if (design) {
        setDesigns(prev => [...prev, design].sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }));
      }

      if (error.response?.status === 404) {
        alert('Дизайн не найден или уже удален');
      } else if (error.response?.status === 403) {
        alert('У вас нет прав для удаления этого дизайна');
      } else if (error.response?.status === 401) {
        alert('Необходима авторизация');
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

      selectedItems.forEach(key => {
        const design = designs.find(item => item.key === key || item.id === key);
        if (design && design.id && isDesignBelongsToUser(design)) {
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

      await apiBulkDeactivateHistories(idsToDelete);
      console.log(`Bulk deletion successful: ${idsToDelete.length} items`);

    } catch (error) {
      console.error('Bulk deletion error:', error);

      loadDesignsFromBackend(filters);
      setSelectedItems(new Set());
      setIsSelectionMode(false);

      const errorMsg = error.response?.data?.message || 'Ошибка при удалении дизайнов';
      alert(errorMsg);
    }
  };

  // Функция извлечения данных для построения структуры данных для страницы генерации
  const handleItemClick = async (design) => {
    if (isSelectionMode) {
      toggleItemSelection(design.id, { stopPropagation: () => {} });
      return;
    }

    setLoadingItemKey(design.id);

    try {
      const isCollage = design.type === 'collage';

      if (isCollage) {
        localStorage.setItem('design-collage', JSON.stringify(design.data || []));
        localStorage.setItem('size', JSON.stringify(design.size));
        localStorage.setItem('collage-articles', JSON.stringify(design.articles || []));

        navigate('/template/collage');
        return;
      }
    
      const article = design.articles?.[0];

      if (!article) {
        throw new Error("Не удалось определить артикул дизайна");
      }

      const designInfo = extractDesignInfo(design.type);
      const storageKey = `design-${article}_${designInfo.slideNumber}`;

      sessionStorage.setItem(storageKey, JSON.stringify(design.data || []));
      sessionStorage.setItem('size', JSON.stringify(design.size));
      
      const searchResponse = await fetch(
        `https://new.sharik.ru/api/rest/v1/products_lite/?page_size=1&search=${article}`
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

      const processedMetaResults = processProductsMeta(detailedData);

      processedMetaResults.forEach(item => {
        if (item) {
          sessionStorage.setItem(
            `product-${item.code}`, 
            JSON.stringify(item)
          );
        }
      });

      const route = `/template/${article}_${designInfo.slideNumber}`;
      navigate(route);
    } catch (error) {
      console.error('Design processing error:', error);
    } finally {
      setLoadingItemKey(null);
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
  
      const images = item.images.map(image => 
        `https://new.sharik.ru${image.image}`
      );

      const propertiesList = properties.map(prop => ({ name: prop.name, value: prop.value }));
      const originPropertiesList = originProperties.map(prop => ({ name: prop.name, value: prop.value }));

      const brandProperty = originPropertiesList.find(p => p.name === 'Торговая марка');
      const brand = brandProperty ? brandProperty.value : '';
      const templateType = brand.toLowerCase() === 'gemar' ? 'gemar' : brand.toLowerCase() === 'belbal' ? 'belbal' : 'main';
  
      return {
        code: item.code,
        name: item.name,
        multiplicity: item.multiplicity,
        link: `https://new.sharik.ru/tovary-dly-prazdnika/${item.slug}`,
        images: images,
        properties: propertiesList,
        originProperties: originPropertiesList,
        templateType: templateType,
      };
    }).filter(Boolean);
  };

  const extractDesignInfo = (type) => {
    let slideNumber = 1;

    if (type === 'main') {
      slideNumber = 1;
    } else if (type.startsWith('slide')) {
      const numberPart = type.replace('slide', '');
      const parsedNumber = parseInt(numberPart, 10);
      if (!isNaN(parsedNumber)) {
        slideNumber = parsedNumber;
      }
    }

    return { slideNumber };
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
        loading={loading}
      />
        
      {loading ? (
        <div className="loader-container-gallery">
          <div className="loader"></div>
        </div>
      ) : (
        <div className="items-grid-container" style={{ paddingBottom: '86px' }}>
          {designs.length === 0 ? (
            <div 
              style={{ color: '#333', fontSize: '16px', textAlign: 'center', marginTop: '20px' }}
            >
              <p>{t('views.galleryMessageTitle')}</p>
              <p>{t('views.galleryMessageSubtitle')}</p>
            </div>
          ) : (
            <div className="items-grid">
              {designs.map((design) => {
                const info = parseDesignTitle(design);
                const isSelected = selectedItems.has(design.id);
                const isHovered = hoveredItem === design.id;
                const isLiking = likingItem === design.id;
                const belongsToUser = isDesignBelongsToUser(design);
                
                return (
                  <div 
                    key={design.id} 
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    onMouseEnter={() => setHoveredItem(design.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div 
                      className='item-card'
                      style={{ flexDirection: 'column', width: '100%', maxWidth: '270px', maxHeight: '360px', minWidth: '270px', minHeight: '360px', position: 'relative' }}
                      onClick={(e) => {
                        if (isSelectionMode) {
                          toggleItemSelection(design.id, e);
                        } else {
                          marketplace !== info.marketplace && toggleMarketplace(info.marketplace);
                          handleItemClick(design);
                        }
                      }}
                      role="button"
                      tabIndex={0}
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
                                      
                      {(isHovered || isSelected) && belongsToUser && (
                        <div 
                          className="selection-checkbox-container"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleItemSelection(design.id, e);
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
                    
                        {loadingItemKey === design.id && 
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
                        <span className="info-label">{t('views.galleryLabelOwner')}</span>
                        <span className="info-value">{info.owner}</span>
                      </div>
                    </div>
                  </div>
                );
              })} 
            </div>
          )}
        </div>
      )}
    </div>
  );
};