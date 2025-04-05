import { useState } from 'react';
import DraggableElement from './DraggableElement';

export const ImageElement = ({ 
  src, 
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  width = 200, // Значение по умолчанию
  height = 200, // Значение по умолчанию
  onResize,
  rotation = 0,
  onRotate
}) => {
  const [dimensions, setDimensions] = useState({ 
    width: width,
    height: height 
  });

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
      resizeable={true}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width, height }}
      rotation={rotation}
    >
      {src && <img // Добавляем проверку на наличие src
        src={src}
        alt="uploaded"
        style={{ 
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          pointerEvents: 'none',
          objectFit: 'cover',
          transform: `rotate(${rotation}deg)`
        }}
      />}
    </DraggableElement>
  );
};