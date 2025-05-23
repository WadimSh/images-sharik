import { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaImage, FaFont, FaSquare, FaElementor, FaPuzzlePiece } from 'react-icons/fa';
import UPNG from 'upng-js';
import imageCompression from 'browser-image-compression';

import { HeaderSection } from '../../components/HeaderSection';
import { TemplateModal } from '../../components/TemplateModal';
import { ProductMetaInfo } from '../../components/ProductMetaInfo';
import { ProductImagesGrid } from '../../components/ProductImagesGrid';
import { DraggableElementsList } from '../../components/DraggableElementsList';
import { ImageElement } from '../../components/ImageElement';
import { ShapeElement } from '../../components/ShapeElement';
import { TextElement } from '../../components/TextElement';
import { ElementsElement } from '../../components/ElementsElement';
import { ImageLibraryModal } from '../../components/ImageLibraryModal';
import { ProductModal } from '../../components/ProductModal';
import { FontControls } from '../../components/FontControls';

export const Generator = () => {
  const { id } = useParams();
  const isCollageMode = id === 'collage';

  const [baseId, slideNumber] = isCollageMode || !id ? ['', ''] : id.split('_');
  const apiKey = process.env.REACT_APP_API_KEY;

  const storageMetaKey = `product-${baseId}`
  const savedMetaDate = isCollageMode ? null : sessionStorage.getItem(storageMetaKey);
  const initialMetaDateElement = savedMetaDate ? JSON.parse(savedMetaDate) : [];
 
  // Загрузка из sessionStorage при инициализации
  const storageKey = isCollageMode 
    ? 'design-collage' 
    : `design-${id}`;
  const savedDesign = sessionStorage.getItem(storageKey);
  const initialElements = savedDesign ? JSON.parse(savedDesign) : [];

  // Добавляем размеры по умолчанию для старых данных
  const processedElements = initialElements.map(element => {
    if (element.type === 'image' && !element.width) {
      return {
        isFlipped: false,
        rotation: 0,
        width: 0,
        height: 0,
        ...element,
        ...(element.type === 'image' && !element.width && { 
          width: 200,
          height: 200
        }),
        ...(element.type === 'shape' && !element.color && {
          color: '#ccc',
          width: 100,
          height: 100,
        })
      };
    }
    return element;
  });

  const captureRef = useRef(null);
  const contextMenuRef = useRef(null);
  const colorInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedColorElementId, setSelectedColorElementId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [copiedElement, setCopiedElement] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  // Состояние для отслеживания обработки при запросе на удаление фона и добавления тени
  const [processingIds, setProcessingIds] = useState(new Set());
  const [processingShedowIds, setProcessingShedowIds] = useState(new Set());
  // Добавляем состояние для редактирования текста
  const [editingTextId, setEditingTextId] = useState(null);
  const [elements, setElements] = useState(processedElements);
  const [indexImg, setIndexImg] = useState(-1);
  // Состояния для модалки создания макетов
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  // Для работы с макетами
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  // Добавили состояние для отслеживания перетаскивания сторонней картинки
  const [isDragging, setIsDragging] = useState(false);
  // Добавили состояние для модалки выбора изображений для элементов
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  // Добавили состояние для модалки добавления дополнительного товара
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  // Добавили состояние для окрытия меню редактирования шрифта для контекстного меню
  const [selectedTextEdit, setSelectedTextEdit] = useState(null);
  // Добавили состояние для раскрытия меню со свойствами компонета
  const [expandedElementId, setExpandedElementId] = useState(null);
  // Состояние для хранения настроек тени
  const [shadowSetting, setShadowSetting] = useState({
    offsetX: 15,
    offsetY: 15,
  });

  // Функция управлением напралением тени 
  const handleDirectionChange = (axis, value) => {
    setShadowSetting(prev => ({
      ...prev,
      [axis]: prev[axis] === value ? 15 : value
    }));
  };

  // Добавим функцию для генерации уникальных ID
  const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);
 
  // Сохранение в sessionStorage при изменениях
  useEffect(() => {
    if (elements.length > 0) {
      sessionStorage.setItem(storageKey, JSON.stringify(elements));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  }, [elements, storageKey]);

  // Добавляем начальный текстовый элемент с ID
  useEffect(() => {
    if (id && !savedDesign) {
      setElements([{
        id: Date.now(),
        type: 'text',
        position: { x: 162, y: 266 },
        text: id,
        image: null
      }]);
    }
  }, [id, savedDesign]);

  // Функция для загрузки макетов
  const loadTemplate = (templateName) => {
    const template = templates[templateName];
    if (!template) return;

    // Заменяем плейсхолдер на текущее изображение товара
    const productImage = initialMetaDateElement?.images?.[indexImg] || '';

    const modifiedElements = template.map(element => ({
      ...element,
      image: element.type === 'image' && element.image === "{{ITEM_IMAGE}}" 
        ? productImage 
        : element.image
    }));

    setElements(modifiedElements);
    sessionStorage.setItem(storageKey, JSON.stringify(modifiedElements));
  };

  // Обработчик изменения цвета
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setElements(prev => 
      prev.map(el => 
        el.id === selectedColorElementId ? {...el, color: newColor, gradient: null} : el
      )
    );
  };

  // Обработчик клика по кнопке выбора цвета
  const handleColorButtonClick = (elementId) => {
    setElements(prev => 
      prev.map(el => {
        if (el.id === elementId) {
          // Сбрасываем градиент при выборе цвета
          return { 
            ...el, 
            gradient: null,
            color: el.color || '#ccc' // Обновляем цвет, если он не задан
          };
        }
        return el;
      })
    );

    const element = elements.find(el => el.id === elementId);
    if (element && colorInputRef.current) {
      // Устанавливаем значение напрямую в DOM-элемент
      colorInputRef.current.value = element.color || '#ccc';
      colorInputRef.current.click();
      setSelectedColorElementId(elementId);
    }
  };

  // Обработчик изменений параметров шрифта
  const handleFontChange = (elementId, property, value) => {
    console.log(elementId)
    console.log(property)
    setElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, [property]: value } : el
      )
    );
  };

  const handlePositionChange = (elementId, axis, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          position: {
            ...el.position,
            [axis]: parseInt(value) || 0
          }
        };
      }
      return el;
    }));
  };

  const handleSizeChange = (elementId, dimension, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          [dimension]: parseInt(value) || 0
        };
      }
      return el;
    }));
  };

  const handleRotationChange = (elementId, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          rotation: parseInt(value) || 0
        };
      }
      return el;
    }));
  };

  const handleBorderRadiusChange = (elementId, corner, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          borderRadius: {
            ...el.borderRadius,
            [corner]: parseInt(value) || 0
          }
        };
      }
      return el;
    }));
  };

  const handleGradientChange = (elementId, type, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        const gradient = el.gradient || {
          direction: 'to right',
          start: 0,
          colors: ['#000000', '#ffffff'],
          opacity: [1, 0]
        };

        return {
          ...el,
          gradient: {
            ...gradient,
            ...(type === 'direction' && { direction: value }),
            ...(type === 'start' && { start: value }),
            ...(type === 'color1' && { colors: [value, gradient.colors[1]] }),
            ...(type === 'color2' && { colors: [gradient.colors[0], value] }),
            ...(type === 'opacity1' && { 
              opacity: [parseFloat(value), gradient.opacity[1]] 
            }),
            ...(type === 'opacity2' && { 
              opacity: [gradient.opacity[0], parseFloat(value)] 
            }),
          }
        };
      }
      return el;
    }));
  };
  
  const handleoOpacityChange = (elementId, value) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        return {
          ...el,
          opacity: parseFloat(value) || 1
        };
      }
      return el;
    }));
  };

  const handleProportionalResize = (elementId, dimension, newValue) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        const numericValue = Number(newValue);
        if (isNaN(numericValue)) return el; // Защита от невалидных значений

        const delta = numericValue - el[dimension];

        return {
          ...el,
          width: dimension === 'width' ? numericValue : el.width + delta,
          height: dimension === 'height' ? numericValue : el.height + delta,
        };
      }
      return el;
    }));
  };

  // Обработчик переключения редактирования
  const handleTextEditToggle = (elementId, isEditing) => {
    setEditingTextId(isEditing ? elementId : null);
  };

  const handleAddElement = (type) => {
    if (type === 'image') {
      fileInputRef.current.click();
      return;
    };
    if (type === 'element') {
      setIsImageLibraryOpen(true);
      return;
    };
    if (type === 'product') {
      setIsProductModalOpen(true);
      return;
    };
    const newElement = {
      id: generateUniqueId(),
      type,
      position: { x: 50, y: 50 },
      ...(type === 'text' && {
        text: 'Новый текст',
        fontSize: 32,       
        color: '#333333',   
        fontFamily: 'HeliosCond', 
        fontWeight: 'normal', 
        fontStyle: 'normal',  
      }),
      image: null,
      ...(type === 'shape' && { 
        color: '#ccc',
        width: 100,
        height: 100,
         borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: 0,
          bottomRight: 0
        },
        gradient: null
      })
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
  
    try {
      // Настройки компрессии
      const options = {
        maxSizeMB: 1, // Максимальный размер файла
        maxWidthOrHeight: 2000, // Максимальное измерение
        useWebWorker: true, // Использовать многопоточность
        fileType: file.type.includes('png') ? 'image/png' : 'image/jpeg',
        initialQuality: 0.6 // Качество сжатия (0-1)
      };
  
      // Сжимаем изображение
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = () => {
          const containerWidth = 450;
          const containerHeight = 600;
  
          const scale = Math.min(
            containerWidth / img.width,
            containerHeight / img.height,
            1
          );
  
          const newWidth = img.width * scale;
          const newHeight = img.height * scale;
  
          const position = {
            x: (containerWidth - newWidth) / 2,
            y: (containerHeight - newHeight) / 2
          };
  
          const newElement = {
            id: Date.now(),
            type: 'image',
            position,
            image: event.target.result,
            width: newWidth,
            height: newHeight,
            originalWidth: img.width,
            originalHeight: img.height,
            isFlipped: false
          };
  
          setElements(prev => [...prev, newElement]);
        };
        img.onerror = () => alert('Ошибка загрузки изображения');
        img.src = event.target.result;
      };
      reader.readAsDataURL(compressedFile);
  
    } catch (error) {
      console.error('Ошибка сжатия:', error);
      alert('Не удалось обработать изображение');
    }
  };

  const handleDrag = (id, newPosition, newRotation) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return {
          ...el,
          position: newPosition,
          rotation: newRotation !== undefined ? newRotation : el.rotation
        };
      }
      return el;
    }));
  };

  // Добавляем новый обработчик для комплексного обновления
  const handleResizeWithPosition = (id, newData) => {
    setElements(prev => prev.map(el => {
      if (el.id === id) {
        return {
          ...el,
          width: newData.width,
          height: newData.height,
          position: {
            x: newData.x ?? el.position.x,
            y: newData.y ?? el.position.y
          }
        };
      }
      return el;
    }));
  };

  // Функция удаления фона через PhotoRoom API
  const handleRemoveBackground = async (elementId) => {
    try {
      const element = elements.find(el => el.id === elementId);
      //if (!element || !element.image?.startsWith('http')) return;
  
      setProcessingIds(prev => new Set(prev).add(elementId));
  
      // Скачиваем изображение
      const response = await fetch(element.image);
      const blob = await response.blob();
  
      // Формируем запрос
      const form = new FormData();
      form.append('image_file', blob, 'image.png');
      form.append('format', 'png');
      form.append('size', 'auto');
      form.append('despill', 'medium');
  
      const options = {
        method: 'POST',
        headers: {
          'x-api-key': apiKey
        },
        body: form
      };
  
      // Отправляем запрос
      const apiResponse = await fetch('https://sdk.photoroom.com/v1/segment', options);
      
      if (!apiResponse.ok) throw new Error('Ошибка API');
      
      // Конвертируем ответ в ArrayBuffer
      const processedBlob = await apiResponse.blob();
      const arrayBuffer = await processedBlob.arrayBuffer();
      
      // Декодируем изображение
      const image = UPNG.decode(arrayBuffer);
      
      // Параметры сжатия
      const compression = 60; // Уровень сжатия (0-100)
            
      // Перекодируем с оптимизацией
      const compressedArray = UPNG.encode(
        [image.data.buffer],
        image.width,
        image.height,
        compression
      );
      
      // Создаем Blob из сжатых данных
      const compressedBlob = new Blob([compressedArray], {type: 'image/png'});
      
      // Конвертируем в Data URL
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      
      reader.onloadend = () => {
        const compressedDataURL = reader.result;
        
        // Обновляем элементы и метаданные
        const updatedElements = elements.map(el => 
          el.id === elementId ? { ...el, image: compressedDataURL } : el
        );
  
        // Обновляем sessionStorage только для продуктовых изображений
        if (element?.isProduct) {
          try {
            const currentMeta = JSON.parse(sessionStorage.getItem(storageMetaKey) || '{}');
            const updatedImages = currentMeta.images ? [...currentMeta.images] : [];

            if (indexImg >= 0 && indexImg < updatedImages.length) {
              updatedImages[indexImg] = compressedDataURL;
              sessionStorage.setItem(storageMetaKey, JSON.stringify({
                ...currentMeta,
                images: updatedImages
              }));
            }
          } catch (e) {
            console.error('Ошибка обновления sessionStorage:', e);
          }
        }
  
        setElements(updatedElements);
      };
  
    } catch (error) {
      console.error('Ошибка:', error);
      alert(`Ошибка обработки изображения: ${error.message}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
    }
  };

  // Функция добавления тени через PhotoRoom API
  const handleAddShadow = async (elementId) => {
  try {
      const element = elements.find(el => el.id === elementId);
      if (!element?.image) return;

      setProcessingShedowIds(prev => new Set(prev).add(elementId));

      // Создаем canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Загружаем изображение
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Для внешних URL

      // Обрабатываем разные типы изображений
      let imageSrc = element.image;

      // Если это Blob или File
      if (element.image instanceof Blob) {
        imageSrc = URL.createObjectURL(element.image);
      }
      // Если это Data URL или обычный URL
      img.src = imageSrc;

      // Ожидаем загрузки изображения
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => reject(new Error('Не удалось загрузить изображение'));
      });

      // Параметры тени (можно вынести в настройки)
      const shadowSettings = {
        color: 'rgba(0,0,0,0.4)',
        blur: 20,
        offsetX: shadowSetting.offsetX,
        offsetY: shadowSetting.offsetY,
        padding: 40
      };

      // Рассчитываем размеры canvas
      canvas.width = img.width + shadowSettings.padding;
      canvas.height = img.height + shadowSettings.padding;

      // Рисуем тень
      ctx.shadowColor = shadowSettings.color;
      ctx.shadowBlur = shadowSettings.blur;
      ctx.shadowOffsetX = shadowSettings.offsetX;
      ctx.shadowOffsetY = shadowSettings.offsetY;

      // Позиционируем изображение по центру
      const x = (canvas.width - img.width) / 2;
      const y = (canvas.height - img.height) / 2;

      // Рисуем изображение
      ctx.drawImage(img, x, y);

      // Конвертируем в Data URL
      const dataUrl = canvas.toDataURL('image/png');

      // Очищаем Object URL если создавали
      if (element.image instanceof Blob) {
        URL.revokeObjectURL(imageSrc);
      }

      // Обновляем элементы
      const updatedElements = elements.map(el => 
        el.id === elementId ? { ...el, image: dataUrl } : el
      );

      // Обновляем sessionStorage
      if (element?.isProduct) {
        try {
          const currentMeta = JSON.parse(sessionStorage.getItem(storageMetaKey) || '{}');
          const updatedImages = currentMeta.images ? [...currentMeta.images] : [];

          if (indexImg >= 0 && indexImg < updatedImages.length) {
            updatedImages[indexImg] = dataUrl;
            sessionStorage.setItem(storageMetaKey, JSON.stringify({
              ...currentMeta,
              images: updatedImages
            }));
          }
        } catch (e) {
          console.error('Ошибка обновления sessionStorage:', e);
        }
      }

      setElements(updatedElements);

    } catch (error) {
      console.error('Ошибка добавления тени:', error);
      alert(`Ошибка: ${error.message}`);
    } finally {
      setProcessingShedowIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
    }
  };

  const handleRemoveElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  // Функция для обработки создания шаблона
  const handleCreateTemplate = () => {
    setIsTemplateModalOpen(true);
  };

  // Замените старые функции перемещения на новую
const moveElement = (fromIndex, toIndex) => {
  if (fromIndex === toIndex) return;
  const newElements = [...elements];
  const [movedElement] = newElements.splice(fromIndex, 1);
  newElements.splice(toIndex, 0, movedElement);
  setElements(newElements);
};

  // Обработчик поворота
  const handleRotate = (id, newRotation) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, rotation: newRotation } : el
    ));
  };

  const handleImageSelect = (imgUrl, index) => {
    // Находим первый image элемент
    const imageElement = elements.find(el => 
      el.type === 'image' && 
      el.isProduct
    );
    
    if (imageElement) {
      // Обновляем изображение с сохранением позиции и размеров
      setElements(prev => prev.map(el => 
        el.id === imageElement.id ? {
          ...el,
          image: imgUrl,
          isFlipped: el.isFlipped || false
        } : el
      ));
      setIndexImg(index);
    } 
  };

  const handleFlipImage = (id) => {
    setElements(prev => prev.map(el => 
      el.id === id ? {...el, isFlipped: !el.isFlipped} : el
    ));
  };

  // Добавить обработчик выбора изображения из библиотеки для компонента элемент
  const handleSelectFromLibrary = async (imageName) => {
    try {
      const img = new Image();
      img.src = `/images/${imageName}`;
      
      // Ждем загрузки изображения
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      const containerWidth = 450;
      const containerHeight = 600;
      
      // Рассчитываем масштаб с учетом оригинальных размеров
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const newWidth = img.naturalWidth * scale;
      const newHeight = img.naturalHeight * scale;
      
      // Центрируем изображение
      const position = {
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2
      };
  
      const newElement = {
        id: generateUniqueId(),
        type: 'element',
        position,
        image: `/images/${imageName}`,
        width: newWidth,
        height: newHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        isFlipped: false,
        rotation: 0
      };
  
      setElements(prev => [...prev, newElement]);
      setIsImageLibraryOpen(false);
      
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Не удалось загрузить изображение');
    }
  };

  const handleSelectImageProduct = async (imgUrl) => {
    try {
      const img = new Image();
      img.src = imgUrl;
      
      // Ждем загрузки изображения
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      const containerWidth = 450;
      const containerHeight = 600;
      
      // Рассчитываем масштаб с учетом оригинальных размеров
      const scale = Math.min(
        containerWidth / img.naturalWidth,
        containerHeight / img.naturalHeight,
        1
      );
      
      const newWidth = img.naturalWidth * scale;
      const newHeight = img.naturalHeight * scale;
      
      // Центрируем изображение
      const position = {
        x: (containerWidth - newWidth) / 2,
        y: (containerHeight - newHeight) / 2
      };
  
      const newElement = {
        id: generateUniqueId(),
        type: 'image',
        position,
        image: imgUrl,
        width: newWidth,
        height: newHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        isFlipped: false,
        rotation: 0
      };
  
      setElements(prev => [...prev, newElement]);
      setIsProductModalOpen(false);
      
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Не удалось загрузить изображение');
    }
    
  };

  // Обработчик клика правой кнопик мыши
  const handleContextMenu = (e, elementId) => {
    e.preventDefault();
    setSelectedElementId(elementId);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY
    });
  };

  // Закрытие меню
  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, visible: false });
  };
  
  // Копирование
  const handleCopy = () => {
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;

    const copied = JSON.parse(JSON.stringify(element));

    // Удаляем флаг isProduct, если он существует
    if (copied.hasOwnProperty('isProduct')) {
      delete copied.isProduct;
    }

    copied.id = generateUniqueId();
    setCopiedElement(copied);
    closeContextMenu();
  };

  // Вставка
  const handlePaste = () => {
    if (!copiedElement) return;

    const newElement = {
      ...copiedElement,
      id: generateUniqueId(),
      position: {
        x: copiedElement.position.x + 20,
        y: copiedElement.position.y + 20
      }
    };

    setElements(prev => [...prev, newElement]);
    closeContextMenu();
  };

  const handleDelete = () => {
    const element = elements.find(el => el.id === selectedElementId);
    if (!element) return;
    handleRemoveElement(element.id);
    closeContextMenu();
  };

  const handleElementClick = (elementId) => {
    setSelectedElementId(elementId);
  };

  useEffect(() => {
    // Найти индекс активного изображения
    const activeIndex = initialMetaDateElement?.images?.findIndex(img => 
      elements.some(el => el.type === 'image' && el.image === img && el.isProduct)
    ) ?? -1;

    setIndexImg(activeIndex);
  }, [elements, initialMetaDateElement?.images]);

  // Эффект для закрытия меню при клике вне его области
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenu.visible && 
        contextMenuRef.current && 
        !contextMenuRef.current.contains(event.target)
      ) {
        closeContextMenu();
      }
    };

    // Добавляем обработчик для события mousedown (срабатывает при нажатии ЛЮБОЙ кнопки мыши)
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contextMenu.visible]);

  // Обработчик горячих клавиш
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isDelete = e.code === 'Delete';
    
      if (isDelete && selectedElementId && !editingTextId) {
        e.preventDefault();
        handleRemoveElement(selectedElementId);
        return;
      }

      // Проверяем комбинации для обеих раскладок
      const isCopy = e.code === 'KeyC' || e.key.toLowerCase() === 'с'; // c - русская
      const isPaste = e.code === 'KeyV' || e.key.toLowerCase() === 'м'; // v - русская
        
      if ((e.ctrlKey || e.metaKey) && !editingTextId) {
        if (isCopy && selectedElementId) {
          e.preventDefault();
          handleCopy();
        }
        
        if (isPaste && copiedElement) {
          e.preventDefault();
          handlePaste();
        }
      }
    };
  
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleCopy, handlePaste, handleRemoveElement, selectedElementId, copiedElement, editingTextId]);
  
  return (
    <div className="generator-container">
      <HeaderSection 
        captureRef={captureRef}
        slideNumber={slideNumber}
        templates={templates}
        setTemplates={setTemplates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        loadTemplate={loadTemplate}
        handleCreateTemplate={handleCreateTemplate}
      />
      <div className="content-wrapper">
        {!isCollageMode && (
          <ProductMetaInfo 
            initialMetaDateElement={initialMetaDateElement}
          />
        )}
        
        <div className="main-content">
          {/* Панель добавления элементов */}
          <div className="element-toolbar">
            <button 
              onClick={() => handleAddElement('image')}
              title="Добавить изображение"
            >
              <FaImage size={20} />
            </button>
            <button 
              onClick={() => handleAddElement('text')}
              title="Добавить текст"
            >
              <FaFont size={20} />
            </button>
            <button 
              onClick={() => handleAddElement('shape')}
              title="Добавить фигуру"
            >
              <FaSquare size={20} />
            </button>
            <button 
              onClick={() => handleAddElement('element')}
              title="Добавить элемент"
            >
              <FaElementor size={20} />
            </button>
            <button 
              onClick={() => handleAddElement('product')}
              title="Добавить товар"
            >
              <FaPuzzlePiece size={20} />
            </button>
          </div>
        </div>
        <div className='design-area'>
          {!isCollageMode && (
            <ProductImagesGrid 
              images={initialMetaDateElement?.images}
              elements={elements}
              handleImageSelect={handleImageSelect}
            />
          )}
          <div 
            ref={captureRef} 
            className="design-container"
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault();
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);

              const files = Array.from(e.dataTransfer.files);
              const imageFile = files.find(file => file.type.startsWith('image/'));

              if (imageFile) {
                handleFileUpload(imageFile);
              }
            }}
          >
            {/* Стилизованная область для визуальной обратной связи */}
            <div className={`drop-zone ${isDragging ? 'active' : ''}`}>
              {isDragging && (
                <div className="drop-message">
                  Перетащите изображение сюда
                </div>
              )}
            </div>            
            {elements.map((element) => {
              switch (element.type) {
                case 'image':
                  return (
                    <ImageElement
                      contextMenuRef={contextMenuRef}
                      element={element}
                      key={element.id}
                      src={element.image} // Берем изображение из данных элемента
                      position={element.position}
                      width={element.width}
                      height={element.height}
                      isFlipped={element.isFlipped}
                      onDrag={(pos) => handleDrag(element.id, pos)}
                      onRemove={() => handleRemoveElement(element.id)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      rotation={element.rotation} // Передаем поворот
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      containerWidth={450}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id);
                      }}
                      selectedElementId={selectedElementId}
                      onDeselect={() => setSelectedElementId(null)}
                    />
                  );
                case 'element':
                  return (
                    <ElementsElement
                      contextMenuRef={contextMenuRef}
                      element={element}
                      key={element.id}
                      src={element.image} // Берем изображение из данных элемента
                      position={element.position}
                      width={element.width}
                      height={element.height}
                      isFlipped={element.isFlipped}
                      onDrag={(pos) => handleDrag(element.id, pos)}
                      onRemove={() => handleRemoveElement(element.id)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      rotation={element.rotation} // Передаем поворот
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      containerWidth={450}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id);
                      }}
                      selectedElementId={selectedElementId}
                      onDeselect={() => setSelectedElementId(null)}
                    />
                  );
                case 'shape':
                  return (
                    <ShapeElement
                      contextMenuRef={contextMenuRef}
                      element={element}
                      key={element.id}
                      position={element.position}
                      width={element.width}
                      height={element.height}
                      color={element.color || '#ccc'} // Добавляем цвет
                      onDrag={(pos) => handleDrag(element.id, pos)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      rotation={element.rotation} // Передаем поворот
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      containerWidth={450}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id);
                      }}
                      selectedElementId={selectedElementId}
                      onDeselect={() => setSelectedElementId(null)}
                    />
                  );
                case 'text':
                  return (
                    <TextElement
                      contextMenuRef={contextMenuRef}
                      element={element}
                      key={element.id}
                      position={element.position}
                      onDrag={(pos) => handleDrag(element.id, pos)}
                      onRemove={() => handleRemoveElement(element.id)}
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      onTextChange={(newText) => {
                        setElements(prev => prev.map(el => 
                          el.id === element.id ? {...el, text: newText} : el
                        ));
                      }}
                      isEditing={editingTextId === element.id}
                      onEditToggle={(isEditing) => handleTextEditToggle(element.id, isEditing)}
                      containerWidth={400}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElementId(element.id);
                      }}
                      selectedElementId={selectedElementId}
                      onDeselect={() => setSelectedElementId(null)}
                    />
                  );
                default:
                  return null;
              }
            })}
            {/* Контекстное меню */}
            {contextMenu.visible && (() => {
              const element = elements.find(el => el.id === selectedElementId);
              return (
                <div 
                  ref={contextMenuRef}
                  className="context-menu"
                  style={{
                    position: 'fixed',
                    left: contextMenu.x,
                    top: contextMenu.y,
                    zIndex: 1000
                  }}
                >
                  <button onClick={handleCopy}>
                    Копировать (Ctrl+C)
                  </button>
                  <button 
                    onClick={handlePaste}
                    disabled={!copiedElement}
                  >
                    Вставить (Ctrl+V)
                  </button>
                  <div className='separator'></div>
                  <button 
                    onClick={() => handleTextEditToggle(element.id, true)}
                    disabled={element?.type !== 'text'}
                  >
                    Редактировать текст
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedTextEdit(element.id);
                      closeContextMenu();
                    }}
                    disabled={element?.type !== 'text'}
                  >
                    Шрифт...
                  </button>
                  <button 
                    onClick={() => handleFlipImage(element.id)}
                    disabled={element?.type !== 'image' && element?.type !== 'element' }
                  >
                    Отобразить зеркально
                  </button>
                  
                  <button 
                    onClick={() => handleRemoveBackground(element.id)}
                    disabled={element?.type !== 'image'}
                  >
                    Удалить фон
                  </button>
                  <button 
                    onClick={() => handleColorButtonClick(element.id)}
                    disabled={element?.type !== 'shape'}
                  >
                    Изменить цвет
                  </button>
                  
                  <div className='separator'></div>

                  <button
                    className='context-delete'
                    onClick={handleDelete}
                  >
                    Удалить (Del)
                  </button>
                </div>
              );
            })()}
          </div>
        </div> 
        <DraggableElementsList 
          elements={elements}
          moveElement={moveElement}
          colorInputRef={colorInputRef}
          handleRemoveElement={handleRemoveElement}
          handleFlipImage={handleFlipImage}
          handleColorButtonClick={handleColorButtonClick}
          handleRemoveBackground={handleRemoveBackground}
          handleAddShadow={handleAddShadow}
          handleDirectionChange={handleDirectionChange}
          handleBorderRadiusChange={handleBorderRadiusChange}
          handleGradientChange={handleGradientChange}
          handleoOpacityChange={handleoOpacityChange}
          processingIds={processingIds}
          processingShedowIds={processingShedowIds}
          shadowSetting={shadowSetting}
          handleTextEditToggle={handleTextEditToggle}
          handleColorChange={handleColorChange}
          handleFontChange={handleFontChange}
          selectedElementId={selectedElementId}
          setSelectedElementId={handleElementClick}
          expandedElementId={expandedElementId}
          setExpandedElementId={setExpandedElementId}
          onPositionChange={handlePositionChange}
          onSizeChange={handleSizeChange}
          onRotationChange={handleRotationChange}
          onProportionalResize={handleProportionalResize}
        />      
      </div>  
      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        ref={fileInputRef}
        className="hidden-input"
      />
      {/* Панель настроек шрифта вне цикла элементов */}
      {selectedTextEdit && (
        <div className="font-controls-wrapper"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <FontControls
            element={elements.find(el => el.id === selectedTextEdit)}
            onClose={() => setSelectedTextEdit(null)}
            onChange={handleFontChange}
          />
        </div>
      )}     
      {isTemplateModalOpen && <TemplateModal 
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        setTemplates={setTemplates}
        setSelectedTemplate={setSelectedTemplate}
      />}
      {isImageLibraryOpen && (
        <ImageLibraryModal 
          isOpen={isImageLibraryOpen}
          onClose={() => setIsImageLibraryOpen(false)}
          onSelectImage={handleSelectFromLibrary}
        />
      )}
      {isProductModalOpen && (
        <ProductModal 
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSelectImage={handleSelectImageProduct}
        />
      )}
  </div>
  );
};
