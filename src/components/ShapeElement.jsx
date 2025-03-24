import { useState, useRef, useEffect } from 'react';
import DraggableElement from './DraggableElement';

export const ShapeElement = ({ 
  position, 
  onDrag, 
  onRemove, 
  containerWidth, 
  containerHeight,
  width = 100, // Значение по умолчанию
  height = 100, // Значение по умолчанию
  color = '#ccc', // Получаем цвет из пропсов
  onResize,
  onColorChange // Новый обработчик изменения цвета
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: width,
    height: height 
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef(null);
  const containerRef = useRef(null);

  // Синхронизируем внутреннее состояние с пропсами
  useEffect(() => {
    setDimensions({ width, height });
  }, [width, height]);

  const handleResize = (newSize) => {
    setDimensions(newSize);
    onResize(newSize);
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    onColorChange(newColor); // Пробрасываем изменение вверх
    setShowColorPicker(false);
  };

  const handleColorButtonClick = (e) => {
    e.stopPropagation();
    colorInputRef.current.click();
  };

  return (
    <DraggableElement
      position={position}
      onDrag={onDrag}
      onResize={handleResize}
      resizeable={true}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width, height }}
    >
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
        onMouseEnter={() => setShowColorPicker(true)}
        onMouseLeave={() => setShowColorPicker(false)}
      >
        {/* Основной квадрат */}
        <div
          style={{ 
            width: '100%',
            height: '100%',
            backgroundColor: color,
            border: 'none',
          }}
        />
        {/* Кнопка удаления */}
        <button 
              className='remove-handle'
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              ×
            </button>
        {/* Кнопка выбора цвета */}
        {showColorPicker && (
          <button 
            onClick={handleColorButtonClick}
            className='color-change'
          >
            🎨
          </button>
        )}

        {/* Скрытый инпут */}
        <input
          type="color"
          ref={colorInputRef}
          onChange={handleColorChange}
          style={{ 
            position: 'absolute',
            top: '5%',
            right: '-40px',
            opacity: 0,
            pointerEvents: 'none',
            width: '0',
            height: '0'
          }}
        />
      </div>
    </DraggableElement>
  );
};