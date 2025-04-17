import { useState, useRef } from 'react';
import DraggableElement from './DraggableElement';

export const ShapeElement = ({ 
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  width = 100, // Значение по умолчанию
  height = 100, // Значение по умолчанию
  color = '#ccc', // Получаем цвет из пропсов
  onResize,
  rotation = 0,
  onRotate,
  onDoubleClick
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: width,
    height: height 
  });
  
  const containerRef = useRef(null);
  
  const handleResize = (newSize) => {
    setDimensions(newSize);
    onResize({
      width: newSize.width,
      height: newSize.height,
      x: newSize.x ?? position.x, // Сохраняем новую позицию
      y: newSize.y ?? position.y
    });
  };
  
  return (
    <DraggableElement
      position={position}
      onDrag={onDrag}
      onResize={handleResize}
      onRotate={onRotate}
      resizeable
      splitResizable
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={dimensions}
      rotation={rotation}
      onDoubleClick={onDoubleClick}
    >
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          transform: `rotate(${rotation}deg)`,
          backgroundColor: color,
          border: 'none',
        }}
        onDoubleClick={onDoubleClick}
      >
        
      </div>
    </DraggableElement>
  );
};