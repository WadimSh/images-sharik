import { useState, useCallback, useEffect } from 'react';
import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";
import { data } from "../../assets/data";

const replacePlaceholders = (template, item) => {
  return template.map(element => ({
    ...element,
    image: element.image === "{{ITEM_IMAGE}}" ? item.image : element.image,
    text: element.text
      ? element.text
          .replace("{{CATEGORY}}", item.category)
          .replace("{{TITLE}}", item.title)
          .replace("{{MULTIPLICITY}}", item.multiplicity)
          .replace("{{SIZE}}", item.size)
          .replace("{{BRAND}}", item.brand)
          //.replace("{{ARTICLE}}", item.code)
      : element.text
  }));
};

export const Home = () => {
  const savedData = sessionStorage.getItem('searchData');
  const initialData = savedData 
    ? JSON.parse(savedData)
    : { query: '', articles: [] };

  const [validArticles, setValidArticles] = useState(initialData.articles);
  const [searchQuery, setSearchQuery] = useState(initialData.query);
  const [isSearchActive, setIsSearchActive] = useState(initialData.articles.length > 0);
  const [template, setTemplate] = useState([]);

  const result = data.map(item => {
    // Находим нужные свойства
    const materialGroup = item.properties.find(prop => prop.name === 'Группа материала');
    const designGroup = item.properties.find(prop => prop.name === 'Дизайн товара');
    const sizeGroup = item.properties.find(prop => prop.name === 'Размер');
    const brandName = item.origin_properties.find(prop => prop.name === 'Торговая марка');
    
    return {
        code: item.code,
        multiplicity: `${item.multiplicity}шт`,
        size: sizeGroup
          ? sizeGroup.value.split("/")[0].trim()
          : '',
        title: designGroup
          ? designGroup.value
          : '',
        image: item.images[0] 
          ? `https://new.sharik.ru${item.images[0].image}` 
          : '',
        category: materialGroup 
          ? materialGroup.value.toLowerCase() 
          : '',
        brand: brandName
          ? brandName.value
          : '',
    };
  });

  console.log(result)

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
    fetch('/templates/default-template.json')
      .then(response => response.json())
      .then(data => setTemplate(data))
      .catch(console.error);
  }, []);

  const generateDesignData = useCallback((item) => {
    return replacePlaceholders(template, item);
  }, [template]);

  const handleSearch = useCallback((normalizedArticles) => {

    const codes = normalizedArticles.length > 0 && result.map(item => item.code);

    result.forEach(item => {
      const designData = generateDesignData(item);
      sessionStorage.setItem(`design-${item.code}`, JSON.stringify(designData));
    });

    setValidArticles(codes);
    setIsSearchActive(codes.length > 0);
  }, [generateDesignData]);

  return (
    <div>
      <SearchHeader 
        onSearch={handleSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearchActive={isSearchActive}
      />
      <ItemsGrid items={validArticles} />
    </div>
  );
};
