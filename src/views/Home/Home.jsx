import { useState, useCallback, useEffect, useContext, useRef } from 'react';

import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";
import { SelectionImagesModal } from '../../components/SelectionImagesModal';
import { UpdateModal } from '../../components/UpdateModal/UpdateModal';
import { useAuth } from '../../contexts/AuthContext';

import { replacePlaceholders } from '../../utils/replacePlaceholders';
import { productsDB, slidesDB } from '../../utils/handleDB';
import { LanguageContext } from '../../contexts/contextLanguage';
import { apiGetAllLayouts } from '../../services/layoutsService';
import { apiGetImagesExcludingMarketplaces } from '../../services/mediaService';

export const Home = () => {
  const savedData = sessionStorage.getItem('searchData');
  const initialData = savedData 
    ? JSON.parse(savedData)
    : { query: '', articles: [] };

  const { t } = useContext(LanguageContext);
  const { isAuthenticated, isAdmin, isUploader, isPhotographer } = useAuth();
  const [validArticles, setValidArticles] = useState(initialData.articles);
  const [searchQuery, setSearchQuery] = useState(initialData.query);
  const [isSearchActive, setIsSearchActive] = useState(initialData.articles.length > 0);
  
  const [templates, setTemplates] = useState({
    men_day: [],
    winter: [],
    halloween: [],
    petard: [],
    belbal: [],
    gemar: [],
    main: [],
    default: [],
  });
  const templatesCache = useRef({
    data: null,
    loaded: false,
    timestamp: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [isToggled, setIsToggled] = useState(false);

  // модалка информирования об обновлении
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const UPDATE_CONFIG = {
    admin: {
      version: '2026-03-04-admin',
      file: '/upload/changelog-user.md',
      headerImage: 'none',
      key: 'update_modal_shown_admin'
    },
    uploader: {
      version: '2026-03-04-uploader',
      file: '/upload/changelog-user.md',
      headerImage: 'none',
      key: 'update_modal_shown_uploader'
    },
    user: {
      version: '2026-03-04-user',
      file: '/upload/changelog-user.md',
      headerImage: 'none',
      key: 'update_modal_shown_user'
    }
  };

  const getConfig = () => {
    if (isAdmin) return UPDATE_CONFIG.admin;
    if (isUploader) return UPDATE_CONFIG.uploader;
    return UPDATE_CONFIG.user;
  };

  const checkForUpdates = () => {
    const config = getConfig();
    const lastShownVersion = localStorage.getItem(config.key);
    return lastShownVersion !== config.version;
  };
  
  useEffect(() => {
    const shouldShow = checkForUpdates();
    
    if (shouldShow && isAuthenticated) {
      const timer = setTimeout(() => {
        setShowUpdateModal(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isAdmin, isUploader]);

  const loadTemplates = useCallback(async () => {
    if (templatesCache.current.loaded && templatesCache.current.data) {
      setTemplates(templatesCache.current.data);
      return templatesCache.current.data;
    }
    
    try {
      const templatesArray = await apiGetAllLayouts();
      
      const transformed = {};
      templatesArray.forEach(template => {
        const key = template.name.toLowerCase();
        if (key in templates) { 
          transformed[key] = Array.isArray(template.data) ? template.data : [];
        }
      });
      
      const newTemplates = { ...templates, ...transformed };
      
      templatesCache.current = {
        data: newTemplates,
        loaded: true,
        timestamp: Date.now()
      };
      
      setTemplates(newTemplates);
      return newTemplates;
      
    } catch (error) {
      console.error('Error loading templates:', error);
      return templates;
    } 
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);
  
  useEffect(() => {
    // Только для синхронизации при обновлениях из других вкладок
    const handleStorage = (e) => {
      if (e.key === 'searchData') {
        const newData = e.newValue ? JSON.parse(e.newValue) : null;
        if (newData) {
          setSearchQuery(newData.query);
          setValidArticles(newData.articles);
          setIsSearchActive(newData.articles.length > 0);
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Сохранение данных при изменении
  useEffect(() => {
    if (searchQuery || validArticles.length > 0) {
      sessionStorage.setItem('searchData', JSON.stringify({
        query: searchQuery,
        articles: validArticles
      }));
    } else {
      sessionStorage.removeItem('searchData');
    }
  }, [searchQuery, validArticles]);
  
const processProductsMeta = (productsData, externalImagesMap) => {
  if (!Array.isArray(productsData)) {
    console.error('Invalid data for processing:', productsData);
    return [];
  }

  return productsData.map(item => {
    if (!item || !item.images || !Array.isArray(item.images)) {
      console.warn('Invalid product item:', item);
      return null;
    }

    const properties = item.properties || [];
    const originProperties = item.origin_properties || [];

    // Формируем массив ссылок на базовые изображения
    const baseImages = item.images.map(image => 
      `https://new.sharik.ru${image.image}`
    );

    // Получаем внешние изображения из Map
    const externalImages = externalImagesMap.get(item.code) || [];

    // Объединяем все изображения
    const allImages = [...baseImages, ...externalImages];

    const propertiesList = properties.map(prop => ({ name: prop.name, value: prop.value }));
    const originPropertiesList = originProperties.map(prop => ({ name: prop.name, value: prop.value }));

    // Добавляем определение типа шаблона
    const brandProperty = originPropertiesList.find(p => p.name === 'Торговая марка');
    const brand = brandProperty ? brandProperty.value : '';
    
    const properProperty = propertiesList.find(p => p.name === 'Товарная номенклатура');
    const proper = properProperty ? properProperty.value : '';

    const templateType = brand.toLowerCase() === 'gemar' ? 'gemar' : 
                        brand.toLowerCase() === 'belbal' ? 'belbal' : 
                        proper.toLowerCase() === 'хлопушка' ? 'petard' : 'main';

    return {
      code: item.code,
      name: item.name,
      multiplicity: item.multiplicity,
      link: `https://new.sharik.ru/tovary-dly-prazdnika/${item.slug}`,
      images: allImages, // Теперь включает и базовые, и внешние изображения
      properties: propertiesList,
      originProperties: originPropertiesList,
      styleVariant: 'default',
      templateType: templateType,
    };
  }).filter(item => item !== null); // Фильтруем null элементы
};

  // Выносим функцию обработки данных в отдельную утилиту
const processProductsData = (detailedData, externalImagesMap = new Map()) => {
  if (!Array.isArray(detailedData)) {
    console.error('Invalid data for processing:', detailedData);
    return [];
  }

  return detailedData.flatMap(item => {
    if (!item || !item.images || !Array.isArray(item.images)) {
      console.warn('Invalid product item:', item);
      return [];
    }

    const properties = item.properties || [];
    const originProperties = item.origin_properties || [];

    const getPropertyValue = (propName) => 
      properties.find(p => p.name === propName)?.value || '';

    const getOriginPropertyValue = (propName) => 
      originProperties.find(p => p.name === propName)?.value || '';

    // Базовые результаты из оригинальных изображений
    const baseResults = item.images.map((image, imgIndex) => ({
      code: `${item.code}_${imgIndex + 1}`,
      multiplicity: item.multiplicity,
      size: getPropertyValue('Размер').split("/")[0]?.trim() || '',
      title: getPropertyValue('Событие'),
      image: `https://new.sharik.ru${image.image}`,
      category: getPropertyValue('Тип латексных шаров'),
      brand: getOriginPropertyValue('Торговая марка'),
      properties: getPropertyValue('Товарная номенклатура'),
      viewMaterial: getPropertyValue('Вид материала'),
      groupMaterial: getPropertyValue('Группа материала'),
    }));

    // Получаем внешние изображения из Map (если есть)
    const externalImages = externalImagesMap.get(item.code) || [];
    
    const externalResults = externalImages.map((externalImage, extIndex) => ({
      code: `${item.code}_${item.images.length + extIndex + 1}`,
      multiplicity: item.multiplicity,
      size: getPropertyValue('Размер').split("/")[0]?.trim() || '',
      title: getPropertyValue('Событие'),
      image: externalImage,
      category: getPropertyValue('Тип латексных шаров'),
      brand: getOriginPropertyValue('Торговая марка'),
      properties: getPropertyValue('Товарная номенклатура'),
      viewMaterial: getPropertyValue('Вид материала'),
      groupMaterial: getPropertyValue('Группа материала'),
    }));

    return [...baseResults, ...externalResults];
  });
};

// Функция для создания структуры данных из внешних изображений
const processExternalImagesData = (articlesFromQuery, externalImagesMap) => {
  const results = [];
  
  articlesFromQuery.forEach(code => {
    const images = externalImagesMap.get(code) || [];
    
    if (images && images.length > 0) {
      images.forEach((image, index) => {
        results.push({
          code: `${code}_${index + 1}`,
          multiplicity: 1,
          size: '',
          title: '',
          image: image,
          category: '',
          brand: '',
          properties: '',
          viewMaterial: '',
          groupMaterial: '',
        });
      });
    }
  });
 
  return results;
};

const processExternalProductsMeta = (articlesFromQuery, externalImagesMap) => {
  const results = [];
  
  articlesFromQuery.forEach(code => {
    const images = externalImagesMap.get(code) || [];
    
    if (images && images.length > 0) {
      results.push({
        code: code,
        name: 'Техническая позиция',
        multiplicity: 1,
        link: '#',
        images: images, 
        properties: [],          
        originProperties: [],
        styleVariant: 'default',
        templateType: 'main', 
      });
    }
  });
  
  return results;
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

  // Функция для применения стилей к элементам
  const applyElementStyle = (element, variant) => {
    if (!element?.styles) return element;
    
    const styleData = element.styles[variant];
    if (!styleData) return element;
    
    const result = { ...element };
    
    if (styleData.image !== undefined) {
      result.image = styleData.image;
    }
    
    // Добавьте другие свойства стиля, если нужно
    if (styleData.width !== undefined) result.width = styleData.width;
    if (styleData.height !== undefined) result.height = styleData.height;
    if (styleData.originalWidth !== undefined) result.originalWidth = styleData.originalWidth;
    if (styleData.originalHeight !== undefined) result.originalHeight = styleData.originalHeight;
    if (styleData.position !== undefined) result.position = styleData.position;
    if (styleData.rotation !== undefined) result.rotation = styleData.rotation;
    
    return result;
  };

  const generateDesignData = useCallback((item, styleVariant = 'default') => {
    // Функция для проверки типа шаблона
    const getTemplateType = (template) => {
      if (!Array.isArray(template)) return 'single';
      return template.some(item => Array.isArray(item)) ? 'complex' : 'simple';
    };
    
    // Обработка сложных шаблонов (массив массивов)
    const processComplexTemplate = (templateArray) => {
      const parts = item.code.split('_');
      const imageIndex = parseInt(parts[parts.length - 1]) - 1;
      const templateIndex = Math.min(imageIndex, templateArray.length - 1);
      const selectedTemplate = templateArray[templateIndex];

      // Фильтруем и применяем стиль
      let filteredTemplate = filterElementsByVisibility(selectedTemplate, styleVariant);
      filteredTemplate = filteredTemplate.map(element => 
        applyElementStyle(element, styleVariant)
      );

      return replacePlaceholders(filteredTemplate, item);
    };
  
    // Система шаблонов
    const TEMPLATE_SYSTEM = {
      _default: templates.main, // Все шаблоны храним как массивы
      
      properties: {
        'Шарики из латекса': {
          _default: templates.main,
          
          viewMaterials: {
            'Круглые без рисунка': {
              _default: templates.main,
              
              groupMaterials: {
                'Шар с рисунком': {
                  _default: templates.main,
                  
                  brands: {
                    'Gemar': templates.gemar,
                    'Belbal': templates.belbal
                  }
                }
              },
              
              brands: {
                'Gemar': templates.gemar,
                'Belbal': templates.belbal
              }
            }
          },
          
          groupMaterials: {
            'Шар с рисунком': {
              _default: templates.main,
              
              brands: {
                'Gemar': templates.gemar,
                'Belbal': templates.belbal
              }
            }
          },
          
          brands: {
            'Gemar': templates.gemar,
            'Belbal': templates.belbal
          }
        },
        'Шарики из фольги': {
          _default: templates.main,
          viewMaterials: {
            'Шары фигурные малые': {
              _default: templates.main
            }
          }
        },
        'Хлопушка': {
           _default: templates.petard
        }
      },
      
      useMainTemplate: [
        'Bubble', 'Баннеры', 'Барные аксессуары', 'Бижутерия', 'Боа',
        'Бумага упаковочная', 'Гавайи', 'Газовое оборудование', 'Галстук',
        'Гелий, баллоны', 'Гирлянды', 'Гирлянды-буквы', 'Гирлянды вертикальные',
        'Гирлянды-вымпелы', 'Головные уборы', 'Горн', 'Грим', 'Грузики для шаров',
        'Декорации', 'Декорации подвески', 'Держатели', 'Дисплеи', 'Дудочка',
        'Дым цветной', 'Значок', 'Игра', 'Игрушки', 'Карнавальный костюм',
        'Клоунский нос', 'Компрессор для шаров', 'Конфетти', 'Краска для шаров',
        'Лента', 'Лента для шаров', 'Маски', 'Медаль', 'Мишура', 'Мыльные пузыри',
        'Наборы в упаковках', 'Надувная игрушка', 'Наклейки', 'Насос для шаров',
        'Очки', 'Пакет', 'Парик', 'Пиньята', 'Пиротехника', 'Пленка упаковочная',
        'Полимерный гель для шаров', 'Праздничные аксессуары', 'Рекламные шары',
        'Салфетки', 'Светящиеся сувениры', 'Свечи для торта', 'Свечи-цифры',
        'Серпантин', 'Сеть', 'Скатерти', 'Сладкий стол', 'Спецэффекты', 'Спирали',
        'Спрей', 'Стаканы', 'Столовые приборы', 'Тарелки', 'Тассел, бахрома',
        'Украшения на голову', 'Упаковочный', 'Учебные материалы', 'Фант',
        'Фигурка на торт', 'Фотобутафория', 'Язычки'
      ]
    };
  
    // Улучшенная функция поиска шаблона
    const findTemplate = () => {
      // 1. Проверяем свойства из useMainTemplate
      if (TEMPLATE_SYSTEM.useMainTemplate.includes(item.properties)) {
        return TEMPLATE_SYSTEM._default;
      }
    
      // 2. Получаем конфигурацию для свойства
      const propertyConfig = TEMPLATE_SYSTEM.properties[item.properties];
      if (!propertyConfig) {
        return TEMPLATE_SYSTEM._default;
      }
    
      // Проверяем полный путь (viewMaterial -> groupMaterial -> brand)
      if (item.viewMaterial && item.groupMaterial && item.brand) {
        const viewMat = propertyConfig.viewMaterials?.[item.viewMaterial];
        const groupMat = viewMat?.groupMaterials?.[item.groupMaterial];
        const brandTemplate = groupMat?.brands?.[item.brand];
        if (brandTemplate) return brandTemplate;
      }
    
      // Проверяем viewMaterial -> brand
      if (item.viewMaterial && item.brand) {
        const brandTemplate = propertyConfig.viewMaterials?.[item.viewMaterial]?.brands?.[item.brand];
        if (brandTemplate) return brandTemplate;
      }
    
      // Проверяем groupMaterial -> brand
      if (item.groupMaterial && item.brand) {
        const brandTemplate = propertyConfig.groupMaterials?.[item.groupMaterial]?.brands?.[item.brand];
        if (brandTemplate) return brandTemplate;
      }
    
      // Проверяем только brand
      if (item.brand) {
        const brandTemplate = propertyConfig.brands?.[item.brand];
        if (brandTemplate) return brandTemplate;
      }
    
      // Проверяем viewMaterial -> groupMaterial
      if (item.viewMaterial && item.groupMaterial) {
        const groupTemplate = propertyConfig.viewMaterials?.[item.viewMaterial]?.groupMaterials?.[item.groupMaterial]?._default;
        if (groupTemplate) return groupTemplate;
      }
    
      // Проверяем только viewMaterial
      if (item.viewMaterial) {
        const viewTemplate = propertyConfig.viewMaterials?.[item.viewMaterial]?._default;
        if (viewTemplate) return viewTemplate;
      }
    
      // Проверяем только groupMaterial
      if (item.groupMaterial) {
        const groupTemplate = propertyConfig.groupMaterials?.[item.groupMaterial]?._default;
        if (groupTemplate) return groupTemplate;
      }
    
      // Возвращаем дефолтный для свойства
      return propertyConfig._default;
    };
  
    // Получаем шаблон
    const template = findTemplate();
    
    // Определяем тип шаблона
    const templateType = getTemplateType(template);
  
    // Обрабатываем в зависимости от типа
    switch (templateType) {
      case 'complex':
        return processComplexTemplate(template);
      case 'simple':
        return replacePlaceholders(template, item);
      default:
        return replacePlaceholders([template], item);
    }
  }, [templates]);

  // Функция для загрузки внешних изображений по кодам
  const loadExternalImagesForCodes = async (codes) => {
    const imagesMap = new Map();

    await Promise.all(codes.map(async (code) => {
      try {
        const params = {
          page: 1,
          limit: 100,
          tags: [code]
        };

        const result = await apiGetImagesExcludingMarketplaces(params);

        if (result && result.files && Array.isArray(result.files)) {
          const images = result.files.map(file => 
            `https://mp.sharik.ru${file.url}`
          );
          imagesMap.set(code, images);
        } else {
          imagesMap.set(code, []);
        }
      } catch (error) {
        console.error(`Error fetching images for code ${code}:`, error);
        imagesMap.set(code, []);
      }
    }));

    return imagesMap;
  };

  // Функция для проверки, является ли строка артикулом в формате XXXX-XXXX
const isArticleFormat = (str) => {
  return /^\d{4}-\d{4}$/.test(str);
};

  // Функция для парсинга строки запроса на артикулы
const parseArticlesFromQuery = (query) => {
  if (!query || typeof query !== 'string') return [];
  
  // Разделяем по возможным разделителям: запятая, пробел, +, _
  const separators = /[\s,+_]+/;
  const parts = query.split(separators).filter(part => part.trim() !== '');
  
  // Фильтруем только те части, которые соответствуют формату артикула
  const articles = parts.filter(part => isArticleFormat(part));
  
  return articles;
};

  // В компоненте Home обновляем handleSearch
  const handleSearch = useCallback(async (normalizedArticles) => {
    setError(null);
    setInfoMessage(null);

    if (!normalizedArticles.length) {
      setValidArticles([]);
      setIsSearchActive(false);
      return
    };

    // Ждем загрузки шаблонов если они еще не загружены
    if (!templatesCache.current.loaded) {
      setInfoMessage('Загрузка шаблонов...');
      await loadTemplates();
    }

      setLoading(true);

      const searchQuery = normalizedArticles.join(' ');
      const encodedSearch = encodeURIComponent(searchQuery);

      fetch(`https://new.sharik.ru/api/rest/v1/products_lite/?page_size=100&search=${encodedSearch}&ordering=relevance&supplier_category__isnull=False`)
        .then(response => response.json())
        .then(data => {
          if (data.results.length === 0) {
            const articlesFromQuery = parseArticlesFromQuery(searchQuery);
            if (articlesFromQuery.length > 0) {
              loadExternalImagesForCodes(articlesFromQuery)
                .then(externalImagesMap => {
                  let hasImages = false;
                  externalImagesMap.forEach((images) => {
                    if (images && images.length > 0) hasImages = true;
                  });

                  if (hasImages) {
                    const processedResults = processExternalImagesData(articlesFromQuery, externalImagesMap);
                    const processedMetaResults = processExternalProductsMeta(articlesFromQuery, externalImagesMap);

                    processedResults.forEach(item => {
                      const designData = generateDesignData(item);
                      slidesDB.add({
                        code: `design-${item.code}`, 
                        data: designData
                      });
                    });
                  
                    processedMetaResults.forEach(item => {
                      productsDB.add({
                        code: `product-${item.code}`, 
                        data: item   
                      });
                    });

                    const codes = processedResults.map(item => item.code);
                    setValidArticles(codes);
                    setIsSearchActive(codes.length > 0);

                    sessionStorage.setItem('searchData', JSON.stringify({
                      query: searchQuery,
                      articles: codes
                    }));

                    // Убираем сообщение об ошибке, если все хорошо
                    setInfoMessage(null);
                  } else {
                    // Если изображений нет, показываем сообщение
                    const message = t('views.homeMissingCode');
                    setInfoMessage(message);
                    setValidArticles([]);
                    setIsSearchActive(false);
                  }
                })
                .catch(error => {
                  console.error('Error loading external images:', error);
                  setError(error.message || "An error occurred");
                  setValidArticles([]);
                  setIsSearchActive(false);
                })
                .finally(() => {
                  setLoading(false);
                });
            } else {
              const message = t('views.homeMissingCode');
              setInfoMessage(message);
              setValidArticles([]);
              setIsSearchActive(false);
              setLoading(false);
            }
            return [null, new Map()];
          }
        
          const productIds = data.results.map(product => product.id);
          const idsParam = productIds.join(',');
            // Запускаем два запроса параллельно
          const detailedPromise = fetch(`https://new.sharik.ru/api/rest/v1/products_detailed/get_many/?ids=${idsParam}`).then(r => r.json());

          // Создаем промис для загрузки внешних изображений
          const codes = data.results.map(product => product.code);
          const externalImagesPromise = loadExternalImagesForCodes(codes);

          return Promise.all([detailedPromise, externalImagesPromise]);
        })
        .then(([detailedData, externalImagesMap]) => {
        if (!detailedData) return;

        // Обрабатываем полученные данные API
        const processedResults = processProductsData(detailedData, externalImagesMap);
        const processedMetaResults = processProductsMeta(detailedData, externalImagesMap);

        // Сохраняем в sessionStorage
        processedResults.forEach(item => {
          const designData = generateDesignData(item);
          slidesDB.add({
            code: `design-${item.code}`, 
            data: designData
          });
        });

        processedMetaResults.forEach(item => {
          productsDB.add({
            code: `product-${item.code}`, 
            data: item   
          });
        });

        // Обновляем состояние
        const codes = processedResults.map(item => item.code);
        setValidArticles(codes);
        setIsSearchActive(codes.length > 0);

        // Сохраняем оригинальные артикулы
        sessionStorage.setItem('searchData', JSON.stringify({
          query: searchQuery,
          articles: codes
        }));

        return processedResults;
      })
      .catch(error => {
            const articlesFromQuery = parseArticlesFromQuery(searchQuery);
            if (articlesFromQuery.length > 0) {
              loadExternalImagesForCodes(articlesFromQuery)
                .then(externalImagesMap => {
                  let hasImages = false;
                  externalImagesMap.forEach((images) => {
                    if (images && images.length > 0) hasImages = true;
                  });

                  if (hasImages) {
                    const processedResults = processExternalImagesData(articlesFromQuery, externalImagesMap);
                    const processedMetaResults = processExternalProductsMeta(articlesFromQuery, externalImagesMap);

                    processedResults.forEach(item => {
                      const designData = generateDesignData(item);
                      slidesDB.add({
                        code: `design-${item.code}`, 
                        data: designData
                      });
                    });
                  
                    processedMetaResults.forEach(item => {
                      productsDB.add({
                        code: `product-${item.code}`, 
                        data: item   
                      });
                    });

                    const codes = processedResults.map(item => item.code);
                    setValidArticles(codes);
                    setIsSearchActive(codes.length > 0);

                    sessionStorage.setItem('searchData', JSON.stringify({
                      query: searchQuery,
                      articles: codes
                    }));

                    // Убираем сообщение об ошибке, если все хорошо
                    setInfoMessage(null);
                  } else {
                    // Если изображений нет, показываем сообщение
                    const message = t('views.homeMissingCode');
                    setInfoMessage(message);
                    setValidArticles([]);
                    setIsSearchActive(false);
                  }
                })}


        console.error('Error:', error);
        setError(error.message || "An error occurred");
        setValidArticles([]);
        setIsSearchActive(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [generateDesignData, isToggled]);

  const handleItemsUpdate = (newItems) => {
    setValidArticles(newItems);
  };
  
  return (
    <div>
      <SearchHeader 
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchActive={isSearchActive}
        loading={loading}
        error={error}
        infoMessage={infoMessage}
        isToggled={isToggled} 
        setIsToggled={setIsToggled}
      />
      <ItemsGrid 
        items={validArticles} 
        onItemsUpdate={handleItemsUpdate}
        templates={templates}
        isToggled={isToggled}
      />
      {isToggled && (
        <SelectionImagesModal 
          isOpen={isToggled}
          onClose={() => setIsToggled(false)}
          articles={Array.from(new Set( // Фильтрация уникальных кодов
            validArticles.map(code => code.split('_')[0])
          ))}
        />
      )}
      {(showUpdateModal && isAuthenticated && !isPhotographer) && (() => {
        const config = getConfig();
        return (
          <UpdateModal
            isOpen={showUpdateModal}
            onClose={() => setShowUpdateModal(false)}
            data={config.version}
            markdownFile={config.file}
            headerImage={config.headerImage}
            localStorageKey={config.key}
          />
        );
      })()}
    </div>
  );
};
