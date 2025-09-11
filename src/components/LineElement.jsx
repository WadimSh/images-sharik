import { useRef } from 'react';
import DraggableElement from './DraggableElement';

export const LineElement = ({ 
  contextMenuRef,
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  width = 100,
  height = 2, // Толщина линии по умолчанию
  color = '#000000',
  onResize,
  rotation = 0,
  onRotate,
  onContextMenu,
  onClick,
  element,
  selectedElementId,
  selectedElementIds,
  onDeselect,
  zoom,
  captureRef
}) => {
  const containerRef = useRef(null);
  
  const handleResize = (newSize) => {
    onResize({
      width: newSize.width,
      height: newSize.height,
      x: newSize.x ?? position.x,
      y: newSize.y ?? position.y
    });
  };

  // Функция для отрисовки стрелки
  const renderArrow = (type) => {
    if (!element.lineEnds || element.lineEnds[type] !== 'arrow') return null;

    const arrowStyle = {
      position: 'absolute',
      width: '0',
      height: '0',
      borderStyle: 'solid',
      top: '50%',
      transform: 'translateY(-50%)'
    };

    const thickness = element.lineThickness || 2;
    const arrowSize = Math.max(8, thickness * 2); // Размер стрелки зависит от толщины линии

    if (type === 'start') {
      return (
        <div
          style={{
            ...arrowStyle,
            left: `-${arrowSize}px`,
            borderWidth: `${arrowSize}px ${arrowSize}px ${arrowSize}px 0`,
            borderColor: `transparent ${color} transparent transparent`,
            marginLeft: `${arrowSize - thickness}px`
          }}
        />
      );
    } else {
      return (
        <div
          style={{
            ...arrowStyle,
            right: `-${arrowSize}px`,
            borderWidth: `${arrowSize}px 0 ${arrowSize}px ${arrowSize}px`,
            borderColor: `transparent transparent transparent ${color}`,
            marginRight: `${arrowSize - thickness}px`
          }}
        />
      );
    }
  };

  return (
    <DraggableElement
      contextMenuRef={contextMenuRef}
      id={element.id}
      position={position}
      onDrag={onDrag}
      onResize={handleResize}
      onRotate={onRotate}
      resizeable={true}
      splitResizable={false} // Для линии отключаем раздельное изменение размеров
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
      <div 
        ref={containerRef}
        style={{ 
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'content-box',
          opacity: element.opacity || 1,
        }}
        onContextMenu={onContextMenu}
      >
        {/* Основная линия */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: `${element.lineThickness || 2}px`,
            backgroundColor: color,
            borderRadius: `${element.lineStyle === 'dashed' ? '2px' : '0px'}`
          }}
        />
        
        {/* Стрелка в начале линии */}
        {renderArrow('start')}
        
        {/* Стрелка в конце линии */}
        {renderArrow('end')}
      </div>
    </DraggableElement>
  );
};