import { useState, useCallback } from 'react';

import SearchHeader from "../../components/SearchHeader";
import ItemsGrid from "../../components/ItemsGrid";

export const Home = () => {
  const [validArticles, setValidArticles] = useState([]);

  const handleSearch = useCallback((normalizedArticles) => {
    setValidArticles(normalizedArticles);
  }, []);

  return (
    <div>
      <SearchHeader onSearch={handleSearch} />
      <ItemsGrid items={validArticles} />
    </div>
  );
};
