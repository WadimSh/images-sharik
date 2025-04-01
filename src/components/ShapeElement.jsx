import { useState, useRef } from 'react';
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
  rotation = 0,
  onRotate,
  onColorChange // Новый обработчик изменения цвета
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: width,
    height: height 
  });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef(null);
  const containerRef = useRef(null);

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
      onRotate={onRotate}
      resizeable={true}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width, height }}
      rotation={rotation}
    >
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: `rotate(${rotation}deg)`
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