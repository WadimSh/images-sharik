import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowUp, FaArrowDown, FaDownload } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import html2canvas from 'html2canvas';

import { ImageElement } from '../../components/ImageElement';
import { ShapeElement } from '../../components/ShapeElement';
import { TextElement } from '../../components/TextElement';

export const Generator = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const captureRef = useRef(null);

  const [selectedColorElementId, setSelectedColorElementId] = useState(null);
  const colorInputRef = useRef(null);

  // Добавляем состояние для редактирования текста
  const [editingTextId, setEditingTextId] = useState(null);

  // Загрузка из sessionStorage при инициализации
  const storageKey = `design-${id}`;
  const savedDesign = sessionStorage.getItem(storageKey);
  const initialElements = savedDesign ? JSON.parse(savedDesign) : [];

  // Добавляем размеры по умолчанию для старых данных
  const processedElements = initialElements.map(element => {
    if (element.type === 'image' && !element.width) {
      return {
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
          originalHeight: img.height
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
            originalHeight: img.height
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
    setElements(elements.map(el => 
      el.id === id ? { ...el, position: newPosition, rotation: newRotation !== undefined ? newRotation : el.rotation } : el
    ));
  };

  const handleRemoveElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const handleDownload = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false
      });
  
      const link = document.createElement('a');
      link.download = 'design.png';
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

  return (
    <div className="generator-container">
      <div className="header-section">
        <button 
            onClick={handleBack}
            className='button-back'
          >
          {'< Назад'}
         </button>
        <h2>Генератор изображений для маркетплейсов</h2>
        <p style={{
          fontSize: '16px',
          color: 'rgba(0,0,0,0.7)',
          marginBottom: '18px'
        }}>Обратите внимание, что перед тем, как изображение будет готово, у вас есть возможность<br />  
        самостоятельно внести изменения в финальный вариант.</p>
        
        <div className="controls-group">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden-input"
          />

          <select 
            value={selectedElementType}
            onChange={(e) => {
              const type = e.target.value;
              setSelectedElementType(type);
              if (type) handleAddElement(type);
            }}
            className="element-selector"
          >
            <option value="" disabled hidden>Добавить элемент...</option>
            <option value="image">Изображение</option>
            <option value="text">Текст</option>
            <option value="shape">Квадрат</option>
          </select>
        </div>
      </div>
    <div className="content-wrapper">
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
                  onDrag={(pos) => handleDrag(element.id, pos)}
                  onRemove={() => handleRemoveElement(element.id)}
                  onResize={(newSize) => {
                    setElements(prev => prev.map(el => 
                      el.id === element.id ? {...el, ...newSize} : el
                    ));
                  }}
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
                  onResize={(newSize) => {
                    setElements(prev => prev.map(el => 
                      el.id === element.id ? {...el, ...newSize} : el
                    ));
                  }}
                  rotation={element.rotation} // Передаем поворот
                  onRotate={(newRotation) => handleRotate(element.id, newRotation)}
                  
                  containerWidth={450}
                  containerHeight={600}
                />
              );
            case 'text':
              return (
                <TextElement
                  key={element.id}
                  text={element.text}
                  position={element.position}
                  onDrag={(pos) => handleDrag(element.id, pos)}
                  onRemove={() => handleRemoveElement(element.id)}
                  rotation={element.rotation} // Передаем поворот
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

      <div className="sidebar">
        <div className="elements-list">
          <h3>Элементы дизайна</h3>
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
                {element.type === 'text' && <span> "{element.text}"</span>}
                {element.type === 'shape' && 'Фигура'}
              </div>
              <div className="element-controls">
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
              <input
  type="color"
  ref={colorInputRef}
  onChange={handleColorChange}
  style={{ 
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0 
  }}
/>
            </div>
          )})}
        </div>

        <button 
          onClick={handleDownload} 
          className="download-button"
        >
          <FaDownload /> Скачать дизайн
        </button>
      </div>
    </div>  

      
    </div>
  );
};