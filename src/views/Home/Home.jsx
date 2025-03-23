import { useState, useCallback, useEffect } from 'react';

import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";

export const Home = () => {
  const savedData = sessionStorage.getItem('searchData');
  const initialData = savedData 
    ? JSON.parse(savedData)
    : { query: '', articles: [] };

  const [validArticles, setValidArticles] = useState(initialData.articles);
  const [searchQuery, setSearchQuery] = useState(initialData.query);
  const [isSearchActive, setIsSearchActive] = useState(initialData.articles.length > 0);

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

  const handleSearch = useCallback((normalizedArticles) => {
    setValidArticles(normalizedArticles);
    setIsSearchActive(normalizedArticles.length > 0);
  }, []);

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
