import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaDownload, FaImage, FaFont, FaSquare, FaExchangeAlt, FaClipboardCheck, FaSave } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import html2canvas from 'html2canvas';
import UPNG from 'upng-js';

import { ImageElement } from '../../components/ImageElement';
import { ShapeElement } from '../../components/ShapeElement';
import { TextElement } from '../../components/TextElement';
import { FontControls } from '../../components/FontControls';

export const Generator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const captureRef = useRef(null);
  // Добавляем получение номера слайда
  const [baseId, slideNumber] = id.split('_');

  // Добавляем реф для контекстного меню
  const contextMenuRef = useRef(null);

  const [selectedColorElementId, setSelectedColorElementId] = useState(null);
  const colorInputRef = useRef(null);

  const [selectedElementId, setSelectedElementId] = useState(null);
  const [copiedElement, setCopiedElement] = useState(null);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
  });

  // Состояние для отслеживания обработки при запросе на удаление фона 
  const [processingIds, setProcessingIds] = useState(new Set());
  
  // Добавляем состояние для выбранного текстового элемента
  const [selectedTextElementId, setSelectedTextElementId] = useState(null);
  // Добавляем состояние для редактирования текста
  const [editingTextId, setEditingTextId] = useState(null);

  const storageMetaKey = `product-${baseId}`
  const savedMetaDate = sessionStorage.getItem(storageMetaKey);
  const initialMetaDateElement = savedMetaDate ? JSON.parse(savedMetaDate) : [];
 
  // Загрузка из sessionStorage при инициализации
  const storageKey = `design-${id}`;
  const savedDesign = sessionStorage.getItem(storageKey);
  const initialElements = savedDesign ? JSON.parse(savedDesign) : [];

  // Функция для формирования заголовка
  const getHeaderTitle = () => {
    const slide = slideNumber || '1'; // По умолчанию первый слайд
    return slide === '1' 
      ? 'Основной слайд' 
      : `Слайд ${slide}`;
  };

  // Добавим функцию для генерации уникальных ID
  const generateUniqueId = () => Date.now() + Math.floor(Math.random() * 1000);
 
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

  const [elements, setElements] = useState(processedElements);
  const [indexImg, setIndexImg] = useState(-1);
  const fileInputRef = useRef(null);

  // Состояния для модалки создания макетов
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [modalStep, setModalStep] = useState('input'); // 'input', 'overwrite', 'success', 'error'
  const [modalMessage, setModalMessage] = useState('');
  // Для работы с макетами
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);

  // Добавили состояние для отслеживания перетаскивания
  const [isDragging, setIsDragging] = useState(false);

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

  // Эффект для загрузки макетов при монтировании и изменении
  useEffect(() => {
    const loadTemplates = () => {
      const savedTemplates = localStorage.getItem('templatesLocal');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    };

    loadTemplates();
    // Слушаем изменения в localStorage
    window.addEventListener('storage', loadTemplates);
    return () => window.removeEventListener('storage', loadTemplates);
  }, []);

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

  // Функция для удаления макета
  const handleDeleteTemplate = (templateName) => {
    const updatedTemplates = { ...templates };
    delete updatedTemplates[templateName];
    localStorage.setItem('templatesLocal', JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
    if (selectedTemplate === templateName) setSelectedTemplate('');
  };

  // Функция выгрузки макета в одельный файл
  const handleExportTemplate = (templateName) => {
    const template = templates[templateName];
    if (!template) return;
  
    // Формируем имя файла
    const fileName = templateName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zа-яё0-9_-]/gi, '') + '.json';
  
    // Создаем JSON строку
    const json = JSON.stringify(template, null, 2);
    
    // Создаем Blob и ссылку для скачивания
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Обработчик изменения цвета
  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setElements(prev => 
      prev.map(el => 
        el.id === selectedColorElementId ? {...el, color: newColor} : el
      )
    );
  };

  // Обработчик клика по кнопке выбора цвета
  const handleColorButtonClick = (elementId) => {
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
    setElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, [property]: value } : el
      )
    );
  };

  // Обработчик переключения редактирования
  const handleTextEditToggle = (elementId, isEditing) => {
    setEditingTextId(isEditing ? elementId : null);
  };

  const handleAddElement = (type) => {
    if (type === 'image') {
      fileInputRef.current.click();
      return;
    }
    const newElement = {
      id: generateUniqueId(),
      type,
      position: { x: 50, y: 50 },
      text: type === 'text' ? 'Новый текст' : '',
      fontSize: 24,       // Добавляем по умолчанию
      color: '#333333',   // Добавляем по умолчанию
      fontFamily: 'Arial', // Добавляем по умолчанию
      fontWeight: 'normal', // Добавляем по умолчанию
      fontStyle: 'normal',  // Добавляем по умолчанию
      image: null,
      ...(type === 'shape' && { 
        color: '#ccc',
        width: 100,
        height: 100 
      })
    };
    setElements(prev => [...prev, newElement]);
  };

  const handleFileUpload = (file) => {
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Проверка максимального разрешения
        if (img.width > 2000 || img.height > 2000) {
          alert('Максимальный размер изображения 2000x2000 пикселей');
          return;
        }
  
        // Параметры контейнера
        const containerWidth = 450;
        const containerHeight = 600;
  
        // Рассчет коэффициента масштабирования
        const scale = Math.min(
          containerWidth / img.width,
          containerHeight / img.height,
          1 // Запрещаем увеличение изображения
        );
  
        // Новые размеры с сохранением пропорций
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;
  
        // Позиционирование по центру
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
    reader.readAsDataURL(file);
  };

  // Добавим новую функцию замены изображения
const handleReplaceImage = (id) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width > 2000 || img.height > 2000) {
          alert('Максимальный размер изображения 2000x2000 пикселей');
          return;
        }

        setElements(prev => prev.map(el => 
          el.id === id ? {
            ...el,
            image: event.target.result,
            originalWidth: img.width,
            originalHeight: img.height,
            isFlipped: el.isFlipped
          } : el
        ));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };
  
  input.click();
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
      if (!element || !element.image?.startsWith('http')) return;
  
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
          'Accept': 'image/png',
          'x-api-key': 'sandbox_1ba99b1a395c77e5095879519331e24781531d6e'
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
      const compression = 90; // Уровень сжатия (0-100)
            
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
  
        // Обновляем sessionStorage
        const currentMeta = JSON.parse(sessionStorage.getItem(storageMetaKey) || {});
        const updatedImages = [...currentMeta.images];
        
        if (indexImg >= 0 && indexImg < updatedImages.length) {
          updatedImages[indexImg] = compressedDataURL;
  
          sessionStorage.setItem(storageMetaKey, JSON.stringify({
            ...currentMeta,
            images: updatedImages
          }));
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
  console.log(indexImg)
  const handleRemoveElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  // Функция для обработки создания шаблона
  const handleCreateTemplate = () => {
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    try {
      const name = templateName.trim().toLowerCase();
      if (!name) return;
  
      // Получаем существующие шаблоны
      const existingTemplates = JSON.parse(localStorage.getItem('templatesLocal')) || {};
      
      // Проверка на существующий шаблон
      const existingNames = Object.keys(existingTemplates).map(n => n.toLowerCase());
      if (existingNames.includes(name)) {
        setModalStep('overwrite');
        setModalMessage('Макет с таким именем уже существует!');
        return;
      }
  
      // Логика сохранения
      const storageKey = `design-${id}`;
      const savedDesign = sessionStorage.getItem(storageKey);
      const currentDesign = savedDesign ? JSON.parse(savedDesign) : [];
  
      const modifiedDesign = currentDesign.map(element => ({
        ...element,
        image: element.type === 'image' && element.isProduct ? "{{ITEM_IMAGE}}" : element.image
      }));
  
      const updatedTemplates = {
        ...existingTemplates,
        [name]: modifiedDesign
      };
  
      localStorage.setItem('templatesLocal', JSON.stringify(updatedTemplates));
      
      // Успешное сохранение
      setModalStep('success');
      setModalMessage('Макет успешно сохранён!');

      setTemplates(updatedTemplates); // Обновляем состояние шаблонов
      setSelectedTemplate(name); // Выбираем новый шаблон
      
      // Автоматическое закрытие через 2 сек
      setTimeout(() => {
        setIsTemplateModalOpen(false);
        setModalStep('input');
        setTemplateName('');
      }, 2000);
  
    } catch (error) {
      setModalStep('error');
      setModalMessage('Ошибка при сохранении: ' + error.message);
    }
  };
  
  const handleDownload = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Формирование имени файла
      const [baseCode, slideNumber] = id.split('_');
      const slideType = slideNumber === '1' ? 'main' : `slide${slideNumber}`;
    
      const now = new Date();
      const datePart = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear()
      ].join('');
    
      const timePart = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0')
      ].join('');

      const fileName = `${baseCode}_WB_${slideType}_900x1200_${datePart}_${timePart}.png`;

      // Генерация изображения
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF' // Убираем прозрачность для уменьшения размера
      });

      // Получаем сырые данные изображения
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
      // Оптимизация с UPNG
      const pngBuffer = UPNG.encode(
        [imageData.data.buffer], // Пиксельные данные
        canvas.width,
        canvas.height,
        256, // Количество цветов (256 = 8-битная палитра)
        0    // Задержка для анимации
      );

      // Создаем Blob и URL
      const blob = new Blob([pngBuffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();

      // Очистка
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert('Ошибка при генерации изображения!');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const newElements = [...elements];
    [newElements[index - 1], newElements[index]] = [newElements[index], newElements[index - 1]];
    setElements(newElements);
  };

  const handleMoveDown = (index) => {
    if (index === elements.length - 1) return;
    const newElements = [...elements];
    [newElements[index], newElements[index + 1]] = [newElements[index + 1], newElements[index]];
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
  }, [handleCopy, handlePaste, selectedElementId, copiedElement, editingTextId]);
  
  return (
    <div className="generator-container">
      <div className="header-section">
        <button onClick={handleBack} className='button-back'>
          {'< Назад'}
        </button>
        <h2>{getHeaderTitle()}</h2>

        <div className="template-select-wrapper">
          {Object.keys(templates).length > 0 && (
            <div className="template-select-container">
              <div 
                className="template-select-header"
                onClick={() => setIsTemplateListOpen(!isTemplateListOpen)}
              >
                <span className="selected-template-text">
                  {selectedTemplate || 'Выберите макет'}
                </span>
                <span className={`arrow ${isTemplateListOpen ? 'up' : 'down'}`}></span>
              </div>

              {isTemplateListOpen && (
                <div className="template-list">
                  {Object.keys(templates).map(name => (
                    <div key={name} className="template-item">
                      <span 
                        className="template-name"
                        onClick={() => {
                          setSelectedTemplate(name);
                          loadTemplate(name);
                          setIsTemplateListOpen(false);
                        }}
                      >
                        {name}
                      </span>
                      <div className="template-buttons">
                        <button 
                          className="export-template-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportTemplate(name);
                          }}
                          title="Сохранить в файл"
                        >
                          <FaSave />
                        </button>
                        <button 
                          className="delete-template-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(name);
                          }}
                          title="Удалить макет"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      
        <button onClick={handleCreateTemplate} className="template-button">
          <FaClipboardCheck /> Создать макет
        </button>

        <button onClick={handleDownload} className="download-button">
          <FaDownload /> Скачать дизайн
        </button>
      </div>

    <div className="content-wrapper">

      <div className='meta-info'>
        <a href={initialMetaDateElement.link} className='meta-link' target="_blank" rel="noopener noreferrer">
          <h3 className='meta-title'>
            {initialMetaDateElement.code}
            <span className="meta-subtitle"> {initialMetaDateElement.name}</span>
          </h3>
        </a>
          {initialMetaDateElement.originProperties.map((item, index) => (
              <div className="meta-row" key={index}>
                  <div className="meta-col">
                      <div className="meta-subtitle">{item.name}</div>
                  </div>
                  <div className="meta-col">
                      <span className='meta-subtitle'>{item.value}</span>
                  </div>
              </div>
          ))}
          {initialMetaDateElement.properties.map((item, index) => (
              <div className="meta-row" key={index}>
                  <div className="meta-col">
                      <div className="meta-subtitle">{item.name}</div>
                  </div>
                  <div className="meta-col">
                      <span className='meta-subtitle'>{item.value}</span>
                  </div>
              </div>
          ))}
      </div>

      {/* Центральная область с элементами управления и холстом */}
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
          </div>
      </div>

    <div className='design-area'>
      {/* Секция отображения фоток товара */}
      
        <div className="images-grid">
          {initialMetaDateElement?.images?.map((img, index) => {
            const isActive = elements.some(el => 
              el.type === 'image' && el.image === img && el.isProduct
            );
            
            return (
              <div 
                key={index}
                className={`image-item ${isActive ? 'active' : ''}`}
                onClick={() => handleImageSelect(img, index)}
              >
                <img 
                  src={img} 
                  alt={`Вариант ${index + 1}`}
                  className="product-image"
                />
              </div>
            )
          })}
        </div>
      
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
                    // Скрываем все оверлеи перед показом нового
                    elements.forEach(el => {
                      if (el.id !== element.id) {
                        // Здесь должен быть механизм скрытия других оверлеев
                      }
                    });
                    setSelectedElementId(element.id);
                  }}
                />
              );
            case 'shape':
              return (
                <ShapeElement
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
                    // Скрываем все оверлеи перед показом нового
                    elements.forEach(el => {
                      if (el.id !== element.id) {
                        // Здесь должен быть механизм скрытия других оверлеев
                      }
                    });
                    setSelectedElementId(element.id);
                  }}
                />
              );
            case 'text':
              return (
                <TextElement
                  element={element}
                  key={element.id}
                  position={element.position}
                  onDrag={(pos) => handleDrag(element.id, pos)}
                  onRemove={() => handleRemoveElement(element.id)}
                  onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                  onTextChange={(newText) => {
                    setElements(prev => prev.map(el => 
                      el.id === element.id ? {...el, text: newText} : el
                    ));
                  }}
                  isEditing={editingTextId === element.id}
                  onEditToggle={(isEditing) => handleTextEditToggle(element.id, isEditing)}
                  containerWidth={450}
                  containerHeight={600}
                  onContextMenu={(e) => handleContextMenu(e, element.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Скрываем все оверлеи перед показом нового
                    elements.forEach(el => {
                      if (el.id !== element.id) {
                        // Здесь должен быть механизм скрытия других оверлеев
                      }
                    });
                    setSelectedElementId(element.id);
                  }}
                />
              );
            default:
              return null;
          }
        })}

        {/* Контекстное меню */}
        {contextMenu.visible && (
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
            <button 
              onClick={handleCopy}
            >Копировать (Ctrl+C)</button>
            <button 
              onClick={handlePaste}
              disabled={!copiedElement}
            >
              Вставить (Ctrl+V)
            </button>
          </div>
        )}
      </div>
    </div> 

      <div className="sidebar">
        <div className="elements-list">
          <h3 style={{ marginTop: '0' }}>Элементы дизайна</h3>
         {[...elements].reverse().map((element, index) => {
            const originalIndex = elements.length - 1 - index;
            return (
            <div key={element.id} className="element-item">
              <div className="element-info">
                <span>
                  {element.type === 'text' && '📝 '}
                  {element.type === 'image' && (
                    <>
                      <img 
                        src={element.image}
                        style={{
                          width: '18px',
                          height: '18px',
                          objectFit: 'cover',
                          marginRight: '4px',
                          verticalAlign: 'text-bottom',
                          borderRadius: '2px'
                        }}
                        alt="Превью"
                      />
                      
                    </>
                  )}
                  {element.type === 'shape' && (
                    <div 
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: element.color,
                        marginRight: '4px',
                        borderRadius: '2px'
                      }}
                    />
                  )}
                </span>
                {element.type === 'text' && <span className="quoted-truncate">
                  "<span className="truncated-text">{element.text}</span>"
                </span>}
                {element.type === 'image' && 'Изображение'}
                {element.type === 'shape' && 'Фигура'}
              </div>
              <div className="element-controls">
              {element.type === 'image' && (
                <button
                onClick={() => handleFlipImage(element.id)}
                className="flip-button"
                title="Зеркальное отражение"
                >
                  <FaExchangeAlt />
                </button>
              )}  
              {element.type === 'image' && (
                <button
                  onClick={() => handleReplaceImage(element.id)}
                  className="replace-button"
                  title="Заменить изображение"
                >
                  <FiRefreshCw />
                </button>
              )}

              {/* Кнопка удаления фона */}
              {element.isProduct && (
                <button
                  onClick={() => handleRemoveBackground(element.id)}
                  className="remove-bg-button"
                  title="Удалить фон"
                  disabled={processingIds.has(element.id)}
                >
                  {processingIds.has(element.id) ? (
                    <div className="spinner"></div>
                  ) : (
                    '🎭'
                  )}
                </button>
              )}

              {element.type === 'shape' && (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorButtonClick(element.id);
                }}
                  className="replace-button"
                  title="Изменения цвета"
                >
                  🎨
                </button>
              )}
              {element.type === 'text' && (
                
                    <button
                      onClick={() => setSelectedTextElementId(
                        prev => prev === element.id ? null : element.id
                      )}
                      className="font-settings-button"
                      title="Настройки шрифта"
                    >
                      Аа
                    </button>
                  
                )}
              {element.type === 'text' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextEditToggle(element.id, true);
                  }}
                  className="replace-button"
                  title="Изменения текста"
                >
                  ✎
                </button>
              )}
                <button 
                  onClick={() => handleMoveUp(originalIndex)} 
                  disabled={originalIndex === 0}
                  className="move-button"
                >
                  <FaArrowDown />
                </button>
                <button 
                  onClick={() => handleMoveDown(originalIndex)} 
                  disabled={originalIndex === elements.length - 1}
                  className="move-button"
                >
                  <FaArrowUp />
                </button>
                <button 
                  onClick={() => handleRemoveElement(element.id)}
                  className="remove-button"
                >
                  ×
                </button>
              </div>
            </div>

          )})}
          
        </div>
          <input
            type="color"
            ref={colorInputRef}
            onChange={handleColorChange}
            style={{ 
              position: 'absolute',
              left: '-220px',
              opacity: 0,
              height: 0,
              width: 0 
            }}
          />
          {/* Панель настроек шрифта вне цикла элементов */}
          {selectedTextElementId && (
          <div className="font-controls-wrapper">
            <FontControls
              element={elements.find(el => el.id === selectedTextElementId)}
              onClose={() => setSelectedTextElementId(null)}
              onChange={handleFontChange}
            />
          </div>
          )}     
        
        </div>

      </div>  

      <input
        type="file"
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        ref={fileInputRef}
        className="hidden-input"
      />

      {isTemplateModalOpen && (
        <div className="modal-overlay" onClick={() => {
          setIsTemplateModalOpen(false);
          setModalStep('input');
          setTemplateName('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {modalStep === 'input' ? (
          <>
            <h2>Создай свой макет</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Введите название макета"
              className="template-input"
              maxLength={50} // Ограничение длины
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && templateName.trim()) {
                  handleSaveTemplate();
                }
              }}
            />
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setTemplateName('');
                }}
              >
                Отменить
              </button>
              <button
                className="create-button"
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
              >
                Создать
              </button>
            </div>
            </>
      ) : modalStep === 'overwrite' ? (
        <>
          <h2>Внимание!</h2>
          <p>{modalMessage}</p>
          <div className="modal-actions">
            <button
              className="cancel-button"
              onClick={() => setModalStep('input')}
            >
              Отменить
            </button>
            <button
              className="create-button"
              onClick={() => handleSaveTemplate(true)}
            >
              Перезаписать
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>{modalStep === 'success' ? 'Успешно!' : 'Ошибка!'}</h2>
          <p>{modalMessage}</p>
          <div className="modal-actions">
            <button
              className="close-button"
              onClick={() => {
                setIsTemplateModalOpen(false);
                setModalStep('input');
                setTemplateName('');
              }}
            >
              Закрыть
            </button>
          </div>
        </>
      )}
          </div>
        </div>
      )}
    </div>
  );
};