import { useRef } from 'react';

import DraggableElement from './DraggableElement';
import { hexToRgba } from '../utils/hexToRgba';

export const ShapeElement = ({ 
  contextMenuRef,
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
  onContextMenu,
  onClick,
  element,
  selectedElementId,
  onDeselect
}) => {
  const containerRef = useRef(null);
  
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
      position={position}
      onDrag={onDrag}
      onResize={handleResize}
      onRotate={onRotate}
      resizeable
      splitResizable
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width, height }}
      rotation={rotation}
      onContextMenu={onContextMenu}
      onClick={onClick}
      selectedElementId={selectedElementId}
      onDeselect={onDeselect}
    >
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          transform: `rotate(${rotation}deg)`,
          background: element.gradient 
            ? `linear-gradient(${element.gradient.direction}, 
              ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])} ${element.gradient.start}%, 
              ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])} 100%)`
            : color,
          border: 'none',
          opacity: element.opacity,
          borderRadius: `${element.borderRadius?.topLeft || 0}px ${element.borderRadius?.topRight || 0}px 
                 ${element.borderRadius?.bottomRight || 0}px ${element.borderRadius?.bottomLeft || 0}px`
        }}
        onContextMenu={onContextMenu}
      >
        
      </div>
    </DraggableElement>
  );
};