import { useEffect, useState, useContext, useRef } from "react";
import { LuImagePlus } from "react-icons/lu";
import { FiArrowLeft } from 'react-icons/fi';
import { IoMdImages } from "react-icons/io";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi2";
import { FaTimes } from "react-icons/fa";
import { PiCirclesThreePlusLight } from "react-icons/pi";

import { TagsFilterComponent } from "../TagsFilterComponent/TagsFilterComponent";
import { useAuth } from "../../contexts/AuthContext"; 
import { apiGetImagesExcludingMarketplaces, uploadGraphicFile } from "../../services/mediaService";
import { LanguageContext } from "../../contexts/contextLanguage";
import Pagination from "../../ui/Pagination/Pagination";
import { PREDEFINED_TAGS } from "../../constants/tags";
import './LibraryMediaModal.css';

// Функция для получения цвета тега
const getTagColor = (tag) => {
  const predefinedTag = PREDEFINED_TAGS.find(t => t.name === tag);
  if (predefinedTag) {
    return predefinedTag.color;
  }
  
  if (tag === "нет кода") {
    return 'rgb(244, 67, 54)';
  }
  
  const colors = [
    'rgb(126, 171, 245)',
    'rgb(80, 197, 111)',
    'rgb(255, 208, 67)',
    'rgb(229, 109, 173)',
    'rgb(29, 183, 168)',
    'rgb(255, 171, 45)',
    'rgb(202, 106, 254)',
    'rgb(222, 133, 93)',
  ];
  
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const transliterateText = (text) => {
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D',
    'Е': 'E', 'Ё': 'Yo', 'Ж': 'Zh', 'З': 'Z', 'И': 'I',
    'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T',
    'У': 'U', 'Ф': 'F', 'Х': 'Kh', 'Ц': 'Ts', 'Ч': 'Ch',
    'Ш': 'Sh', 'Щ': 'Shch', 'Ъ': '', 'Ы': 'Y', 'Ь': '',
    'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  let result = text.replace(/[а-яёА-ЯЁ]/g, char => translitMap[char] || char);
  
  result = result.replace(/[^\w\s.-]/g, '_'); 
  result = result.replace(/\s+/g, '_'); 
  result = result.replace(/_+/g, '_'); 
  result = result.replace(/^_+|_+$/g, ''); 
  
  return result;
};

export const formatFileName = (fileName) => {
  const cleaned = fileName.trim();
  const transliterated = transliterateText(cleaned);
  return transliterated.toLowerCase();
};

const capitalizeTag = (tag) => {
  if (!tag) return '';
  
  return tag.split(' ').map((word, index) => {
    if (word.length === 0) return word;
    if (word.toLowerCase() === 'др') {
      return 'ДР';
    }
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    return word;
  }).join(' ');
};

export const LibraryMediaModal = ({ isOpen, onClose, setElements }) => {
  const { t } = useContext(LanguageContext);
  const { user } = useAuth(); 

  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [images, setImages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(96);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedFilterTags, setSelectedFilterTags] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [step, setStep] = useState('library');
  const [selectedTags, setSelectedTags] = useState([]);
  const [customTag, setCustomTag] = useState('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // Состояния для режима просмотра
  const [viewMode, setViewMode] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [tagColors, setTagColors] = useState({});

  const handleFilterTagToggle = (tag) => {
    setSelectedFilterTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleClearAllFilters = () => {
    setSelectedFilterTags([]);
  };

  // Функция для проверки, является ли тег артикулом
  const isArticleTag = (tag) => {
    return /^\d{4}-\d{4}$/.test(tag);
  };

  // Функция фильтрации тегов для отображения (без артикулов)
  const getVisibleTags = (tags) => {
    if (!tags || tags.length === 0) return [];
    return tags.filter(tag => tag && !isArticleTag(tag));
  };

  useEffect(() => {
    if (!isOpen) return;
    
    if (step === 'library' && !viewMode) {
      const controller = new AbortController();
      let timeoutId;

      const loadData = async () => {
        try {
          setIsLoading(true);
          
          const params = {
            page: currentPage,
            limit: itemsPerPage
          };

          if (selectedFilterTags.length > 0) {
            params.tags = selectedFilterTags;
          }
          
          const result = await apiGetImagesExcludingMarketplaces(params);
          
          if (result && result.files) {
            setImages(result.files);
            setTotalCount(result.pagination.total);
          }
        } catch (error) {
          if (error.name !== 'AbortError') {
            console.error('Error loading data:', error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      timeoutId = setTimeout(() => {
        loadData();
      }, 100);

      return () => {
        controller.abort();
        clearTimeout(timeoutId);
      };
    }
  }, [isOpen, currentPage, itemsPerPage, step, selectedFilterTags, viewMode]);

  // Создаем превью изображения
  useEffect(() => {
    if (selectedFile && step === 'upload') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        
        const img = new Image();
        img.onload = () => {
          setImageDimensions({
            width: img.width,
            height: img.height
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(selectedFile);
    }
  }, [selectedFile, step]);

  // Обновление цветов тегов при изменении выбранного изображения
  useEffect(() => {
    if (viewMode && images[selectedImageIndex]) {
      updateTagColors(images[selectedImageIndex].tags || []);
    }
  }, [viewMode, selectedImageIndex, images]);

  const updateTagColors = (tags) => {
    if (tags && Array.isArray(tags)) {
      const colors = {};
      tags.forEach(tag => {
        colors[tag] = getTagColor(tag);
      });
      setTagColors(colors);
    }
  };

  const getFullImageUrl = (thumbnailUrl) => {
    const baseUrl = 'https://mp.sharik.ru';
    return thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
  };

  const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);

  const handlePageChange = (page) => {
    if (isLoading) return; 
    setCurrentPage(page);
  };

  const handleSelectImage = async (imageUrl) => {
    try {
      const img = new Image();
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      const containerWidth = 450;
      const containerHeight = 600;
      
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const newWidth = img.naturalWidth * scale;
      const newHeight = img.naturalHeight * scale;
      
      const position = {
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2
      };
  
      const newElement = {
        id: generateUniqueId(),
        type: 'image',
        position,
        image: imageUrl,
        width: newWidth,
        height: newHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        isFlipped: false,
        rotation: 0
      };
  
      setElements(prev => [...prev, newElement]);
      handleCloseViewMode();
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Couldn`t upload image');
    }
  };

  const handleImageClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('Разрешены только JPEG, PNG и WebP файлы');
        return;
      }
      
      const maxSize = 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('Файл превышает размер 100MB');
        return;
      }
      
      setSelectedFile(file);
      setOriginalFileName(file.name);
      
      // Сбрасываем выбранные теги
      setSelectedTags([]);
      
      setStep('upload');
    };
    
    input.click();
  };

  // Открытие режима просмотра
  const handleImageClickView = (index) => {
    setSelectedImageIndex(index);
    setViewMode(true);
    updateTagColors(images[index].tags || []);
  };

  // Закрытие режима просмотра
  const handleCloseViewMode = () => {
    setViewMode(false);
  };

  // Применение выбранного изображения
  const handleApplyImage = async () => {
    const selectedImage = images[selectedImageIndex];
    const imageUrl = getFullImageUrl(selectedImage.url);
    await handleSelectImage(imageUrl);
  };

  // Обработчик клика по тегу в режиме просмотра
  const handleTagClick = (tag) => {
    // Закрываем режим просмотра
    setViewMode(false);
    // Добавляем тег в фильтры и сбрасываем страницу
    setSelectedFilterTags(prev => {
      if (!prev.includes(tag)) {
        return [...prev, tag];
      }
      return prev;
    });
    setCurrentPage(1);
  };

  // Удаление фильтра
  const removeFilter = (tagToRemove) => {
    setSelectedFilterTags(prev => prev.filter(t => t !== tagToRemove));
    setCurrentPage(1);
  };

  // Навигация в режиме просмотра
  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    
    const newIndex = selectedImageIndex > 0 ? selectedImageIndex - 1 : images.length - 1;
    setSelectedImageIndex(newIndex);
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (images.length === 0) return;
    
    const newIndex = selectedImageIndex < images.length - 1 ? selectedImageIndex + 1 : 0;
    setSelectedImageIndex(newIndex);
  };

  // Клавиатурная навигация
  useEffect(() => {
    if (!viewMode) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage(e);
      } else if (e.key === 'ArrowRight') {
        handleNextImage(e);
      } else if (e.key === 'Escape') {
        handleCloseViewMode();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode, selectedImageIndex, images]);

  // Извлечение ВСЕХ артикулов из имени файла
  const extractArticleCodesFromFileName = (fileName) => {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
    const articlePattern = /\d{4}-\d{4}/g;
    const matches = nameWithoutExt.match(articlePattern);
    return matches || [];
  };

  // Валидация артикула
  const validateArticle = (tag) => {
    const articleRegex = /^\d{4}-\d{4}$/;
    return articleRegex.test(tag);
  };

  // Проверка, является ли тег пользовательским (не артикул и не предопределенный)
  const isUserTag = (tag) => {
    const isArticle = validateArticle(tag);
    const isPredefined = PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag);
    return !isArticle && !isPredefined;
  };

  // Получаем только пользовательские теги (не артикулы и не предопределенные)
  const getUserTags = () => {
    return selectedTags.filter(tag => isUserTag(tag));
  };

  // Проверка, можно ли загружать (нужен хотя бы один не-артикульный тег)
  const canUpload = () => {
    const userTags = getUserTags();
    const hasPredefinedTags = selectedTags.some(tag => 
      PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag)
    );
    
    return userTags.length > 0 || hasPredefinedTags;
  };

  // Обработчики для тегов
  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    let trimmedTag = customTag.trim();
    if (trimmedTag) {
      if (validateArticle(trimmedTag)) {
        alert('Нельзя добавить артикул как тег. Артикулы определяются автоматически из имени файла.');
        return;
      }
      trimmedTag = capitalizeTag(trimmedTag);
      if (!selectedTags.includes(trimmedTag)) {
        setSelectedTags([...selectedTags, trimmedTag]);
        setCustomTag('');
      }
    }
  };

  const handleRemoveCustomTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Умная генерация имени файла с поддержкой нескольких артикулов
  const generateFileName = () => {
    const fileNameWithoutExt = originalFileName.replace(/\.[^/.]+$/, "");
    const extension = originalFileName.split('.').pop().toLowerCase();
    
    const now = new Date();
    const datePart = now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\./g, '');
    
    // Находим все артикулы в оригинальном имени
    const originalArticles = extractArticleCodesFromFileName(originalFileName);
    
    // Транслитерируем имя (кириллица -> латиница)
    let cleanedName = formatFileName(fileNameWithoutExt);
    
    // Убираем старые размеры и даты если есть
    cleanedName = cleanedName.replace(/_\d+x\d+_\d{8}/g, '');
    cleanedName = cleanedName.replace(/_\d{8}_\d{6}/g, '');
    cleanedName = cleanedName.replace(/_\d{6}/g, '');
    cleanedName = cleanedName.replace(/_+$/, '');
    
    // Убираем артикулы из cleanedName чтобы не дублировать
    if (originalArticles.length > 0) {
      originalArticles.forEach(article => {
        cleanedName = cleanedName.replace(new RegExp(`_?${article}_?`, 'g'), '');
      });
    }
    
    // Убираем 9999-9999 если случайно есть
    cleanedName = cleanedName.replace(/^9999-9999_/, '');
    cleanedName = cleanedName.replace(/_9999-9999_/g, '_');
    cleanedName = cleanedName.replace(/_9999-9999$/, '');
    
    // Очищаем от лишних подчеркиваний
    cleanedName = cleanedName.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    
    let finalName;
    
    if (originalArticles.length > 0) {
      // Если в имени есть артикулы, используем первый найденный
      const mainArticle = originalArticles[0];
      finalName = `${mainArticle}_${cleanedName || 'image'}_${imageDimensions.width}x${imageDimensions.height}_${datePart}.${extension}`;
    } else {
      // Если артикулов нет, добавляем 9999-9999 в начало
      finalName = `9999-9999_${cleanedName || 'image'}_${imageDimensions.width}x${imageDimensions.height}_${datePart}.${extension}`;
    }
    
    // Фикс для двойных подчеркиваний
    finalName = finalName.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    
    return finalName;
  };

  // Функция для загрузки изображения на сервер
  const handleUploadImage = async () => {
    try {
      if (!selectedFile || !user || !user.company || user.company.length === 0) {
        alert('Ошибка: нет данных пользователя или компании');
        return;
      }
      
      // Проверяем, что выбран хотя бы один не-артикульный тег
      if (!canUpload()) {
        alert('Пожалуйста, выберите хотя бы один тег (не артикул)');
        return;
      }
      
      setIsUploading(true);
      
      // КОНВЕРТИРУЕМ В WEBP
      let processedFile;
      const finalFileName = generateFileName().replace(/\.(png|jpg|jpeg)$/i, '.webp');
      
      // Если файл уже WEBP, используем как есть
      if (selectedFile.type === 'image/webp') {
        const blob = new Blob([selectedFile], { type: 'image/webp' });
        processedFile = new File([blob], finalFileName, {
          type: 'image/webp',
          lastModified: selectedFile.lastModified
        });
      } else {
        // Конвертируем в WEBP
        try {
          const img = new Image();
          const imageUrl = URL.createObjectURL(selectedFile);
          
          const webpBlob = await new Promise((resolve, reject) => {
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.naturalWidth;
              canvas.height = img.naturalHeight;
              
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Не удалось конвертировать изображение в WEBP'));
                  }
                },
                'image/webp',
                0.92
              );
            };
            
            img.onerror = () => {
              reject(new Error('Не удалось загрузить изображение для конвертации'));
            };
            
            img.src = imageUrl;
          });
          
          processedFile = new File([webpBlob], finalFileName, {
            type: 'image/webp',
            lastModified: selectedFile.lastModified
          });
          
          URL.revokeObjectURL(imageUrl);
          
        } catch (conversionError) {
          console.warn('Ошибка конвертации в WEBP, используем исходный файл:', conversionError);
          
          const blob = new Blob([selectedFile], { type: selectedFile.type });
          processedFile = new File([blob], finalFileName, {
            type: selectedFile.type,
            lastModified: selectedFile.lastModified
          });
        }
      }
      
      // Извлекаем артикулы из имени файла
      const extractedArticles = extractArticleCodesFromFileName(originalFileName);
      
      // Если нет артикулов в имени файла, добавляем 9999-9999
      const articleTags = extractedArticles.length > 0 
        ? extractedArticles 
        : ['9999-9999'];
      
      // Объединяем все теги: артикулы (из имени или 9999-9999) + выбранные пользователем теги
      const allTags = [...articleTags, ...selectedTags];
            
      const companyId = user.company[0].id;
      const uploadResult = await uploadGraphicFile(
        companyId,
        processedFile,
        null,
        allTags 
      );
      
      if (!uploadResult || !uploadResult.success) {
        throw new Error(uploadResult?.message || 'Не удалось загрузить файл на сервер');
      }
      
      const uploadedFile = uploadResult.data || uploadResult.file;
      
      if (!uploadedFile) {
        throw new Error('Нет данных о загруженном файле в ответе сервера');
      }
      
      const imageUrl = uploadedFile.url || uploadedFile.fileUrl;
            
      if (!imageUrl) {
        throw new Error('Нет URL изображения в ответе сервера');
      }
      
      const fullImageUrl = getFullImageUrl(imageUrl);
            
      const img = new Image();
      img.src = fullImageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const containerWidth = 450;
      const containerHeight = 600;
      
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const newWidth = img.naturalWidth * scale;
      const newHeight = img.naturalHeight * scale;
      
      const position = {
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2
      };

      const newElement = {
        id: generateUniqueId(),
        type: 'image',
        position,
        image: fullImageUrl,
        width: newWidth,
        height: newHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        isFlipped: false,
        rotation: 0        
      };
      
      setElements(prev => [...prev, newElement]);
      onClose();
      
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Ошибка при загрузке изображения на сервер: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleBackToLibrary = () => {
    setStep('library');
    setSelectedFile(null);
    setImagePreview(null);
    setSelectedTags([]);
    setCustomTag('');
  };

  // Режим просмотра изображения
  if (viewMode && images[selectedImageIndex]) {
    const currentImage = images[selectedImageIndex];
    const fullImageUrl = getFullImageUrl(currentImage.url);
    const visibleTags = getVisibleTags(currentImage.tags || []);

    return (
      <div className="modals-overlay" onClick={handleCloseViewMode}>
        <div className="view-mode-container" onClick={e => e.stopPropagation()}>
          <div className="view-mode-header">
            <div className="view-mode-header-left">
              <button onClick={handleCloseViewMode} className="back-btn">
                <FiArrowLeft />
              </button>
              <h3 className="view-mode-title">{currentImage.fileName}</h3>
            </div>
            <div className="view-mode-header-right">
              <button onClick={handleApplyImage} className="apply-bttn">
                <PiCirclesThreePlusLight size={20} />
                Применить изображение
              </button>
              <button onClick={handleCloseViewMode} className="close-btn">&times;</button>
            </div>
          </div>

          <div className="view-mode-body">
            <div className="view-mode-image-container">
              <img
                src={fullImageUrl}
                alt={currentImage.fileName}
                className="view-mode-image"
              />
              
              {/* Теги поверх изображения */}
              {visibleTags.length > 0 && (
                <div className="image-tags-overlay">
                  <div className="tags-container-overlay">
                    {visibleTags.map((tag, index) => (
                      <div key={index} className="tag-overlay-wrapper">
                        <span 
                          className="tags-overlay tag-clickable"
                          style={{
                            backgroundColor: tagColors[tag],
                            zIndex: visibleTags.length - index,
                            cursor: 'pointer'
                          }}
                          onClick={() => handleTagClick(tag)}
                        >
                          {tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Кнопки навигации */}
          {images.length > 1 && (
            <>
              <button 
                className="view-mode-nav-btn view-mode-nav-prev"
                onClick={handlePrevImage}
              >
                <HiOutlineChevronLeft size={32} />
              </button>
              
              <button 
                className="view-mode-nav-btn view-mode-nav-next"
                onClick={handleNextImage}
              >
                <HiOutlineChevronRight size={32} />
              </button>
            </>
          )}

          {/* Счетчик изображений */}
          <div className="view-mode-counter">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    );
  }

  // Рендер контента
  const renderContent = () => {
    if (step === 'upload') {
      const displayedTags = selectedTags.filter(tag => !validateArticle(tag));
      const userTagsCount = getUserTags().length;
      const predefinedTagsCount = selectedTags.filter(tag => 
        PREDEFINED_TAGS.some(predefinedTag => predefinedTag.name === tag)
      ).length;
      
      return (
        <div className="upload-step-container">
          <div className="upload-preview-section">
            {imagePreview && (
              <div className="image-preview-wrapper">
                <img 
                  src={imagePreview} 
                  alt="Предпросмотр" 
                  className="image-preview-large"
                />
              </div>
            )}
          </div>
          
          <div className="upload-form-section">
            <div className="form-group">
              <label>
                Выберите теги изображения:
                <span className="required-star">*</span>
              </label>
              
              <div className="tags-section-info">
                <div className="section-info-row">
                  <span>Предопределенные теги:</span>
                </div>
              </div>
              
              <div className="tags-grid">
                {PREDEFINED_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.name)}
                    className={`tag-btn ${selectedTags.includes(tag.name) ? 'selected' : ''}`}
                    style={{ 
                      backgroundColor: tag.color + '20', 
                      color: tag.color, 
                      borderColor: tag.color 
                    }}
                  >
                    {tag.name}
                    {selectedTags.includes(tag.name) && <span className="tag-check">✓</span>}
                  </button>
                ))}
              </div>

              <div className="tags-section-info">
                <div className="section-info-row">
                  <span>Создать свой тег:</span>
                </div>
              </div>

              <div className="custom-tag-section">
                <div className="custom-tag-input-group">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                    placeholder="Введите название тега"
                    className="form-input"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    disabled={!customTag.trim()}
                    className="add-custom-tag-btn"
                  >
                    Добавить
                  </button>
                </div>
              </div>

              {displayedTags.length > 0 && (
                <div className="selected-tags-section">
                  <div className="selected-tags-header">
                    <span>Выбрано тегов: {displayedTags.length}</span>
                    <span className="tags-breakdown">
                      ({predefinedTagsCount} предопределенных, {userTagsCount} пользовательских)
                    </span>
                  </div>
                  <div className="selected-tags-grid">
                    {displayedTags.map(tag => {
                      const isUserTagFlag = isUserTag(tag);
                      return (
                        <div 
                          key={tag} 
                          className={`selected-tag-item ${isUserTagFlag ? 'user-tag' : ''}`}
                          title={isUserTagFlag ? "Пользовательский тег" : "Предопределенный тег"}
                        >
                          <span className="selected-tag-text">{tag}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomTag(tag)}
                            className="selected-tag-remove"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!canUpload() && (
                <div className="validation-error">
                  ⚠ Для загрузки необходимо выбрать хотя бы один тег
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Шаг библиотеки
    return (
      <>
        <div className="main-categories" style={{ padding: '10px 14px' }}>
          <TagsFilterComponent 
            selectedFilterTags={selectedFilterTags}
            onTagToggle={handleFilterTagToggle}
            onClearAll={handleClearAllFilters}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />

          <button onClick={handleImageClick} className="upload-file-button" style={{ marginLeft: 'auto' }}>
            <LuImagePlus size={18} /> {t('Загрузить изображение')}
          </button>
        </div>

        {/* Индикатор активных фильтров */}
        {selectedFilterTags.length > 0 && (
          <div className="active-filters-bar">
            <span className="active-filter-label">Активные фильтры:</span>
            <div className="active-filters-list">
              {selectedFilterTags.map(tag => (
                <span key={tag} className="filter-tag">
                  {tag}
                  <button onClick={() => removeFilter(tag)}>
                    <FaTimes size={12} />
                  </button>
                </span>
              ))}
              {selectedFilterTags.length > 0 && (
                  <button 
                    className="filter-tag"
                    onClick={() => {
                      handleClearAllFilters();
                      setCurrentPage(1);
                    }}
                  >
                    Очистить фильтры
                  </button>
                )}
            </div>
          </div>
        )}

        <div className="modals-content">
          <div className="images-grids">
            {isLoading ? (
              [...Array(24)].map((_, index) => (
                <div key={index} className="skeleton-item" />
              ))
            ) : images.length === 0 ? (
              <div className="no-images-found">
                <div className="no-images-icon">
                  <IoMdImages size={74}/>
                </div>
                <div className="no-images-title">Ничего не найдено</div>
                <div className="no-images-text">
                  {selectedFilterTags.length > 0 
                    ? 'По выбранным фильтрам изображений нет. Попробуйте изменить критерии поиска.'
                    : 'В библиотеке пока нет изображений. Нажмите "Загрузить изображение", чтобы добавить первое фото.'}
                </div>
                {selectedFilterTags.length > 0 && (
                  <button 
                    className="clear-filters-btn-large"
                    onClick={() => {
                      handleClearAllFilters();
                      setCurrentPage(1);
                    }}
                  >
                    ✕ Очистить фильтры
                  </button>
                )}
              </div>
            ) : (
              images.map((image, index) => (
                <div 
                  key={image._id} 
                  className="images_card"
                  onClick={() => handleImageClickView(index)}
                >
                  <div className="images-container">
                    <img
                      src={getFullImageUrl(image.thumbnailUrl)}
                      alt={image.fileName}
                      loading="lazy"
                      className="image-thumbnail"
                      onError={(e) => {
                        e.target.src = getFullImageUrl(image.url);
                      }}
                    />
                  </div>
                  <div className="image-info-overlay">
                    <div className="image-filename" title={image.fileName}>
                      {image.fileName}
                    </div>
                    {getVisibleTags(image.tags).length > 0 && (
                      <div className="image-tags" title={getVisibleTags(image.tags).join(' • ')}>
                        {getVisibleTags(image.tags).join(' • ')}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="modals-footer">
          <Pagination
            currentPage={currentPage}
            totalCount={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            disabled={isLoading} 
          />
        </div>
      </>
    );
  };

  return (
    <div className="modals-overlay" onClick={onClose}>
      <div className="modals-container" onClick={e => e.stopPropagation()} style={{ height: '90vh' }}>
        <div className="modals-header" style={{padding: '10px 14px'}}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step === 'upload' && (
              <button onClick={handleBackToLibrary} className="back-btn">
                <FiArrowLeft />
              </button>
            )}
            <h2 style={{ fontSize: '1.3rem' }}>
              {step === 'library' ? 'Выберите изображение' : 'Добавьте теги к изображению'}
            </h2>
          </div>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>

        {renderContent()}

        {step === 'upload' && (
          <div className="upload-footer">
            <button onClick={handleBackToLibrary} className="secondary-btn">
              Назад
            </button>
            <button 
              onClick={handleUploadImage} 
              disabled={isUploading || !user || !canUpload()}
              className={`primary-btn ${isUploading ? 'loading' : ''} ${!canUpload() ? 'disabled' : ''}`}
            >
              {isUploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};