import { useState, useEffect } from 'react';
import DraggableElement from './DraggableElement';
import item from '../assets/item.jpg'

export const ImageElement = ({ 
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
  onDeselect
}) => {
  const [imageSrc, setImageSrc] = useState('');
  const [dimensions, setDimensions] = useState({ 
    width: width,
    height: height 
  });

  useEffect(() => {
    const loadImage = async () => {
      try {
        if (src.startsWith('https')) {
          const response = await fetch(src);
          const blob = await response.blob();
          const objectURL = URL.createObjectURL(blob);
          setImageSrc(objectURL);
        } else {
          setImageSrc(src);
        }
      } catch (error) {
        console.error('Error loading image:', error);
        setImageSrc(item); // или установить fallback изображение
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
      onDeselect={onDeselect}
    >
      {imageSrc && <img // Добавляем проверку на наличие src
        src={imageSrc}
        alt="uploaded"
        style={{ 
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
          pointerEvents: 'none',
          objectFit: 'cover',
          transform: `rotate(${rotation}deg) scaleX(${isFlipped ? -1 : 1})`,
          transformOrigin: 'center',
        }}
      />}
    </DraggableElement>
  );
};