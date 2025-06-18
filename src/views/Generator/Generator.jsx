import { useRef, useState, useEffect, useMemo, useContext } from 'react';
import { useParams } from 'react-router-dom';

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
import { CollagePreview } from '../../components/CollagePreview';
import { CollageTempleModal } from '../../components/CollageTempleModal';
import { ElementToolbar } from '../../ui/ElementToolbar';
import { useElementToolbar } from '../../ui/ElementToolbar/useElementToolbar';
import { handleFileUpload } from '../../ui/ElementToolbar/utils';

import { useMarketplace } from '../../contexts/contextMarketplace';
import { useGetCode } from '../../hooks/useGetCode';
import { slidesDB } from '../../utils/handleDB';
import { LanguageContext } from '../../contexts/contextLanguage';

export const Generator = () => {
  const { id } = useParams();
  const { t } = useContext(LanguageContext);
  const getCode = useGetCode();
  const isCollageMode = id === 'collage';
  const [baseId, slideNumber] = isCollageMode || !id ? ['', ''] : id.split('_');
  const apiKey = process.env.REACT_APP_API_KEY;

  const storageMetaKey = `product-${baseId}`
  const savedMetaDate = isCollageMode ? null : sessionStorage.getItem(storageMetaKey);
  const initialMetaDateElement = savedMetaDate ? JSON.parse(savedMetaDate) : null;
 
  // Загрузка из sessionStorage при инициализации
  const storageKey = isCollageMode 
    ? 'design-collage' 
    : `design-${id}`;
  const savedDesign = isCollageMode ? localStorage.getItem(storageKey) : sessionStorage.getItem(storageKey);
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

  const { marketplace } = useMarketplace();

  const captureRef = useRef(null);
  const contextMenuRef = useRef(null);
  const colorInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedColorElementId, setSelectedColorElementId] = useState(null);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [selectedElementIds, setSelectedElementIds] = useState([]);
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
  // Состояния для модалки создания макетов коллажей
  const [isCollageTempleModalOpen, setIsCollageTempleModalOpen] = useState(false);
  // Для работы с макетами коллажей
  const [collageTemples, setCollageTemples] = useState({});
  const [selectedCollageTemple, setSelectedCollageTemple] = useState('');
  // Добавили состояние для отслеживания перетаскивания сторонней картинки
  const [isDragging, setIsDragging] = useState(false);
  // Добавили состояние для модалки выбора изображений для элементов
  const [isImageLibraryOpen, setIsImageLibraryOpen] = useState(false);
  // Добавили состояние для модалки добавления дополнительного товара
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  // Добавили состояние для окрытия меню редактирования шрифта для контекстного меню
  const [selectedTextEdit, setSelectedTextEdit] = useState(null); // { elementId, isMulti, selectedIds }
  // Добавили состояние для раскрытия меню со свойствами компонета
  const [expandedElementId, setExpandedElementId] = useState(null);
  // Состояние для хранения настроек тени
  const [shadowSetting, setShadowSetting] = useState({
    offsetX: 20,
    offsetY: 20,
  });

  const [initialCollage] = useState(processedElements);
  
  const { handleAddElement } = useElementToolbar(
    setElements,
    fileInputRef,
    setIsImageLibraryOpen,
    setIsProductModalOpen
  );

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
    const saveData = async () => {
      if (elements.length > 0) {
        // Сохраняем данные
        if (!isCollageMode) {
          try {
            await slidesDB.put({ 
              code: `design-${id}`, 
              data: elements
            });
            sessionStorage.setItem(storageKey, JSON.stringify(elements));
          } catch (error) {
            console.error('Error saving the design:', error);
          }
        } else {
          localStorage.setItem(storageKey, JSON.stringify(elements));
        }
      } else {
        // Удаляем данные
        if (!isCollageMode) {
          try {
            await slidesDB.delete(`design-${id}`);
            sessionStorage.removeItem(storageKey);
          } catch (error) {
            console.error('Design deletion error:', error);
          }
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    };
  
    saveData();
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

  const loadCollageTemplate = (templateName) => {
    const template = collageTemples[templateName];
    
    if (!template) return;

    // Получаем данные для подстановки
    const productImages = initialCollage.filter(el => 
      el.type === 'image' && el.isProduct
    );

    const productCodes = initialCollage.filter(el => 
      el.type === 'text' && el.isProductCode
    );

    let imageIndex = 0;
    let codeIndex = 0;
    const resultElements = [];

    // Обрабатываем каждый элемент шаблона
    template.forEach(element => {
      // Для элементов с плейсхолдером изображения
      if (element.type === 'image' && element.image === "{{ITEM_IMAGE}}") {
        if (imageIndex < productImages.length) {
          const imgData = productImages[imageIndex];
          resultElements.push({
            ...element,
            image: imgData.image
          });
          imageIndex++;
        }
        // Пропускаем элемент, если данных недостаточно
      } 
      // Для элементов с плейсхолдером кода
      else if (element.type === 'text' && element.text === "{{ITEM_CODE}}") {
        if (codeIndex < productCodes.length) {
          const codeData = productCodes[codeIndex];
          resultElements.push({
            ...element,
            text: codeData.text
          });
          codeIndex++;
        }
        // Пропускаем элемент, если данных недостаточно
      } 
      // Для остальных элементов (без плейсхолдеров)
      else {
        resultElements.push(element);
      }
    });

    // Обновляем состояние и сохраняем
    setElements(resultElements);
    localStorage.setItem('design-collage', JSON.stringify(resultElements));
  };

  // Обработчик изменения цвета
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    const ids = Array.isArray(selectedColorElementId) 
      ? selectedColorElementId 
      : [selectedColorElementId];

    setElements(prev => 
      prev.map(el => 
        ids.includes(el.id) ? {...el, color: newColor, gradient: null} : el
      )
    );
  };

  // Обработчик клика по кнопке выбора цвета
  const handleColorButtonClick = (elementId) => {
    const isMulti = Array.isArray(elementId);
    const ids = isMulti ? elementId : [elementId];
    
    // Находим первый элемент для определения начального цвета
    const firstElement = elements.find(el => el.id === ids[0]);
    
    if (firstElement && colorInputRef.current) {
      // Устанавливаем значение напрямую в DOM-элемент
      colorInputRef.current.value = firstElement.color || '#ccc';
      colorInputRef.current.click();
      setSelectedColorElementId(elementId); // Сохраняем либо массив ID, либо одиночный ID
    }
  };
  
  // Обработчик изменений параметров шрифта
  const handleFontChange = (elementId, property, value) => {
    setElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, [property]: value } : el
      )
    );
  };

  // Обработчик изменений параметров шрифта для множественного выделения
  const handleFontChangeMulti = (elementIds, property, value) => {
    // Преобразуем в массив, если передана строка (для обратной совместимости)
    const ids = Array.isArray(elementIds) ? elementIds : [elementIds];

    setElements(prev => 
      prev.map(el => {
        if (ids.includes(el.id)) {
          // Для свойств fontWeight и fontStyle нужна специальная логика переключения
          if (property === 'fontWeight') {
            return { ...el, fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' };
          }
          if (property === 'fontStyle') {
            return { ...el, fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' };
          }
          // Для остальных свойств просто устанавливаем значение
          return { ...el, [property]: value };
        }
        return el;
      })
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

  const handleDrag = (id, newPosition, delta) => {
    // Получаем все выбранные ID
    const allSelectedIds = [
      ...(selectedElementId ? [selectedElementId] : []),
      ...selectedElementIds
    ];

    // Если есть множественное выделение и перетаскиваемый элемент в нем
    if (allSelectedIds.length > 1 && allSelectedIds.includes(id) && delta) {
      // Обновляем позиции всех выбранных элементов на величину смещения мыши
      setElements(prev => prev.map(el => {
        if (allSelectedIds.includes(el.id)) {
          return {
            ...el,
            position: {
              x: el.position.x + delta.deltaX,
              y: el.position.y + delta.deltaY
            }
          };
        }
        return el;
      }));
    } else {
      // Стандартная логика для одиночного элемента
      setElements(prev => prev.map(el => {
        if (el.id === id) {
          return {
            ...el,
            position: newPosition
          };
        }
        return el;
      }));
    }
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
      
      if (!apiResponse.ok) throw new Error('API error');
      
      // Конвертируем ответ в ArrayBuffer
      const processedBlob = await apiResponse.blob();

      // Конвертируем в Data URL
      const reader = new FileReader();
      reader.readAsDataURL(processedBlob);
      
      reader.onloadend = () => {
        const compressedDataURL = reader.result;
        
        // Обновляем элементы и метаданные
        const updatedElements = elements.map(el => 
          el.id === elementId ? { ...el, image: compressedDataURL } : el
        );
  
        setElements(updatedElements);
      };
  
    } catch (error) {
      console.error('Error:', error);
      alert(`Image processing error: ${error.message}`);
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
    }
  };

  // Функция добавления тени
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
        img.onerror = (e) => reject(new Error('Failed to upload image'));
      });

      // Параметры тени (можно вынести в настройки)
      const shadowSettings = {
        color: 'rgba(0,0,0,0.3)',
        blur: 15,
        offsetX: shadowSetting.offsetX,
        offsetY: shadowSetting.offsetY,
        padding: 80
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

      setElements(updatedElements);

    } catch (error) {
      console.error('Error:', error);
      alert(`Shadow addition error: ${error.message}`);
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

  const handleCreateCollageTemple = () => {
    setIsCollageTempleModalOpen(true);
  }

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
    } else {
      // Создаем новый элемент с изображением и текстом
      const img = new Image();
      img.src = imgUrl;
    
      img.onload = () => {
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

        // Создаем элемент изображения
        const newImageElement = {
          id: generateUniqueId(),
          type: 'image',
          position,
          image: imgUrl,
          width: newWidth,
          height: newHeight,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          isFlipped: false,
          rotation: 0,
          isProduct: true
        }
        setElements(prev => [...prev, newImageElement]);
        setIndexImg(index);
      }

      img.onerror = () => {
      console.error('Error loading image');
      alert('Couldn`t upload image');
    };
  } 
  };

  const handleProductSelect = (item) => {
    const newElements = [...elements];

    // Восстанавливаем изображение если оно было удалено
    if (!elements.some(el => el.id === item.imageId)) {
      newElements.push({
        id: item.imageId,
        type: "image",
        position: item.imagePosition,
        image: item.imageUrl,
        width: item.imageWidth,
        height: item.imageHeight,
        originalWidth: item.originalWidth,
        originalHeight: item.originalHeight,
        isProduct: true
      });
    }

    // Восстанавливаем код если он был удален
    if (item.codeId && !elements.some(el => el.id === item.codeId)) {
      newElements.push({
        id: item.codeId,
        type: "text",
        position: item.codePosition,
        text: item.productCode,
        fontSize: item.fontSize,
        color: item.textColor,
        fontFamily: item.fontFamily,
        isProductCode: true
      });
    }

    if (newElements.length > elements.length) {
      setElements(newElements);
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
      alert('Couldn`t upload image');
    }
  };

  const handleSelectImageProduct = async (imgUrl, productCode) => {
    try {
      const img = new Image();
      img.src = imgUrl;
      const code = getCode(productCode, marketplace);
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
  
      const imageElement = {
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

      const textElement = {
        id: generateUniqueId(),
        type: 'text',
        position: {
          x: position.x + (newWidth - 128) / 2, // Центрируем по ширине изображения
          y: position.y + newHeight - 30        // Размещаем внизу изображения
        },
        text: code,
        fontSize: 28,
        color: "#333333",
        fontFamily: "HeliosCond"
      }
  
      setElements(prev => [...prev, imageElement, textElement]);
      setIsProductModalOpen(false);
      
    } catch (error) {
      console.error('Error loading image:', error);
      alert('Couldn`t upload image');
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
    // Собираем все выбранные элементы (из единичного выделения и массива)
    const elementIds = new Set([
      ...(selectedElementId ? [selectedElementId] : []),
      ...selectedElementIds
    ]);

    const elementsToCopy = elements.filter(el => elementIds.has(el.id));
    if (elementsToCopy.length === 0) return;

    const copiedElements = elementsToCopy.map(element => {
      const copied = JSON.parse(JSON.stringify(element));
      // Удаляем флаг isProduct, если он существует
      if (copied.hasOwnProperty('isProduct')) {
        delete copied.isProduct;
      }
      copied.id = generateUniqueId();
      return copied;
    });

    setCopiedElement(copiedElements);
    closeContextMenu();
  };

  // Вставка
  const handlePaste = () => {
    if (!copiedElement || !Array.isArray(copiedElement)) return;

    const newElements = copiedElement.map((element, index) => ({
      ...element,
      id: generateUniqueId(),
      position: {
        x: element.position.x + 20,
        y: element.position.y + 20
      }
    }));

    setElements(prev => [...prev, ...newElements]);
    closeContextMenu();
  };

  const handleDelete = () => {
    // Собираем все выбранные элементы (из единичного выделения и массива)
    const elementIds = new Set([
      ...(selectedElementId ? [selectedElementId] : []),
      ...selectedElementIds
    ]);

    if (elementIds.size === 0) return;

    setElements(prev => prev.filter(el => !elementIds.has(el.id)));
    setSelectedElementId(null);
    setSelectedElementIds([]);
    closeContextMenu();
  };

  const handleElementClick = (elementId) => {
    setSelectedElementId(elementId);
  };

  const areAllSelectedText = useMemo(() => {
    const allSelectedIds = [
      ...(selectedElementId ? [selectedElementId] : []),
      ...selectedElementIds
    ];
    
    if (allSelectedIds.length <= 1) return false;
    
    return elements.every(el => 
      allSelectedIds.includes(el.id) ? el.type === 'text' : true
    );
  }, [selectedElementId, selectedElementIds, elements]);

  const areAllSelectedShape = useMemo(() => {
    const allSelectedIds = [
      ...(selectedElementId ? [selectedElementId] : []),
      ...selectedElementIds
    ];
    
    if (allSelectedIds.length <= 1) return false;
    
    return elements.every(el => 
      allSelectedIds.includes(el.id) ? el.type === 'shape' : true
    );
  }, [selectedElementId, selectedElementIds, elements]);

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
    
      // Проверяем есть ли выделенные элементы (единичное или множественное выделение)
      const hasSelectedElements = selectedElementId || selectedElementIds.length > 0;
    
      if (isDelete && hasSelectedElements && !editingTextId) {
        e.preventDefault();
        handleDelete();
        return;
      }

      // Проверяем комбинации для обеих раскладок
      const isCopy = e.code === 'KeyC' || e.key.toLowerCase() === 'с'; // c - русская
      const isPaste = e.code === 'KeyV' || e.key.toLowerCase() === 'м'; // v - русская
        
      if ((e.ctrlKey || e.metaKey) && !editingTextId) {
        if (isCopy && hasSelectedElements) {
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
  }, [handleCopy, handlePaste, handleDelete, selectedElementId, selectedElementIds, copiedElement, editingTextId]);
  
  return (
    <div className="generator-container">
      <HeaderSection 
        captureRef={captureRef}
        slideNumber={slideNumber}
        templates={templates}
        setTemplates={setTemplates}
        selectedTemplate={selectedTemplate}
        setSelectedTemplate={setSelectedTemplate}
        collageTemples={collageTemples}
        setCollageTemples={setCollageTemples}
        selectedCollageTemple={selectedCollageTemple}
        setSelectedCollageTemple={setSelectedCollageTemple}
        loadTemplate={loadTemplate}
        loadCollageTemplate={loadCollageTemplate}
        handleCreateTemplate={handleCreateTemplate}
        handleCreateCollageTemple={handleCreateCollageTemple}
      />
      <div className="content-wrapper">
        {(!isCollageMode && initialMetaDateElement !== null) && (
          <ProductMetaInfo 
            initialMetaDateElement={initialMetaDateElement}
          />
        )}
        
        <div className="main-content">
          {/* Панель добавления элементов */}
          <ElementToolbar onAddElement={handleAddElement} />
        </div>
        <div className='design-area'>
          {(!isCollageMode && initialMetaDateElement !== null) ? (
            <ProductImagesGrid 
              images={initialMetaDateElement?.images}
              elements={elements}
              handleImageSelect={handleImageSelect}
            />
          ) : (
            <CollagePreview
              initialElements={initialCollage} // Передаем исходные элементы
              onItemClick={handleProductSelect}
            />
          )}

          <div 
            ref={captureRef} 
            className="design-container"
            onClick={(e) => {
              // Проверяем, не происходит ли клик внутри панели шрифтов
              const fontControlsWrapper = document.querySelector('.font-controls-wrapper');
              if (fontControlsWrapper && fontControlsWrapper.contains(e.target)) {
                return;
              }
              closeContextMenu();
              setSelectedElementId(null);
              setSelectedElementIds([]);
            }}
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
                handleFileUpload(imageFile, setElements);
              }
            }}
          >
            {/* Стилизованная область для визуальной обратной связи */}
            <div className={`drop-zone ${isDragging ? 'active' : ''}`}>
              {isDragging && (
                <div className="drop-message">
                  {t('views.generatorMessageInput')}
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
                      onDrag={(pos, delta) => handleDrag(element.id, pos, delta)}
                      onRemove={() => handleRemoveElement(element.id)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      rotation={element.rotation} // Передаем поворот
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      containerWidth={450}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          setSelectedElementIds(prev => [...prev, element.id]);
                        } else {
                          setSelectedElementId(element.id);
                        }
                      }}
                      selectedElementId={selectedElementId}
                      selectedElementIds={selectedElementIds}
                      onDeselect={() => {
                        setSelectedElementId(null);
                        setSelectedElementIds([]);
                      }}
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
                      onDrag={(pos, delta) => handleDrag(element.id, pos, delta)}
                      onRemove={() => handleRemoveElement(element.id)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      rotation={element.rotation} // Передаем поворот
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      containerWidth={450}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          setSelectedElementIds(prev => [...prev, element.id]);
                        } else {
                          setSelectedElementId(element.id);
                        }
                      }}
                      selectedElementId={selectedElementId}
                      selectedElementIds={selectedElementIds}
                      onDeselect={() => {
                        setSelectedElementId(null);
                        setSelectedElementIds([]);
                      }}
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
                      onDrag={(pos, delta) => handleDrag(element.id, pos, delta)}
                      onResize={(newSize) => handleResizeWithPosition(element.id, newSize)}
                      rotation={element.rotation} // Передаем поворот
                      onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                      containerWidth={450}
                      containerHeight={600}
                      onContextMenu={(e) => handleContextMenu(e, element.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (e.shiftKey) {
                          setSelectedElementIds(prev => [...prev, element.id]);
                        } else {
                          setSelectedElementId(element.id);
                        }
                      }}
                      selectedElementId={selectedElementId}
                      selectedElementIds={selectedElementIds}
                      onDeselect={() => {
                        setSelectedElementId(null);
                        setSelectedElementIds([]);
                      }}
                    />
                  );
                case 'text':
                  return (
                    <TextElement
                      contextMenuRef={contextMenuRef}
                      element={element}
                      key={element.id}
                      position={element.position}
                      onDrag={(pos, delta) => handleDrag(element.id, pos, delta)}
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
                        if (e.shiftKey) {
                          setSelectedElementIds(prev => [...prev, element.id]);
                        } else {
                          setSelectedElementId(element.id);
                        }
                      }}
                      selectedElementId={selectedElementId}
                      selectedElementIds={selectedElementIds}
                      onDeselect={() => {
                        setSelectedElementId(null);
                        setSelectedElementIds([]);
                      }}
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
                    {t('views.generatorMenuCopy')}
                  </button>
                  <button 
                    onClick={handlePaste}
                    disabled={!copiedElement}
                  >
                    {t('views.generatorMenuPaste')}
                  </button>
                  
                  <div className='separator'/>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTextEditToggle(element.id, true);
                    }}
                    disabled={selectedElementIds.length > 0 || element?.type !== 'text'}
                    className="remove-bg-button"
                  >
                    {t('views.generatorMenuTextEdit')}
                  </button>
                  
                  <button 
                    onClick={() => {
                      setSelectedTextEdit({
                        elementId: element.id,
                        isMulti: areAllSelectedText,
                        selectedIds: selectedElementIds
                      });
                      closeContextMenu();
                    }}
                    disabled={
                      (selectedElementIds.length === 0 && element?.type !== 'text') || 
                      (selectedElementIds.length > 0 && !areAllSelectedText)
                    }
                  >
                    {t('views.generatorMenuFont')}
                  </button>

                  <button 
                    onClick={() => handleFlipImage(element.id)}
                    disabled={selectedElementIds.length > 0 || (element?.type !== 'image' && element?.type !== 'element')}
                  >
                    {t('views.generatorMenuFlipImage')}
                  </button>
                  
                  <button 
                    onClick={() => handleRemoveBackground(element.id)}
                    disabled={selectedElementIds.length > 0 || element?.type !== 'image'}
                  >
                    {t('views.generatorMenuRemoveBackground')}
                  </button>

                  <button 
                    onClick={() => handleColorButtonClick(areAllSelectedShape ? selectedElementIds : element.id)}
                    disabled={
                      (selectedElementIds.length === 0 && element?.type !== 'shape') || 
                      (selectedElementIds.length > 0 && !areAllSelectedShape)
                    }
                  >
                    {t('views.generatorMenuChangeColor')}
                  </button>
                                   
                  <div className='separator'></div>

                  <button
                    className='context-delete'
                    onClick={handleDelete}
                  >
                    {t('views.generatorMenuDelete')}
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
          selectedElementIds={selectedElementIds}
          setSelectedElementIds={setSelectedElementIds}
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
        onChange={(e) => handleFileUpload(e.target.files[0], setElements)}
        ref={fileInputRef}
        className="hidden-input"
      />
      {/* Панель настроек шрифта вне цикла элементов */}
      {selectedTextEdit && (
        <div 
          className="font-controls-wrapper"
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
          onClick={(e) => e.stopPropagation()} // Предотвращаем всплытие события
        >
          <FontControls
            element={elements.find(el => el.id === selectedTextEdit.elementId)}
            isMulti={selectedTextEdit.isMulti}
            selectedElementIds={selectedTextEdit.selectedIds}
            onClose={() => setSelectedTextEdit(null)}
            onChange={handleFontChange}
            onChangeMulti={handleFontChangeMulti}
            elements={elements}
          />
        </div>
      )}  
      {isCollageTempleModalOpen && <CollageTempleModal 
        setIsCollageTempleModalOpen={setIsCollageTempleModalOpen}
        setCollageTemples={setCollageTemples}
        setSelectedCollageTemple={setSelectedCollageTemple}
      />}
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
