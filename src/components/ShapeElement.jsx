import { useState, useRef } from 'react';
import DraggableElement from './DraggableElement';

export const ShapeElement = ({ position, onDrag, onRemove, containerWidth, containerHeight }) => {
  const [dimensions, setDimensions] = useState({ 
    width: 100, 
    height: 100 
  });
  const [color, setColor] = useState('#ccc');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorInputRef = useRef(null);
  const containerRef = useRef(null);

  const handleResize = (newSize) => {
    setDimensions({
      width: newSize.width,
      height: newSize.height
    });
  };

  const handleColorChange = (e) => {
    setColor(e.target.value);
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
      onRemove={onRemove}
      onResize={handleResize}
      resizeable={true}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
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
            top: '50%',
            right: '-300px',
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