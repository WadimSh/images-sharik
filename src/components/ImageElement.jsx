import { useState } from 'react';
import DraggableElement from './DraggableElement';

export const ImageElement = ({ 
  src, 
  position, 
  onDrag, 
  onRemove, 
  containerWidth, 
  containerHeight,
  width = 200, // Значение по умолчанию
  height = 200, // Значение по умолчанию
  onResize
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: width,
    height: height 
  });

  const handleResize = (newSize) => {
    setDimensions(newSize);
    onResize(newSize);
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
      {src && <img // Добавляем проверку на наличие src
        src={src}
        alt="uploaded"
        style={{ 
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          pointerEvents: 'none',
          objectFit: 'contain'
        }}
      />}
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
    </DraggableElement>
  );
};