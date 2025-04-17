import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaDownload, FaImage, FaFont, FaSquare, FaExchangeAlt } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import html2canvas from 'html2canvas';

import { ImageElement } from '../../components/ImageElement';
import { ShapeElement } from '../../components/ShapeElement';
import { TextElement } from '../../components/TextElement';
import { FontControls } from '../../components/FontControls';

export const Generator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const captureRef = useRef(null);
  const baseId = id.split('_')[0];

  const [selectedColorElementId, setSelectedColorElementId] = useState(null);
  const colorInputRef = useRef(null);
  
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
  const [selectedElementType, setSelectedElementType] = useState('');
  const fileInputRef = useRef(null);

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
      setSelectedElementType('');
      return;
    }
    const newElement = {
      id: Date.now(),
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
    setSelectedElementType('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
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
        setSelectedElementType('');
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

  const handleRemoveElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
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

      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
  
      const link = document.createElement('a');
      link.download = fileName;
      link.href = canvas.toDataURL('image/png');
      link.click();
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

  const handleImageSelect = (imgUrl) => {
    // Находим первый image элемент
    const imageElement = elements.find(el => 
      el.type === 'image' && 
      el.image?.startsWith('https://')
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
    } 
  };

  const handleFlipImage = (id) => {
    setElements(prev => prev.map(el => 
      el.id === id ? {...el, isFlipped: !el.isFlipped} : el
    ));
  };
  
  return (
    <div className="generator-container">
      <div className="header-section">
        <button onClick={handleBack} className='button-back'>
          {'< Назад'}
        </button>
        <h2>Генератор изображений для маркетплейсов</h2>
      
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
              el.type === 'image' && el.image === img
            );

            return (
              <div 
                key={index}
                className={`image-item ${isActive ? 'active' : ''}`}
                onClick={() => handleImageSelect(img)}
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
      


      <div ref={captureRef} className="design-container">
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
                />
              );
            default:
              return null;
          }
        })}
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
                <span className="element-type">
                  {element.type === 'text' && '📝 '}
                  {element.type === 'image' && (
                    <>
                      <img 
                        src={element.image} // URL вашего изображения
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
                      Изображение
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
        onChange={handleFileUpload}
        ref={fileInputRef}
        className="hidden-input"
      />

    </div>
  );
};