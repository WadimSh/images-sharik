import { useState, useCallback, useEffect } from 'react';
import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";

import { replacePlaceholders } from '../../utils/replacePlaceholders';
import { data } from "../../assets/data";

export const Home = () => {
  const savedData = sessionStorage.getItem('searchData');
  const initialData = savedData 
    ? JSON.parse(savedData)
    : { query: '', articles: [] };

  const [validArticles, setValidArticles] = useState(initialData.articles);
  const [searchQuery, setSearchQuery] = useState(initialData.query);
  const [isSearchActive, setIsSearchActive] = useState(initialData.articles.length > 0);
  const [templates, setTemplates] = useState({
    gemar: [],
    main: [],
    default: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);

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
  
  // Загрузка шаблона
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const [mainTemplate, defaultTemplate, gemarTemplate] = await Promise.all([
          fetch('/templates/main-template.json').then(r => r.json()),
          fetch('/templates/default-template.json').then(r => r.json()),
          fetch('/templates/gemar-template.json').then(r => r.json())
        ]);
        setTemplates({ gemar: gemarTemplate, main: mainTemplate, default: defaultTemplate  });
      } catch (error) {
        console.error('Ошибка загрузки шаблонов:', error);
      }
    };

    loadTemplates();
  }, []);

  const processProductsMeta = (productsData) => {
    if (!Array.isArray(productsData)) {
      console.error('Некорректные данные для обработки:', productsData);
      return [];
    }
  
    return productsData.map(item => {
      if (!item || !item.images || !Array.isArray(item.images)) {
        console.warn('Некорректный элемент товара:', item);
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
  
      return {
        code: item.code,
        name: item.name,
        link: `https://new.sharik.ru/tovary-dly-prazdnika/${item.slug}`,
        images: images, // Массив ссылок на все изображения товара
        properties: propertiesList,
        originProperties: originPropertiesList,
      };
    }); // Фильтруем некорректные элементы
  };

  // Выносим функцию обработки данных в отдельную утилиту
  const processProductsData = (productsData) => {
    if (!Array.isArray(productsData)) {
      console.error('Некорректные данные для обработки:', productsData);
      return [];
    }
  
    return productsData.flatMap(item => {
      if (!item || !item.images || !Array.isArray(item.images)) {
        console.warn('Некорректный элемент товара:', item);
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
        multiplicity: `${item.multiplicity}шт`,
        size: getPropertyValue('Размер').split("/")[0]?.trim() || '',
        title: getPropertyValue('Дизайн товара'),
        image: `https://new.sharik.ru${image.image}`,
        category: getPropertyValue('Группа материала').toLowerCase(),
        brand: getOriginPropertyValue('Торговая марка'),
      }));
    });
  };

  const generateDesignData = useCallback((item) => {
    const template = item.brand === 'Gemar' ? templates.gemar : templates.main;
    return replacePlaceholders(template, item);
  }, [templates.main, templates.gemar]);

  // В компоненте Home обновляем handleSearch
const handleSearch = useCallback((normalizedArticles) => {
  setError(null);
  setInfoMessage(null);

  if (!normalizedArticles.length) {
    setValidArticles([]);
    setIsSearchActive(false);
    return
  };

    //setLoading(true);
    //
    //const searchQuery = normalizedArticles.join(' ');
    //const encodedSearch = encodeURIComponent(searchQuery);
    //
    //fetch(`https://new.sharik.ru/api/rest/v1/products_lite/?search=${encodedSearch}`)
    //  .then(response => response.json())
    //  .then(data => {
    //    if (data.results.length === 0) {
    //      const message = normalizedArticles.length === 1 
    //        ? "Товар с таким артикулом не активен." 
    //        : "Товары с такими артикулами не активны.";
    //      setInfoMessage(message);
    //      return Promise.reject(message);
    //    }
    //
    //    const productIds = data.results.map(product => product.id);
    //    const idsParam = productIds.join(',');
    //    return fetch(`https://new.sharik.ru/api/rest/v1/products_detailed/get_many/?ids=${idsParam}`);
    //  })
    //  .then(response => response?.json())
    //  .then(detailedData => {
    //    if (!detailedData) return;

      // Обрабатываем полученные данные API
      const processedResults = processProductsData(data);
      const processedMetaResults = processProductsMeta(data);
      //const processedResults = processProductsData(detailedData);
      //const processedMetaResults = processProductsMeta(detailedData);
      
      // Сохраняем в sessionStorage
      processedResults.forEach(item => {
        const designData = generateDesignData(item);
        sessionStorage.setItem(
          `design-${item.code}`, 
          JSON.stringify(designData)
        );
      });

      processedMetaResults.forEach(item => {
        sessionStorage.setItem(
          `product-${item.code}`, 
          JSON.stringify(item)
        );
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
    //})
    //.catch(error => {
    //  console.error('Ошибка:', error);
    //  setError(error.message || 'Произошла ошибка при поиске');
    //  setValidArticles([]);
    //  setIsSearchActive(false);
    //})
    //.finally(() => {
    //  setLoading(false);
    //});
}, [generateDesignData]);

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
      />
      <ItemsGrid 
        items={validArticles} 
        onItemsUpdate={handleItemsUpdate}
        templates={templates}
      />
    </div>
  );
};
