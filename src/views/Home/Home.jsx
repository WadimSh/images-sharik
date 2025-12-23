import { useState, useCallback, useEffect, useContext, useRef } from 'react';

import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";
import { SelectionImagesModal } from '../../components/SelectionImagesModal';

import { replacePlaceholders } from '../../utils/replacePlaceholders';
// import { data } from "../../assets/data";
import { productsDB, slidesDB } from '../../utils/handleDB';
import { LanguageContext } from '../../contexts/contextLanguage';
import { apiGetAllLayouts } from '../../services/layoutsService';

export const Home = () => {
  const savedData = sessionStorage.getItem('searchData');
  const initialData = savedData 
    ? JSON.parse(savedData)
    : { query: '', articles: [] };

  const { t } = useContext(LanguageContext);
  const [validArticles, setValidArticles] = useState(initialData.articles);
  const [searchQuery, setSearchQuery] = useState(initialData.query);
  const [isSearchActive, setIsSearchActive] = useState(initialData.articles.length > 0);
  
  const [templates, setTemplates] = useState({
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
  
  const processProductsMeta = (productsData) => {
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
  
      // Формируем массив ссылок на изображения
      const images = item.images.map(image => 
        `https://new.sharik.ru${image.image}`
      );

      const propertiesList = properties.map(prop => ({ name: prop.name, value: prop.value }));
      const originPropertiesList = originProperties.map(prop => ({ name: prop.name, value: prop.value }));

      // Добавляем определение типа шаблона
      const brandProperty = originPropertiesList.find(p => p.name === 'Торговая марка');
      const brand = brandProperty ? brandProperty.value : '';
      
      const properProperty = propertiesList.find(p => p.name === 'Товарная номенклатура');
      const proper = properProperty ? properProperty.value : '';

      const templateType = brand.toLowerCase() === 'gemar' ? 'gemar' : brand.toLowerCase() === 'belbal' ? 'belbal' : proper.toLowerCase() === 'хлопушка' ? 'petard' : 'main';
  
      return {
        code: item.code,
        name: item.name,
        multiplicity: item.multiplicity,
        link: `https://new.sharik.ru/tovary-dly-prazdnika/${item.slug}`,
        images: images, // Массив ссылок на все изображения товара
        properties: propertiesList,
        originProperties: originPropertiesList,
        styleVariant: 'default',
        templateType: templateType, // Добавлено новое поле
      };
    }); // Фильтруем некорректные элементы
  };

  // Выносим функцию обработки данных в отдельную утилиту
  const processProductsData = (productsData) => {
    if (!Array.isArray(productsData)) {
      console.error('Invalid data for processing:', productsData);
      return [];
    }
  
    return productsData.flatMap(item => {
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
  
      return item.images.map((image, imgIndex) => ({
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
    });
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

      fetch(`https://new.sharik.ru/api/rest/v1/products_lite/?page_size=100&search=${encodedSearch}&supplier_category__isnull=False`)
        .then(response => response.json())
        .then(data => {
          if (data.results.length === 0) {
            const message = t('views.homeMissingCode');
            setInfoMessage(message);
            return Promise.reject(message);
          }
        
          const productIds = data.results.map(product => product.id);
          const idsParam = productIds.join(',');
          return fetch(`https://new.sharik.ru/api/rest/v1/products_detailed/get_many/?ids=${idsParam}`);
        })
        .then(response => response?.json())
        .then(detailedData => {
          if (!detailedData) return;

        // Обрабатываем полученные данные API
        //const processedResults = processProductsData(data);
        //const processedMetaResults = processProductsMeta(data);
        const processedResults = processProductsData(detailedData);
        const processedMetaResults = processProductsMeta(detailedData);

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
    </div>
  );
};
