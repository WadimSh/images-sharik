import { useState, useEffect } from 'react';
import DraggableElement from './DraggableElement';

export const ElementsElement = ({ 
  contextMenuRef,
  element,
  src, 
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  width = 200, // Значение по умолчанию
  height = 200, // Значение по умолчанию
  onResize,
  rotation = 0,
  onRotate,
  isFlipped = false,
  onContextMenu,
  onClick,
  selectedElementId,
  selectedElementIds,
  onDeselect,
  zoom,
  captureRef
}) => {
  const [imageSrc, setImageSrc] = useState('');
  
  useEffect(() => {
    const loadImage = async () => {
      try {
        setImageSrc(src);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    };

    loadImage();

    return () => {
      if (imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [src]);

  const handleResize = (newSize) => {
    onResize({
      width: newSize.width,
      height: newSize.height,
      x: newSize.x ?? position.x, // Сохраняем новую позицию
      y: newSize.y ?? position.y
    });
  };

  return (
    <DraggableElement
      contextMenuRef={contextMenuRef}
      id={element.id}
      isFlipped={isFlipped}
      position={position}
      onDrag={onDrag}
      onResize={handleResize}
      onRotate={onRotate}
      resizeable
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width, height }}
      rotation={rotation}
      onContextMenu={onContextMenu}
      onClick={onClick}
      selectedElementId={selectedElementId}
      selectedElementIds={selectedElementIds}
      onDeselect={onDeselect}
      zoom={zoom}
      captureRef={captureRef}
    >
      {imageSrc && <img // Добавляем проверку на наличие src
        src={imageSrc}
        alt="uploaded"
        style={{ 
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
          objectFit: 'cover',
          transform: `scaleX(${isFlipped ? -1 : 1})`,
          transformOrigin: 'center',
        }}
      />}
    </DraggableElement>
  );
};