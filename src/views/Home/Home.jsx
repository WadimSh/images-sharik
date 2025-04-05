import { useState, useCallback, useEffect } from 'react';

import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";

const replacePlaceholders = (template, article) => {
  const replacer = (value) => {
    if (typeof value === 'string') {
      return value.replace(/{{ARTICLE}}/g, article);
    }
    return value;
  };

  return template.map(element => {
    const newElement = {};
    for (const key in element) {
      newElement[key] = replacer(element[key]);
    }
    return newElement;
  });
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

  useEffect(() => {
    fetch('/templates/main-template.json')
      .then(response => response.json())
      .then(data => setTemplate(data))
      .catch(console.error);
  }, []);

  const generateDesignData = useCallback((article) => {
    return replacePlaceholders(template, article);
  }, [template]);

  const handleSearch = useCallback((normalizedArticles) => {
    normalizedArticles.forEach(article => {
      const designData = generateDesignData(article);
      sessionStorage.setItem(`design-${article}`, JSON.stringify(designData));
    });

    setValidArticles(normalizedArticles);
    setIsSearchActive(normalizedArticles.length > 0);
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
