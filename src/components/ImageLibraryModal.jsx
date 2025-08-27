import { useEffect, useState, useContext, useCallback } from 'react';
import { LanguageContext } from '../contexts/contextLanguage';

export const ImageLibraryModal = ({ isOpen, onClose, onSelectImage }) => {
  const { t } = useContext(LanguageContext);
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    
    const loadData = async () => {
      try {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch('/images/image-list.json', {
          signal: controller.signal
        });
        const data = await response.json();
        
        setCategories(data.categories || []);
        setImages(data.images || []);
        setFilteredImages(data.images || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading data:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) loadData();

    return () => controller.abort();
  }, [isOpen]);

  const filterImages = useCallback((categoryId = selectedCategory, subcategoryId = selectedSubcategory, search = searchTerm) => {
    let filtered = images;

    // Фильтрация по категории (только если выбрана не "Все")
    if (categoryId !== 'all') {
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        // Если у категории есть подкатегории
        if (category.subcategories && category.subcategories.length > 0) {
          if (subcategoryId === 'all') {
            // Для "Все" в категории с подкатегориями - фильтруем по ID категории
            filtered = images.filter(img => 
              img.tags?.includes(categoryId)
            );
          } else {
            // Конкретная подкатегория
            const subcategory = category.subcategories.find(sub => sub.id === subcategoryId);
            if (subcategory) {
              filtered = images.filter(img => 
                subcategory.tags.some(tag => 
                  img.tags?.includes(tag)
                )
              );
            }
          }
        } else {
          // Если у категории нет подкатегорий, фильтруем по ID категории
          filtered = images.filter(img => 
            img.tags?.includes(categoryId)
          );
        }
      }
    }

    // Поиск (применяется всегда, даже для категории "Все")
    if (search) {
      filtered = filtered.filter(img =>
        img.filename.toLowerCase().includes(search.toLowerCase()) ||
        img.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      );
    }

    setFilteredImages(filtered);
  }, [categories, images, selectedCategory, selectedSubcategory, searchTerm]);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSelectedSubcategory('all');
    filterImages(categoryId, 'all', searchTerm);
  };

  const handleSubcategorySelect = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    filterImages(selectedCategory, subcategoryId, searchTerm);
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    filterImages(selectedCategory, selectedSubcategory, value);
  };

  const handleImageSelect = (image) => {
    onSelectImage(image.filename);
  };

  const clearSearch = () => {
    setSearchTerm('');
    filterImages(selectedCategory, selectedSubcategory, '');
  };

  const getCurrentCategory = () => {
    return categories.find(cat => cat.id === selectedCategory);
  };

  const hasSubcategories = (category) => {
    return category.subcategories && category.subcategories.length > 0;
  };

  if (!isOpen) return null;

  return (
    <div className="modals-overlay" onClick={onClose}>
      <div className="modals-container" onClick={e => e.stopPropagation()}>
        <div className="modals-header">
          <h2>{t('modals.titleImageLibrary')}</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {/* Поиск */}
        <div className="modals-search">
          <div className="search-box">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder={t('modals.searchPlaceholders') || "Поиск изображений..."}
                value={searchTerm}
                onChange={handleSearch}
                className="search-inputs"
              />
              {searchTerm && (
                <button 
                  className="search-clear-btn"
                  onClick={clearSearch}
                  type="button"
                >
                  &times;
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Основные категории */}
        <div className="main-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`main-category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <span className="category-name">{t(category.name)}</span>
            </button>
          ))}
        </div>

        {/* Подкатегории (только если выбрана не основная категория "Все" и у нее есть подкатегории) */}
        {selectedCategory !== 'all' && 
         getCurrentCategory() && 
         hasSubcategories(getCurrentCategory()) && (
          <div className="subcategories">
            <div className='subcategories-header'>
              <h4>{t('modals.subcategories')}:</h4>
            </div>
            <div className="subcategories-tabs">
              <button
                className={`subcategory-btn ${selectedSubcategory === 'all' ? 'active' : ''}`}
                onClick={() => handleSubcategorySelect('all')}
              >
                {t('category.all_from')} {t(getCurrentCategory().name)}
              </button>
              {getCurrentCategory().subcategories.map(subcategory => (
                <button
                  key={subcategory.id}
                  className={`subcategory-btn ${selectedSubcategory === subcategory.id ? 'active' : ''}`}
                  onClick={() => handleSubcategorySelect(subcategory.id)}
                >
                  {t(subcategory.name)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Контент */}
        <div className="modals-content">
          {isLoading ? (
            <div className="skeleton-container">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="skeleton-item" />
              ))}
            </div>
          ) : (
            <>
              {filteredImages.length === 0 ? (
                <div className="empty-state">
                  <p>{t('modals.noImagesFound') || "Изображения не найдены"}</p>
                </div>
              ) : (
                <div className="images-grids">
                  {filteredImages.map((img, index) => (
                    <div 
                      key={index}
                      className="images-items"
                      onClick={() => handleImageSelect(img)}
                      title={img.filename}
                    >
                      <img 
                        src={`/images/${img.filename}`} 
                        alt={`Изображение ${index + 1}`}
                        loading="lazy"
                      />
                      <div className="image-overlay">
                        <span className="image-name">{img.filename}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Статус бар */}
        <div className="modals-footer">
          <div className="results-info">
            {!isLoading && (
              <span>
                {filteredImages.length} {t('modals.imagesFound') || "изображений найдено"}
                {selectedCategory !== 'all' && ` в "${t(getCurrentCategory()?.name)}"`}
                {selectedSubcategory !== 'all' && ` → "${t(getCurrentCategory()?.subcategories?.find(sub => sub.id === selectedSubcategory)?.name)}"`}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};