import { createContext, useContext, useState, useEffect } from 'react';

const RecentImagesContext = createContext();

export const RecentImagesProvider = ({ children }) => {
  const [recentImages, setRecentImages] = useState([]);

  useEffect(() => {
    // Загрузка из sessionStorage при инициализации
    const saved = sessionStorage.getItem('recentImages');
    if (saved) {
      setRecentImages(JSON.parse(saved));
    }
  }, []);

  const addRecentImage = (image) => {
    setRecentImages(prev => {
      // Убираем дубликаты и ограничиваем количество (например, 10 последних)
      const filtered = prev.filter(img => img.filename !== image.filename);
      const updated = [image, ...filtered].slice(0, 10);
      
      // Сохраняем в sessionStorage
      sessionStorage.setItem('recentImages', JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentImages = () => {
    setRecentImages([]);
    sessionStorage.removeItem('recentImages');
  };

  return (
    <RecentImagesContext.Provider value={{ recentImages, addRecentImage, clearRecentImages }}>
      {children}
    </RecentImagesContext.Provider>
  );
};

export const useRecentImages = () => {
  const context = useContext(RecentImagesContext);
  if (!context) {
    throw new Error('useRecentImages must be used within a RecentImagesProvider');
  }
  return context;
};