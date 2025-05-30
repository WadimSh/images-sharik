import { useState, useRef, useEffect } from 'react';

const DraggableElement = ({ 
  contextMenuRef,
  children, 
  id,
  selectedElementId,
  position, 
  onDrag, 
  onResize,
  onRotate,
  resizeable,
  splitResizable,
  dimensions = null,
  rotation = 0,
  onContextMenu,
  onClick,
  onDeselect,
  hideOverlay = false
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(rotation);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);
  const rotateHandleRef = useRef(null);
  const initialSize = useRef({ width: dimensions?.width, height: dimensions?.height });
  
  const overlayRef = useRef(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    setCurrentRotation(rotation);
  }, [rotation]);

  const updateOverlayPosition = () => {
    if (!elementRef.current || !overlayRef.current) return;
    
    const element = elementRef.current;
    const overlay = overlayRef.current;
    
    // Синхронизируем размеры с текущими значениями из DOM
    overlay.style.width = `${element.offsetWidth}px`;
    overlay.style.height = `${element.offsetHeight}px`;
    
    // Обновляем позицию после изменения размеров
    const rect = element.getBoundingClientRect();
    overlay.style.left = `${rect.left}px`;
    overlay.style.top = `${rect.top}px`;
  };

  useEffect(() => {
  if (selectedElementId === null || hideOverlay) {
    setIsOverlayVisible(false);
    return;
  }

  if (id === selectedElementId) {
    // Добавляем задержку для корректного позиционирования
    requestAnimationFrame(() => {
      updateOverlayPosition();
      setIsOverlayVisible(true);
    });
  } else {
    setIsOverlayVisible(false);
  }
}, [selectedElementId, id, position, dimensions, hideOverlay]);

  // Клик вне элемента
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (elementRef.current && 
          !elementRef.current.contains(e.target) && 
          !contextMenuRef.current?.contains(e.target)) { // Игнорируем клики по меню
        setIsOverlayVisible(false);
        onDeselect?.();
      }
    };
    
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, []);

  // Обработка скролла
  useEffect(() => {
    const handleScroll = () => {
      setIsOverlayVisible(false);
      onDeselect?.();
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleRotateStart = (e) => {
    if (!isOverlayVisible) return;
    e.stopPropagation();
    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width/2;
    const centerY = rect.top + rect.height/2;
    
    const startAngle = Math.atan2(
      e.clientY - centerY,
      e.clientX - centerX
    );
    
    const handleMouseMoveR = (e) => {
      const angle = Math.atan2(
        e.clientY - centerY,
        e.clientX - centerX
      ) - startAngle;
      
      const newRotation = (currentRotation + angle * (180/Math.PI)) % 360;
      setCurrentRotation(newRotation);
      onRotate?.(newRotation);
      updateOverlayPosition();
    };

    const handleMouseUpR = () => {
      document.removeEventListener('mousemove', handleMouseMoveR);
      document.removeEventListener('mouseup', handleMouseUpR);
    };

    document.addEventListener('mousemove', handleMouseMoveR);
    document.addEventListener('mouseup', handleMouseUpR);
  };

  const handleProportionalResize = (e, direction) => {
    if (!isOverlayVisible) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = elementRef.current.getBoundingClientRect();
    initialSize.current = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY,
      direction,
      aspectRatio: rect.width / rect.height,
      startX: rect.left,
      startY: rect.top
    };
    setIsResizing(true);

    // Обновляем размеры в родительском компоненте
    onResize?.({
      width: rect.width,
      height: rect.height,
      x: position.x,
      y: position.y
    });
  };
  
  const handleDirectionalResize = (e, direction) => {
    if (!isOverlayVisible) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = elementRef.current.getBoundingClientRect();
    initialSize.current = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY,
      direction
    };
    setIsResizing(true);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0 || isResizing) return;
    
    const rect = elementRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setIsOverlayVisible(true);
    updateOverlayPosition();
  };

  const handleMouseMove = (e) => {
    if (isResizing) {
      const deltaX = e.clientX - initialSize.current.x;
      const deltaY = e.clientY - initialSize.current.y;
  
      // Новая логика для угловых пропорциональных ручек
      if (initialSize.current.direction) {
        const direction = initialSize.current.direction;
        let newWidth = initialSize.current.width;
        let newHeight = initialSize.current.height;
        let newX = position.x;
        let newY = position.y;
        
        if (direction.includes('-')) {
          switch(direction) {
            case 'top-left':
              newWidth = Math.max(1, initialSize.current.width - deltaX);
              newHeight = newWidth / initialSize.current.aspectRatio;
              newX = position.x + (initialSize.current.width - newWidth);
              newY = position.y + (initialSize.current.height - newHeight);
              break;
            case 'top-right':
              newWidth = Math.max(1, initialSize.current.width + deltaX);
              newHeight = newWidth / initialSize.current.aspectRatio;
              newY = position.y + (initialSize.current.height - newHeight);
              break;
            case 'bottom-left':
              newWidth = Math.max(1, initialSize.current.width - deltaX);
              newHeight = newWidth / initialSize.current.aspectRatio;
              newX = position.x + (initialSize.current.width - newWidth);
              break;
            case 'bottom-right':
              newWidth = Math.max(1, initialSize.current.width + deltaX);
              newHeight = newWidth / initialSize.current.aspectRatio;
              break;
          }
        } else {
          switch(direction) {
            case 'left':
              newWidth = Math.max(1, initialSize.current.width - deltaX);
              newX = position.x + deltaX;
              break;
            case 'right':
              newWidth = Math.max(1, initialSize.current.width + deltaX);
              break;
            case 'top':
              newHeight = Math.max(1, initialSize.current.height - deltaY);
              newY = position.y + deltaY;
              break;
            case 'bottom':
              newHeight = Math.max(1, initialSize.current.height + deltaY);
              break;
          }
        }
  
        onResize?.({
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY
        });
      }
  
      updateOverlayPosition();
      return;
    }
  
    if (isDragging && elementRef.current) {
      const parentRect = elementRef.current.parentNode.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - offset.x;
      const newY = e.clientY - parentRect.top - offset.y;
      onDrag?.({ x: newX, y: newY });
      updateOverlayPosition();
    }
  };

  const handleMouseUp = () => {
    cancelAnimationFrame(animationFrameRef.current);
    setIsDragging(false);
    setIsResizing(false);
  };  

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing]);

  return (<>
    <div
      ref={elementRef}
      className='draggable-element'
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        userSelect: 'none',
        width: 'auto',
        height: 'auto',
      }} 
   >
      <div style={{
        width: dimensions ? `${dimensions.width}px` : 'auto',
        height: dimensions ? `${dimensions.height}px` : 'auto',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `rotate(${currentRotation}deg)`,
        transformOrigin: 'center center'
        
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={onContextMenu}
      onClick={onClick}
      >
        {children}
      </div>
      <div 
        ref={overlayRef}
        className={`dragging-overlay ${isOverlayVisible ? 'visible' : ''}`}
        style={{
          transform: `rotate(${currentRotation}deg)`,
          width: dimensions ? `${dimensions.width}px` : 'auto',
          height: dimensions ? `${dimensions.height}px` : 'auto',
        }}
      >
        {/* Ручка поворота */}
        {isOverlayVisible && (
          <div
            ref={rotateHandleRef}
            className='rotate-handle'
            onMouseDown={handleRotateStart}
            style={{
              
            }}
          />
        )}
      
        {/* Кнопка изменения размера */}
        {splitResizable && isOverlayVisible && (
          <>
            <div className={`resize-handle left ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleDirectionalResize(e, 'left')} />
            <div className={`resize-handle right ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleDirectionalResize(e, 'right')} />
            <div className={`resize-handle top ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleDirectionalResize(e, 'top')} />
            <div className={`resize-handle bottom ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleDirectionalResize(e, 'bottom')} />
          </>
        )}
        {/* Кнопка пропорционального изменения размера */}
        {resizeable && isOverlayVisible && (
          <>
            <div className={`resize-handle top-left ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleProportionalResize(e, 'top-left')} />
            <div className={`resize-handle top-right ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleProportionalResize(e, 'top-right')} />
            <div className={`resize-handle bottom-left ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleProportionalResize(e, 'bottom-left')} />
            <div className={`resize-handle bottom-right ${isOverlayVisible ? 'visible' : ''}`}
              onMouseDown={(e) => handleProportionalResize(e, 'bottom-right')} />
          </>
        )}
      </div>
    </div>
    
  </>);
};

export default DraggableElement;