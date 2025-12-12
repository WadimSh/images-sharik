import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { IoFolderOpen } from 'react-icons/io5';

import { replacePlaceholders } from '../utils/replacePlaceholders';
import { useMarketplace } from '../contexts/contextMarketplace';
import { LanguageContext } from '../contexts/contextLanguage';
import { useGetCode } from '../hooks/useGetCode';
import { PreviewDesign } from './PreviewDesign';
import { CustomSelect } from '../ui/CustomSelect/CustomSelect';
import { productsDB, slidesDB } from '../utils/handleDB';
import { getAvailableStyleVariants } from '../utils/getAvailableStyleVariants';
import { getStyleDisplayName, getStyleIcon } from '../utils/getStylesVariants';
import { Tooltip } from '../ui/Tooltip/Tooltip';
import { ImageSliderModal } from './ImageSliderModal';
import { apiCheckArticleHistories } from '../services/historiesService';

// Добавляем вспомогательную функцию для фильтрации элементов по стилю
const filterElementsByStyle = (elements, styleVariant) => {
  if (!elements || !Array.isArray(elements)) return [];
  
  return elements.filter(element => {
    // Если у элемента нет настроек стилей - показываем его
    if (!element.styles) return true;
    
    // Проверяем настройки видимости для выбранного стиля
    const styleConfig = element.styles[styleVariant];
    
    // Если для этого стиля явно указано visibility: false - скрываем элемент
    if (styleConfig && styleConfig.visibility === false) {
      return false;
    }
    
    // Если стиля нет в настройках или visibility не false - оставляем элемент
    return true;
  });
};

const ItemsGrid = ({ items, onItemsUpdate, templates }) => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { marketplace } = useMarketplace();
  const getCode = useGetCode();
  
  const [baseCodesOrder, setBaseCodesOrder] = useState([]);
  const [productMetas, setProductMetas] = useState({});
  const [designsData, setDesignsData] = useState({});
  const [productImages, setProductImages] = useState(() => {
    // Восстанавливаем из localStorage при инициализации
    const saved = localStorage.getItem('productImagesCache');
    return saved ? JSON.parse(saved) : {};
  });
  const [modalData, setModalData] = useState({
    isOpen: false,
    images: [],
    currentIndex: 0,
    baseCode: ''
  });

  const [galleryCounts, setGalleryCounts] = useState(() => {
    const saved = sessionStorage.getItem('galleryCountsCache');
    return saved ? JSON.parse(saved) : {};
  });
  const abortControllersRef = useRef(new Map());
  const [pendingRequests, setPendingRequests] = useState(new Set());

  useEffect(() => {
    sessionStorage.setItem('galleryCountsCache', JSON.stringify(galleryCounts));
  }, [galleryCounts]);

  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  const updateProductImages = (newImages) => {
    setProductImages(prev => {
      const updated = { ...prev, ...newImages };
      // Сохраняем в localStorage
      localStorage.setItem('productImagesCache', JSON.stringify(updated));
      return updated;
    });
  };

  // Функции для управления модальным окном
  const openImageModal = (baseCode, initialIndex = 0) => {
    const images = productImages[baseCode] || [];
    if (images.length > 0) {
      setModalData({
        isOpen: true,
        images,
        currentIndex: initialIndex,
        baseCode
      });
    }
  };

  const closeImageModal = () => {
    setModalData({
      isOpen: false,
      images: [],
      currentIndex: 0,
      baseCode: ''
    });
  };

  const handleImageIndexChange = (newIndex) => {
    setModalData(prev => ({
      ...prev,
      currentIndex: newIndex
    }));
  };

  // Загрузка метаданных продуктов
  useEffect(() => {
    const loadProductMetas = async () => {
      const metas = {};
      const uniqueBaseCodes = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
      
      await Promise.all(uniqueBaseCodes.map(async (baseCode) => {
        try {
          const product = await productsDB.get(`product-${baseCode}`);
          metas[baseCode] = { 
            ...(product?.data || {}),
            templateType: product?.data?.templateType || 'default',
            styleVariant: product?.data?.styleVariant || 'default' // Добавляем стиль в метаданные
          };
        } catch (error) {
          console.error(`Error loading product meta for ${baseCode}:`, error);
          metas[baseCode] = { 
            templateType: 'default',
            styleVariant: 'default'
          };
        }
      }));

      setProductMetas(metas);
    };

    if (items.length > 0) {
      loadProductMetas();
    }
  }, [items]);

  // Загрузка данных дизайнов с применением стилей
  useEffect(() => {
    const loadDesignsData = async () => {
      const designs = {};
      
      await Promise.all(items.map(async (item) => {
        try {
          const slide = await slidesDB.get(`design-${item}`);
          designs[item] = {
            data: slide?.data || null,
            size: slide?.size || null 
          };
        } catch (error) {
          console.error(`Error loading design for ${item}:`, error);
          designs[item] = {
            data: null,
            size: null
          };
        }
      }));

      setDesignsData(designs);
    };

    if (items.length > 0 && Object.keys(productMetas).length > 0) {
      loadDesignsData();
    }
  }, [items, productMetas]);

  // Функция для получения изображений товара
  const creatLinkImages = async (baseCode) => {
    if (productImages[baseCode]) {
      return;
    }
    const wbCode = getCode(baseCode, "WB");
    if (wbCode !== baseCode) {
      const volLength = wbCode.length === 8 ? 3 : 4;
      const partLength = wbCode.length === 8 ? 5 : 6;
    
      const volPart = wbCode.substring(0, volLength);
      const partPart = wbCode.substring(0, partLength);
    
      // Функция для проверки доступности изображения
      const checkImageExists = async (url) => {
        try {
          const response = await fetch(url, { method: 'HEAD' });
          return response.status === 200;
        } catch (error) {
          return false;
        }
      };
    
      // Находим рабочий номер basket
      let workingBasket = null;

      for (let basketNumber = 1; basketNumber <= 30; basketNumber++) {
        // Форматируем номер корзины с ведущим нулем
        const formattedBasket = basketNumber.toString().padStart(2, '0');
        const testLink = `https://basket-${formattedBasket}.wbbasket.ru/vol${volPart}/part${partPart}/${wbCode}/images/big/1.webp`;
      
        try {
          const exists = await checkImageExists(testLink);
          if (exists) {
            workingBasket = formattedBasket;
            break;
          }
        } catch (error) {
          continue;
        }
      }
    
      if (!workingBasket) {
        updateProductImages({ [baseCode]: [] });
        return;
      }
    
      // Проверяем изображения последовательно, останавливаемся при первой нерабочей ссылке
      const workingImages = [];

      for (let imageNumber = 1; imageNumber <= 10; imageNumber++) {
        const imageLink = `https://basket-${workingBasket}.wbbasket.ru/vol${volPart}/part${partPart}/${wbCode}/images/big/${imageNumber}.webp`;

        try {
          const exists = await checkImageExists(imageLink);
          if (exists) {
            workingImages.push(imageLink);
          } else {
            // Прекращаем проверку при первой нерабочей ссылке
            break;
          }
        } catch (error) {
          // Прекращаем проверку при ошибке
          break;
        }
      }
    
      // Сохраняем изображения в состояние
      updateProductImages({ [baseCode]: workingImages });
    }
  };

  // Функция для проверки наличия дизайнов в галерее
  const checkGalleryDesigns = useCallback(async (baseCode) => {
    // Если запрос уже в процессе для этого baseCode, не делаем новый
    if (pendingRequests.has(baseCode)) {
      return;
    }

    // Проверяем кэш: если данные есть и свежие (< 5 минут), не делаем запрос
    const existingData = galleryCounts[baseCode];
    const CACHE_TIMEOUT = 5 * 60 * 1000; // 5 минут
    const now = Date.now();

    if (existingData && existingData.timestamp && (now - existingData.timestamp < CACHE_TIMEOUT)) {
      return; // Используем кэшированные данные
    }

    // Отменяем предыдущий запрос для этого baseCode
    if (abortControllersRef.current.has(baseCode)) {
      abortControllersRef.current.get(baseCode).abort();
      abortControllersRef.current.delete(baseCode);
    }

    setPendingRequests(prev => new Set(prev).add(baseCode));

    const controller = new AbortController();
    abortControllersRef.current.set(baseCode, controller);

    try {
      const response = await apiCheckArticleHistories(baseCode, controller.signal);

      if (controller.signal.aborted) {
        return;
      }

      if (response && typeof response.hasHistories !== 'undefined') {
        const newData = {
          hasHistories: response.hasHistories,
          count: response.count || 0,
          timestamp: Date.now() // Обновляем timestamp
        };

        setGalleryCounts(prev => ({
          ...prev,
          [baseCode]: newData
        }));
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Request for ${baseCode} was cancelled`);
        return;
      }

      console.error(`Error checking gallery designs for ${baseCode}:`, error);

      if (!controller.signal.aborted) {
        // Сохраняем ошибку в кэш, чтобы не пытаться снова сразу
        setGalleryCounts(prev => ({
          ...prev,
          [baseCode]: {
            hasHistories: false,
            count: 0,
            error: true,
            timestamp: Date.now() // Все равно ставим timestamp
          }
        }));
      }
    } finally {
      setPendingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(baseCode);
        return newSet;
      });
      abortControllersRef.current.delete(baseCode);
    }
  }, [galleryCounts, pendingRequests]);

  // Эффект для проверки дизайнов при загрузке компонента
  useEffect(() => {
    let isActive = true;
    
    const checkAllGalleryDesigns = async () => {
      if (!isActive || items.length === 0) return;
    
      const uniqueBaseCodes = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
    
      // Отменяем запросы для baseCodes, которых больше нет
      const currentBaseCodes = new Set(uniqueBaseCodes);
      
      // Отменяем устаревшие запросы
      for (const [code, controller] of abortControllersRef.current.entries()) {
        if (!currentBaseCodes.has(code)) {
          controller.abort();
          abortControllersRef.current.delete(code);
          
          setPendingRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(code);
            return newSet;
          });
          
          // Удаляем устаревшие данные из состояния
          if (isActive) {
            setGalleryCounts(prev => {
              const newState = { ...prev };
              delete newState[code];
              return newState;
            });
          }
        }
      }
    
      // ЗАПУСКАЕМ ПРОВЕРКИ ТОЛЬКО ДЛЯ ТЕХ, КТО НУЖДАЕТСЯ В ОБНОВЛЕНИИ
      const CACHE_TIMEOUT = 5 * 60 * 1000;
      const now = Date.now();
    
      // Разделяем baseCodes на те, что нужно проверить, и те, что уже в кэше
      const baseCodesToCheck = uniqueBaseCodes.filter(baseCode => {
        const existingData = galleryCounts[baseCode];
        
        // Если данных нет вообще - нужно проверить
        if (!existingData) return true;
        
        // Если есть ошибка, проверяем снова (но не сразу)
        if (existingData.error) {
          // Ждем 30 секунд после ошибки перед повторной проверкой
          return now - existingData.timestamp > 30000;
        }
        
        // Если данные устарели (> 5 минут) - нужно обновить
        return now - existingData.timestamp > CACHE_TIMEOUT;
      });
    
      // ОГРАНИЧИВАЕМ КОЛИЧЕСТВО ПАРАЛЛЕЛЬНЫХ ЗАПРОСОВ
      const MAX_PARALLEL_REQUESTS = 3;
      const chunks = [];
      
      for (let i = 0; i < baseCodesToCheck.length; i += MAX_PARALLEL_REQUESTS) {
        chunks.push(baseCodesToCheck.slice(i, i + MAX_PARALLEL_REQUESTS));
      }
    
      // Запускаем запросы чанками
      for (const chunk of chunks) {
        if (!isActive) break;
        
        const promises = chunk.map(baseCode => 
          checkGalleryDesigns(baseCode).catch(() => {})
        );
        
        await Promise.allSettled(promises);
      }
    };
  
    // ДОБАВЛЯЕМ НЕБОЛЬШУЮ ЗАДЕРЖКУ ПЕРЕД ПРОВЕРКОЙ, ЧТОБЫ НЕ БЛОКИРОВАТЬ ПЕРВОНАЧАЛЬНУЮ ЗАГРУЗКУ
    const timeoutId = setTimeout(() => {
      checkAllGalleryDesigns();
    }, 500); // 500ms задержка
  
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [items]);

  // Добавляем очистку запросов при изменении items
  useEffect(() => {
    return () => {
      // При размонтировании или изменении items отменяем все запросы
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  // Функция для обработки клика по кнопке галереи
  const handleGalleryButtonClick = useCallback((baseCode) => {
    // ПРОВЕРЯЕМ И ОБНОВЛЯЕМ ДАННЫЕ СРАЗУ, БЕЗ ОЖИДАНИЯ
    const galleryInfo = galleryCounts[baseCode];
    
    // Если данные уже есть, используем их
    if (galleryInfo?.hasHistories) {
      // Навигация без задержки
      navigate(`/gallery?search=${baseCode}`);
    } else {
      // Если данных нет, запускаем проверку и навигацию параллельно
      checkGalleryDesigns(baseCode)
        .catch(() => {}) // Игнорируем ошибки для навигации
        .finally(() => {
          // Переходим даже если запрос упал
          navigate(`/gallery?search=${baseCode}`);
        });
    }
  }, [galleryCounts, navigate, checkGalleryDesigns]);

  // Загрузка изображений при изменении baseCodes
  useEffect(() => {
    const loadImagesForProducts = async () => {
      const uniqueBaseCodes = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
      
      for (const baseCode of uniqueBaseCodes) {
        await creatLinkImages(baseCode);
      }
    };

    if (items.length > 0) {
      loadImagesForProducts();
    }
  }, [items]);

  // Очистка устаревших изображений при изменении items
  useEffect(() => {
    const currentBaseCodes = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
    
    // Находим baseCodes, которые больше не нужны
    const codesToRemove = Object.keys(productImages).filter(
      code => !currentBaseCodes.includes(code)
    );
    
    if (codesToRemove.length > 0) {
      const updatedImages = { ...productImages };
      codesToRemove.forEach(code => delete updatedImages[code]);
      updateProductImages(updatedImages);
    }
  }, [items]);

  // Функция для получения отфильтрованных элементов для превью
  const getFilteredDesignForPreview = (designData, baseCode) => {
    if (!designData || !designData.data || !Array.isArray(designData)) return [];
    
    const productMeta = productMetas[baseCode] || {};
    const currentStyle = productMeta.styleVariant || 'default';
    
    return {
      elements: filterElementsByStyle(designData.data, currentStyle),
      size: designData.size // Просто передаем существующий размер
    };
  };

  // Инициализация и обновление порядка базовых кодов
  useEffect(() => {
    const initialOrder = [...new Set(items.map(item => item.split('_').slice(0, -1).join('_')))];
    setBaseCodesOrder(initialOrder);
  }, [items]);

  useEffect(() => {
    const newCodes = items.map(item => item.split('_').slice(0, -1).join('_'));
    const uniqueNewCodes = [...new Set(newCodes)];
    
    setBaseCodesOrder(prev => {
      const preservedOrder = prev.filter(code => uniqueNewCodes.includes(code));
      const newGroups = uniqueNewCodes.filter(code => !prev.includes(code));
      return [...preservedOrder, ...newGroups];
    });
  }, [items]);

  // Функция для создания нового дизайна с применением стиля
const handleCreateNewDesign = async (baseCode) => {
  
  try {
    const existingNumbers = items
      .filter(item => item.startsWith(`${baseCode}_`))
      .map(item => parseInt(item.split('_')[1]))
      .filter(num => !isNaN(num));
    
    const newNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
    const newDesignKey = `${baseCode}_${newNumber}`;
    
    const product = await productsDB.get(`product-${baseCode}`);
    const productMeta = product?.data || {};
    
    // Получаем текущий стиль продукта
    const currentStyle = productMeta.styleVariant || 'default';
    
    const templateKey = productMeta.templateType || 'default';
    let selectedTemplate = templates.default;
  
    if (templateKey === 'belbal' || templateKey === 'gemar' || templateKey === 'petard' || templateKey === 'winter') {
      const templateArray = templates[templateKey] || [];
      const imageIndex = newNumber - 1;
      const templateIndex = Math.min(imageIndex, templateArray.length - 1);
      selectedTemplate = templateArray[templateIndex] || [];
    } else if (templates[templateKey]) {
      selectedTemplate = templates[templateKey];
    }
  
    const imageIndex = newNumber - 1;
    const image = productMeta.images?.[imageIndex] || productMeta.images?.[0] || '';
  
    const templateData = {
      code: newDesignKey,
      image: image,
      category: productMeta.properties?.find(p => p.name === 'Тип латексных шаров')?.value || '',
      title: productMeta.properties?.find(p => p.name === 'Событие')?.value || '',
      multiplicity: productMeta.multiplicity,
      size: productMeta.properties?.find(p => p.name === 'Размер')?.value?.split("/")[0]?.trim() || '',
      brand: productMeta.originProperties?.find(p => p.name === 'Торговая марка')?.value || '',
      imageIndex: imageIndex
    };
  
    // Функция для фильтрации элементов по видимости в стиле
    const filterElementsByVisibility = (elements, variant) => {
      if (!elements || !Array.isArray(elements)) return [];
      
      return elements.filter(element => {
        if (!element.styles) return true;
        
        const styleConfig = element.styles[variant];
        if (styleConfig && styleConfig.visibility === false) {
          return false;
        }
        return true;
      });
    };

    // Функция для применения стилей к элементам (только изображение)
    const applyElementStyle = (element, variant) => {
      if (!element?.styles) return element;
      
      const styleData = element.styles[variant];
      if (!styleData) return element;
      
      // Создаем копию элемента и применяем ТОЛЬКО нужные свойства
      const result = { ...element };
      
      // Применяем только image из стиля, остальные свойства игнорируем
      if (styleData.image !== undefined) {
        result.image = styleData.image;
      }
      
      return result;
    };

    // Сначала фильтруем элементы по видимости для текущего стиля
    let filteredTemplate = filterElementsByVisibility(selectedTemplate, currentStyle);
    
    // Затем применяем стили к оставшимся элементам
    filteredTemplate = filteredTemplate.map(element => 
      applyElementStyle(element, currentStyle)
    );

    // Применяем стиль перед сохранением
    const newDesign = replacePlaceholders(filteredTemplate, templateData, currentStyle);
    
    await slidesDB.add({
      code: `design-${newDesignKey}`,
      data: newDesign
    });
  
    onItemsUpdate([...items, newDesignKey]);
    
    // Обновляем локальное состояние дизайнов
    setDesignsData(prev => ({
      ...prev,
      [newDesignKey]: {
        data: newDesign,
        size: undefined // Не устанавливаем размер
      }
    }));
    
  } catch (error) {
    console.error('Error creating new design:', error);
  }
};

  // Обработчик изменения шаблона с валидацией и сбросом стиля
const handleTemplateChange = async (baseCode, templateKey) => {
  try {
    const product = await productsDB.get(`product-${baseCode}`);
    const currentMeta = product?.data || {};
    
    // Получаем доступные стили для нового шаблона
    const newTemplate = templates[templateKey] || [];
    const availableStyles = getAvailableStyleVariants(newTemplate);
    
    // Проверяем, поддерживается ли текущий стиль в новом шаблоне
    const currentStyle = currentMeta.styleVariant || 'default';
    const isStyleSupported = availableStyles.includes(currentStyle);
    
    // Если текущий стиль не поддерживается, сбрасываем на дефолтный или первый доступный
    let newStyleVariant = currentStyle;
    if (!isStyleSupported) {
      if (availableStyles.includes('default')) {
        newStyleVariant = 'default';
      } else if (availableStyles.length > 0) {
        newStyleVariant = availableStyles[0];
      } else {
        newStyleVariant = 'default';
      }
    }
    
    const updatedMeta = {
      ...currentMeta,
      templateType: templateKey,
      styleVariant: newStyleVariant // Обновляем стиль если нужно
    };
    
    await productsDB.update(`product-${baseCode}`, { data: updatedMeta });

    // Обновляем локальное состояние метаданных
    setProductMetas(prev => ({
      ...prev,
      [baseCode]: {
        ...prev[baseCode],
        templateType: templateKey,
        styleVariant: newStyleVariant
      }
    }));

    const updatePromises = items.map(async (item) => {
      if (item.startsWith(`${baseCode}_`)) {
        const slide = await slidesDB.get(`design-${item}`);
        const currentDesign = slide?.data || [];
        const currentSize = slide?.size; // Получаем текущий размер, но не меняем его

        const validImages = currentDesign.filter(el => 
          el.type === 'image' && el.image?.startsWith('https://')
        );

        const currentImage = validImages.length > 0 
          ? validImages[validImages.length - 1].image 
          : updatedMeta.images?.[0];

        const parts = item.split('_');
        const imageIndex = parseInt(parts[parts.length - 1]) - 1;

        const itemData = {
          ...updatedMeta,
          code: item,
          image: currentImage,
          category: getPropertyValue(updatedMeta, 'Тип латексных шаров'),
          title: getPropertyValue(updatedMeta, 'Событие'),
          multiplicity: updatedMeta.multiplicity,
          size: getPropertyValue(updatedMeta, 'Размер').split("/")[0]?.trim() || '',
          brand: getOriginPropertyValue(updatedMeta, 'Торговая марка'),
          imageIndex: imageIndex
        };

        let template;
        if (Array.isArray(templates[templateKey]) && templates[templateKey].every(item => Array.isArray(item))) {
          const templateArray = templates[templateKey];
          const templateIndex = Math.min(imageIndex, templateArray.length - 1);
          template = templateArray[templateIndex];
        } else {
          template = templates[templateKey] || templates['main'];
        }

        // Функция для фильтрации элементов по видимости в стиле
        const filterElementsByVisibility = (elements, variant) => {
          return elements.filter(element => {
            if (element.styles && element.styles[variant]) {
              const styleConfig = element.styles[variant];
              if (styleConfig.visibility === false) {
                return false;
              }
              return true;
            }
            return true;
          });
        };

        // Функция для применения стилей к элементам (только изображение)
        const applyElementStyle = (element, variant) => {
          if (!element?.styles) return element;
          
          const styleData = element.styles[variant];
          if (!styleData) return element;
          
          const result = { ...element };
          
          if (styleData.image !== undefined) {
            result.image = styleData.image;
          }
          
          return result;
        };

        // Фильтруем элементы по видимости для нового стиля
        let filteredTemplate = filterElementsByVisibility(template, newStyleVariant);
        
        // Применяем стили к оставшимся элементам
        filteredTemplate = filteredTemplate.map(element => 
          applyElementStyle(element, newStyleVariant)
        );

        const newDesign = replacePlaceholders(filteredTemplate, itemData, newStyleVariant);

        await slidesDB.update(`design-${item}`, { data: newDesign, size: '900x1200' });

        return { [item]: {
            data: newDesign,
            size: '900x1200' // Сохраняем существующий размер
          } 
        };
      }
      return null;
    });

    const updatedDesignsArray = await Promise.all(updatePromises);

    // Обновляем локальное состояние дизайнов
    const updatedDesigns = updatedDesignsArray.reduce((acc, val) => {
      if (val) Object.assign(acc, val);
      return acc;
    }, {});

    setDesignsData(prev => ({
      ...prev,
      ...updatedDesigns
    }));

  } catch (error) {
    console.error('Error updating template:', error);
  }
};

  // Применение стиля ко всей группе элементов
const applyStyleToGroup = async (baseCode, styleVariant) => {
  try {
    const product = await productsDB.get(`product-${baseCode}`);
    const updatedMeta = {
      ...(product?.data || {}),
      styleVariant: styleVariant
    };

    await productsDB.update(`product-${baseCode}`, { data: updatedMeta });

    setProductMetas(prev => ({
      ...prev,
      [baseCode]: {
        ...prev[baseCode],
        styleVariant: styleVariant
      }
    }));

    // Обновляем все связанные дизайны
    const updatePromises = items.map(async (item) => {
      if (item.startsWith(`${baseCode}_`)) {
        const slide = await slidesDB.get(`design-${item}`);
        const currentDesign = slide?.data || [];
        const currentSize = slide?.size; // Получаем текущий размер, но не меняем его

        const validImages = currentDesign.filter(el =>
          el.type === 'image' && el.image?.startsWith('https://')
        );

        const currentImage = validImages.length > 0
          ? validImages[validImages.length - 1].image
          : updatedMeta.images?.[0];

        const parts = item.split('_');
        const imageIndex = parseInt(parts[parts.length - 1]) - 1;

        const itemData = {
          ...updatedMeta,
          code: item,
          image: currentImage,
          category: getPropertyValue(updatedMeta, 'Тип латексных шаров'),
          title: getPropertyValue(updatedMeta, 'Событие'),
          multiplicity: updatedMeta.multiplicity,
          size: getPropertyValue(updatedMeta, 'Размер').split("/")[0]?.trim() || '',
          brand: getOriginPropertyValue(updatedMeta, 'Торговая марка'),
          imageIndex: imageIndex
        };

        const templateKey = updatedMeta.templateType || 'default';
        let template = templates[templateKey];
        
        if (Array.isArray(templates[templateKey]) && templates[templateKey].every(item => Array.isArray(item))) {
          const templateIndex = Math.min(imageIndex, template.length - 1);
          template = template[templateIndex];
        }

        // Функция для фильтрации элементов по видимости в стиле
        const filterElementsByVisibility = (elements, variant) => {
          if (!elements || !Array.isArray(elements)) return [];

          return elements.filter(element => {
            if (!element.styles) return true;

            const styleConfig = element.styles[variant];
            if (styleConfig && styleConfig.visibility === false) {
              return false;
            }
            return true;
          });
        };

        // Функция для применения стилей к элементам (только изображение)
        const applyElementStyle = (element, variant) => {
          if (!element?.styles) return element;
          
          const styleData = element.styles[variant];
          if (!styleData) return element;
          
          // Создаем копию элемента и применяем ТОЛЬКО нужные свойства
          const result = { ...element };
          
          // Применяем только image из стиля, остальные свойства игнорируем
          if (styleData.image !== undefined) {
            result.image = styleData.image;
          }
          
          return result;
        };

        // Сначала фильтруем элементы по видимости
        let filteredTemplate = filterElementsByVisibility(template, styleVariant);
        
        // Затем применяем стили к оставшимся элементам
        filteredTemplate = filteredTemplate.map(element => 
          applyElementStyle(element, styleVariant)
        );

        const newDesign = replacePlaceholders(filteredTemplate, itemData, styleVariant);

        await slidesDB.update(`design-${item}`, { data: newDesign, size: '900x1200' });

        return { [item]: {
            data: newDesign,
            size: '900x1200' // Сохраняем существующий размер
          }
        };
      }
      return null;
    });

    const updatedDesignsArray = await Promise.all(updatePromises);

    // Собираем обновленные дизайны в объект
    const updatedDesigns = updatedDesignsArray.reduce((acc, val) => {
      if (val) Object.assign(acc, val);
      return acc;
    }, {});

    // Обновляем локальное состояние дизайнов
    setDesignsData(prev => ({
      ...prev,
      ...updatedDesigns
    }));

  } catch (error) {
    console.error('Error applying style to group:', error);
  }
};
  

  const getUniqueBaseCodes = () => {
    return baseCodesOrder.filter(baseCode => 
      items.some(item => item.startsWith(`${baseCode}_`))
    );
  };

  const uniqueBaseCodes = getUniqueBaseCodes();
  
  const handleItemClick = async (itemId) => {
    try {
      // Проверяем наличие пользователей
      const user = localStorage.getItem('user');
            
      if (!user) {
        navigate('/sign-in');
        return;
      }
      
      // Если проверки пройдены - продолжаем исходную логику
      const baseCode = itemId.split('_').slice(0, -1).join('_');

      const designData = await slidesDB.get(`design-${itemId}`);
      const productData = await productsDB.get(`product-${baseCode}`);
      
      if (designData?.data) {
        sessionStorage.setItem(`design-${itemId}`, JSON.stringify(designData.data));
      }
      
      if (designData?.size) {
        sessionStorage.setItem('size', JSON.stringify(designData.size))
      }
      
      if (productData?.data) {
        sessionStorage.setItem(`product-${baseCode}`, JSON.stringify(productData.data));
      }

      navigate(`/template/${itemId}`);
      
    } catch (error) {
      console.error('Error checking user authentication:', error);
      // В случае ошибки тоже перенаправляем на регистрацию для безопасности
      navigate('/sign-in');
    }
  };

  // Функция удаления элемента
  const handleDeleteItem = async (itemId) => {
    try {
      // Удаляем из базы данных
      await slidesDB.delete(`design-${itemId}`);
      
      // Обновляем список элементов
      const updatedItems = items.filter(item => item !== itemId);
      onItemsUpdate(updatedItems);

      // Проверяем нужно ли удалять метаданные товара
      const productCode = itemId.split('_').slice(0, -1).join('_');
      const remaining = items.filter(item => item.startsWith(`${productCode}_`));
      
      if (remaining.length === 1) {
        await productsDB.delete(`product-${productCode}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Вспомогательные функции для свойств
  const getPropertyValue = (productMeta, propName) => 
    productMeta.properties?.find(p => p.name === propName)?.value || '';
  
  const getOriginPropertyValue = (productMeta, propName) => 
    productMeta.originProperties?.find(p => p.name === propName)?.value || '';

    
  // Объект перевода названий шаблонов
  const templateOptions = {
    belbal: t('grid.belbal'),
    gemar: t('grid.gemar'),
    petard: t('grid.petard'),
    winter: t('grid.winter'),
    halloween: t('category.halloween'),
    main: t('grid.main'),
    default: t('grid.default'),
    // bubble: t('grid.bubble'),
    // banners: t('grid.banners'),
    // barAccessories: t('grid.barAccessories'),
    // bijouterie: t('grid.bijouterie'),
    // boa: t('grid.boa'),
    // packagingPaper: t('grid.packagingPaper'),
    // hawaii: t('grid.hawaii'),
    // gasEquipment: t('grid.gasEquipment'),
    // tie: t('grid.tie'),
    // heliumCylinders: t('grid.heliumCylinders'),
    // garlands: t('grid.garlands'),
    // garlandsLetters: t('grid.garlandsLetters'),
    // garlandsVertical: t('grid.garlandsVertical'),
    // garlandsPennants: t('grid.garlandsPennants'),
    // hats: t('grid.hats'),
    // horn: t('grid.horn'),
    // makeup: t('grid.makeup'),
    // weightsForBalloons: t('grid.weightsForBalloons'),
    // scenery: t('grid.scenery'),
    // pendantDecorations: t('grid.pendantDecorations'),
    // holders: t('grid.holders'),
    // displays: t('grid.displays'),
    // pipe: t('grid.pipe'),
    // coloredSmoke: t('grid.coloredSmoke'),
    // icon: t('grid.icon'),
    // game: t('grid.game'),
    // toys: t('grid.toys'),
    // carnivalCostume: t('grid.carnivalCostume'),
    // clownNose: t('grid.clownNose'),
    // balloonCompressor: t('grid.balloonCompressor'),
    // confetti: t('grid.confetti'),
    // paintForBalls: t('grid.paintForBalls'),
    // ribbon: t('grid.ribbon'),
    // ribbonForBalloons: t('grid.ribbonForBalloons'),
    // masks: t('grid.masks'),
    // medal: t('grid.medal'),
    // tinsel: t('grid.tinsel'),
    // soapBubbles: t('grid.soapBubbles'),
    // packagedKits: t('grid.packagedKits'),
    // inflatableToy: t('grid.inflatableToy'),
    // stickers: t('grid.stickers'),
    // balloonPump: t('grid.balloonPump'),
    // sunglasses: t('grid.sunglasses'),
    // package: t('grid.package'),
    // wig: t('grid.wig'),
    // pinata: t('grid.pinata'),
    // pyrotechnics: t('grid.pyrotechnics'),
    // packagingFilm: t('grid.packagingFilm'),
    // hiFloat: t('grid.hiFloat'),
    // holidayAccessories: t('grid.holidayAccessories'),
    // advertisingBalls: t('grid.advertisingBalls'),
    // napkins: t('grid.napkins'),
    // luminousSouvenirs: t('grid.luminousSouvenirs'),
    // candlesForCake: t('grid.candlesForCake'),
    // candlesDigit: t('grid.candlesDigit'),
    // serpentine: t('grid.serpentine'),
    // net: t('grid.net'),
    // tablecloth: t('grid.tablecloth'),
    // sweetTable: t('grid.sweetTable'),
    // specialEffects: t('grid.specialEffects'),
    // spirals: t('grid.spirals'),
    // spray: t('grid.spray'),
    // glasses: t('grid.glasses'),
    // cutlery: t('grid.cutlery'),
    // dishes: t('grid.dishes'),
    // tasselFringe: t('grid.tasselFringe'),
    // headOrnaments: t('grid.headOrnaments'),
    // packing: t('grid.packing'),
    // educationalMaterials: t('grid.educationalMaterials'),
    // fant: t('grid.fant'),
    // cakeFigurine: t('grid.cakeFigurine'),
    // photoProps: t('grid.photoProps'),
    // latexBalls: t('grid.latexBalls'),
    // foilBalls: t('grid.foilBalls'),
    // blowouts: t('grid.blowouts'),
  };

  const GalleryButtonMinimal = ({ baseCode }) => {
    const galleryInfo = galleryCounts[baseCode];
    
    if (!galleryInfo || !galleryInfo.hasHistories) {
      return null;
    }

    const isPending = pendingRequests.has(baseCode);
    const rangeText = t('grid.tooltipMinimal').replace('{count}', galleryInfo.count);

    return (
      <div style={{ marginLeft: 'auto' }}>
        <Tooltip
          content={rangeText}
          position="bottom"
        >
          <button
            className="gallery-button"
            onClick={() => !isPending && handleGalleryButtonClick(baseCode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 12px',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
          >
            <IoFolderOpen size={16} />
            <span className="span" style={{ paddingTop: "2px" }}>{t('grid.buttonMinimal')}</span> 
            <span className="span" style={{ paddingTop: "2px" }}>{galleryInfo.count}</span>
          </button>
        </Tooltip>
      </div>
    );
  };

  // Вспомогательная функция для рендеринга контролов выбора шаблона
  const renderTemplateControls = (baseCode, currentTemplate) => {
    const wbCode = getCode(baseCode, "WB");
    const ozCode = getCode(baseCode, "OZ");
    
    const template = templates[currentTemplate] || [];
    const availableStyles = getAvailableStyleVariants(template);
    const currentStyle = productMetas[baseCode]?.styleVariant || 'default';

    // Определяем, какой стиль должен быть активным
    const getActiveStyleId = () => {
      if (availableStyles.includes(currentStyle)) {
        return currentStyle;
      }
      if (availableStyles.includes('default')) {
        return 'default';
      }
      return availableStyles.length > 0 ? availableStyles[0] : 'default';
    };
    
    const activeStyleId = getActiveStyleId();
    const galleryInfo = galleryCounts[baseCode];

    return (
      <div className={`template-selector ${marketplace}`} >
        <div className="template-selector-controls">
          <div style={{ width: '240px' }}>
            <CustomSelect 
              options={templateOptions}
              value={currentTemplate}
              onChange={(value) => handleTemplateChange(baseCode, value)}
              dropdownMaxHeight="300px"
            />
          </div>
          

          {availableStyles.length > 1 && (
            <div className="style-buttons">
              {availableStyles.map(styleId => (
                  <Tooltip 
                    key={styleId}
                    content={t(getStyleDisplayName(styleId))}
                    position="bottom"
                  >
                    <button
                      className={`style-button ${activeStyleId === styleId ? 'active' : ''}`}
                      onClick={() => applyStyleToGroup(baseCode, styleId)}
                    >
                      {getStyleIcon(styleId)}
                    </button>
                  </Tooltip>
                )
              )}
            </div>
          )}
        </div>
        
        {galleryInfo?.hasHistories && (
          <GalleryButtonMinimal baseCode={baseCode} />
        )}
        
        <div className="template-selector-controls">
          {(wbCode !== baseCode || ozCode !== baseCode) ? <span>{t('grid.linkTo')}</span> : <span>{t('grid.linkNo')}</span>}
          {wbCode !== baseCode && <a 
            className="template-selector-control"
            href={`https://www.wildberries.ru/catalog/${wbCode}/detail.aspx`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="511" height="511" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </a>}
          {ozCode !== baseCode && <a 
            className="template-selector-control"
            href={`https://www.ozon.ru/product/${ozCode}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="511" height="511" viewBox="0 0 511 511" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          </a>}
        </div>
      </div>
    );
  };

  // Функция для рендеринга превью изображений
  const renderImagePreviews = (baseCode) => {
    const images = productImages[baseCode] || [];
    
    if (images.length === 0) {
      return null;
    }

    return (
      <div className="product-images-preview">
        {images.map((imageUrl, index) => (
          <div 
            key={index} 
            className="product-image-item"
            onClick={() => openImageModal(baseCode, index)}
          >
            <img 
              src={imageUrl} 
              alt={`Товар ${baseCode} - ${index + 1}`}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="items-grid-container">
      {modalData.isOpen && (
        <ImageSliderModal
          baseCode={modalData.baseCode}
          images={modalData.images}
          currentIndex={modalData.currentIndex}
          onClose={closeImageModal}
          onIndexChange={handleImageIndexChange}
        />
      )}
      {uniqueBaseCodes.map((baseCode) => {
        const productMeta = productMetas[baseCode] || { 
          templateType: 'default'
        };
        const currentTemplate = productMeta.templateType || 'default';
        const relatedItems = items.filter(item => item.startsWith(baseCode + '_'));
        
        return (
          <div key={baseCode}>
            <div className="product-header">
              <h2 className="item-title">
                {baseCode}
                {productMeta.name && <span className="item-subtitle">  {productMeta.name}</span>}
              </h2>

              {marketplace === 'WB' && (renderImagePreviews(baseCode))}
            </div>

            {renderTemplateControls(baseCode, currentTemplate)}

            <div className="items-grid">
              {relatedItems.map((item) => {
                const designData = designsData[item];
                const filteredDesign = getFilteredDesignForPreview(designData, baseCode);
                
                return (
                  <div 
                    key={item} 
                    className="item-card"
                    style={{ flexDirection: 'column', width: '100%', maxWidth: '270px', maxHeight: '360px', minWidth: '270px', minHeight: '360px' }}
                    onClick={() => handleItemClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <button
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(item);
                      }}
                    >
                      ×
                    </button>
                    
                    <div className="item-content">
                      {filteredDesign && filteredDesign.length > 0 ? (
                        <PreviewDesign elements={filteredDesign.elements} size={filteredDesign.size} />
                      ) : designData ? (
                        <PreviewDesign elements={designData.data} size={designData.size} />
                      ) : (
                        <div className="loader-container">
                          <div className="loader"></div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div
                className="item-card new-design-card"
                style={{ width: '100%', maxWidth: '270px', maxHeight: '360px', minWidth: '270px', minHeight: '360px' }}
                onClick={() => handleCreateNewDesign(baseCode)}
                role="button"
                tabIndex={0}
              >
                <div className="item-content new-design-content">
                  <div className="plus-sign">+</div>
                  <div className="create-text">{t('grid.placeholder')}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ItemsGrid;