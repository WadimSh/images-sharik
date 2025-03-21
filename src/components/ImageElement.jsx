import { useState } from 'react';
import DraggableElement from './DraggableElement';

export const ImageElement = ({ 
  src, 
  position, 
  onDrag, 
  onRemove, 
  containerWidth, 
  containerHeight 
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: 200, 
    height: 200 
  });

  const handleResize = (newSize) => {
    setDimensions({
      width: newSize.width,
      height: newSize.height
    });
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
      
    </DraggableElement>
  );
};