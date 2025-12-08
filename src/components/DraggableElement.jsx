import { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const DraggableElement = ({ 
  contextMenuRef,
  children, 
  id,
  selectedElementId,
  selectedElementIds = [],
  lockedElementId,
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
  hideOverlay = false,
  zoom = 1,
  captureRef = null
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

  const isLocked = lockedElementId.has(id);
  
  useEffect(() => {
    setCurrentRotation(rotation);
  }, [rotation]);

  // Новая функция для вычисления абсолютных координат overlay
  const getOverlayStyle = () => {
    if (!captureRef?.current) return { display: 'none' };
    const containerRect = captureRef.current.getBoundingClientRect();
    const left = containerRect.left + position.x * zoom;
    const top = containerRect.top + position.y * zoom;
    const width = (dimensions ? dimensions.width : 0) * zoom;
    const height = (dimensions ? dimensions.height : 0) * zoom;
    return {
      position: 'fixed',
      left,
      top,
      width,
      height,
      pointerEvents: 'none',
      zIndex: 9999,
      transform: `rotate(${currentRotation}deg)`
    };
  };

  useEffect(() => {
    if (hideOverlay || isLocked) {
      setIsOverlayVisible(false);
      return;
    }

    if (selectedElementId === id || selectedElementIds.includes(id)) {
      setIsOverlayVisible(true);
    } else {
      setIsOverlayVisible(false);
    }
  }, [selectedElementId, selectedElementIds, id, position, dimensions, hideOverlay, isLocked]);

  // Клик вне элемента
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.shiftKey && 
          elementRef.current && 
          !elementRef.current.contains(e.target) && 
          !contextMenuRef.current?.contains(e.target) && 
          !selectedElementIds.includes(id)) {
        setIsOverlayVisible(false);
        onDeselect?.();
      }
    };
    
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, [selectedElementIds, id]);

  // Обработка скролла
  useEffect(() => {
    const handleScroll = () => {
      if (!selectedElementIds.includes(id)) {
        setIsOverlayVisible(false);
        onDeselect?.();
      }
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [selectedElementIds, id]);

  const handleRotateStart = (e) => {
    if (!isOverlayVisible || isLocked) return; // Запрещаем вращение для заблокированных
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
    };

    const handleMouseUpR = () => {
      document.removeEventListener('mousemove', handleMouseMoveR);
      document.removeEventListener('mouseup', handleMouseUpR);
    };

    document.addEventListener('mousemove', handleMouseMoveR);
    document.addEventListener('mouseup', handleMouseUpR);
  };

  const handleProportionalResize = (e, direction) => {
    if (!isOverlayVisible || isLocked) return; // Запрещаем ресайз для заблокированных
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
    if (!isOverlayVisible || isLocked) return; // Запрещаем ресайз для заблокированных
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
    if (e.button !== 0 || isResizing || isLocked) return; // Запрещаем перетаскивание для заблокированных
    
    const rect = elementRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    setIsOverlayVisible(true);
  };

  const handleMouseMove = (e) => {
    if (isLocked) return; // Запрещаем все действия для заблокированных элементов
    
    if (isResizing && elementRef.current) {
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
    }
  
    if (isDragging && elementRef.current) {
      const parentRect = elementRef.current.parentNode.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - offset.x;
      const newY = e.clientY - parentRect.top - offset.y;

      if ((selectedElementIds.includes(id) || selectedElementId === id) && selectedElementIds.length > 0) {
        // Для группового перетаскивания передаем только дельту
        const deltaX = e.movementX;
        const deltaY = e.movementY;
        onDrag({ x: newX, y: newY }, { deltaX, deltaY });
      } else {
        // Для одиночного элемента используем абсолютные координаты
        onDrag({ x: newX, y: newY });
      }
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

  const handleElementClick = (e) => {
    if (isLocked) {
      // Для заблокированных элементов просто вызываем onClick без показа оверлея
      e.stopPropagation();
      onClick?.(e);
      return;
    }
    
    // Для незаблокированных элементов стандартное поведение
    onClick?.(e);
  };

  const handleElementContextMenu = (e) => {
    if (isLocked) {
      // Запрещаем контекстное меню для заблокированных элементов
      e.preventDefault();
      return;
    }
    onContextMenu?.(e);
  };

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
        cursor: isLocked ? '' : 'default', // Меняем курсор для заблокированных
      }} 
   >
      <div style={{
        width: dimensions ? `${dimensions.width}px` : 'auto',
        height: dimensions ? `${dimensions.height}px` : 'auto',
        cursor: isLocked ? '' : (isDragging ? 'grabbing' : 'grab'),
        transform: `rotate(${currentRotation}deg)`,
        transformOrigin: 'center center'
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleElementContextMenu}
      onClick={handleElementClick}
      >
        {children}
      </div>
    </div>
    {/* Overlay через Portal */}
    {isOverlayVisible && !isLocked && captureRef?.current && ReactDOM.createPortal(
      <div 
        ref={overlayRef}
        className={`dragging-overlay visible`}
        style={getOverlayStyle()}
      >
        {/* Ручка поворота */}
        <div
          ref={rotateHandleRef}
          className='rotate-handle'
          onMouseDown={handleRotateStart}
        />
        {/* Кнопка изменения размера */}
        {splitResizable && (
          <>
            <div className={`resize-handle left visible`}
              onMouseDown={(e) => handleDirectionalResize(e, 'left')} />
            <div className={`resize-handle right visible`}
              onMouseDown={(e) => handleDirectionalResize(e, 'right')} />
            <div className={`resize-handle top visible`}
              onMouseDown={(e) => handleDirectionalResize(e, 'top')} />
            <div className={`resize-handle bottom visible`}
              onMouseDown={(e) => handleDirectionalResize(e, 'bottom')} />
          </>
        )}
        {/* Кнопка пропорционального изменения размера */}
        {resizeable && (
          <>
            <div className={`resize-handle top-left visible`}
              onMouseDown={(e) => handleProportionalResize(e, 'top-left')} />
            <div className={`resize-handle top-right visible`}
              onMouseDown={(e) => handleProportionalResize(e, 'top-right')} />
            <div className={`resize-handle bottom-left visible`}
              onMouseDown={(e) => handleProportionalResize(e, 'bottom-left')} />
            <div className={`resize-handle bottom-right visible`}
              onMouseDown={(e) => handleProportionalResize(e, 'bottom-right')} />
          </>
        )}
      </div>,
      document.body
    )}
  </>);
};

export default DraggableElement;