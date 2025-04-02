import { useState, useRef, useEffect } from 'react';

const DraggableElement = ({ 
  children, 
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  onResize,
  onRotate,
  resizeable,
  dimensions = null,
  rotation = 0
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [currentRotation, setCurrentRotation] = useState(rotation);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);
  const rotateHandleRef = useRef(null);
  const initialSize = useRef({ width: dimensions ? dimensions.width : 'auto', height: dimensions ? dimensions.height : 'auto' });

  const overlayRef = useRef(null);
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const animationFrameRef = useRef(null);

  const updateOverlayPosition = () => {
    if (!elementRef.current || !overlayRef.current) return;
    
    const element = elementRef.current;
    const overlay = overlayRef.current;
    const rect = element.getBoundingClientRect();

    animationFrameRef.current = requestAnimationFrame(() => {
      overlay.style.left = `${rect.left}px`;
      overlay.style.top = `${rect.top}px`;

      overlay.style.width = `${element.offsetWidth}px`;
      overlay.style.height = `${element.offsetHeight}px`;
    });
  };

  // Клик вне элемента
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (elementRef.current && !elementRef.current.contains(e.target)) {
        setIsOverlayVisible(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Обработка скролла
  useEffect(() => {
    const handleScroll = () => {
      setIsOverlayVisible(false);
    };
  
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const handleRotateStart = (e) => {
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
      if(onRotate) onRotate(newRotation);
    };

    const handleMouseUpR = () => {
      document.removeEventListener('mousemove', handleMouseMoveR);
      document.removeEventListener('mouseup', handleMouseUpR);
    };

    document.addEventListener('mousemove', handleMouseMoveR);
    document.addEventListener('mouseup', handleMouseUpR);
  };

  const handleResizeStart = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = elementRef.current.getBoundingClientRect();
    initialSize.current = {
      width: rect.width,
      height: rect.height,
      x: e.clientX,
      y: e.clientY
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
      const aspectRatio = initialSize.current.width / initialSize.current.height;
      
      const newWidth = Math.max(
        50,
        Math.min(
          initialSize.current.width + deltaX,
          containerWidth - position.x
        )
      );
      
      const newHeight = newWidth / aspectRatio;
  
      onResize({ width: newWidth, height: newHeight });
      return;
    }
  
    if (isDragging && elementRef.current) {
      const parentRect = elementRef.current.parentNode.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - offset.x;
      const newY = e.clientY - parentRect.top - offset.y;
  
      onDrag({
        x: newX,
        y: newY
      });
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
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        width: dimensions ? `${dimensions.width}px` : 'auto',
        height: dimensions ? `${dimensions.height}px` : 'auto',
        
      }} 
      onMouseDown={handleMouseDown}
    >
      {children}
 <div 
        ref={overlayRef}
        className={`dragging-overlay ${isOverlayVisible ? 'visible' : ''}`}
        style={{
          transform: `rotate(${currentRotation}deg)`,
          transformOrigin: 'center center'
        }}
      >
        {/* Ручка поворота */}
      <div
        ref={rotateHandleRef}
        className='rotate-handle'
        onMouseDown={handleRotateStart}
        style={{
          
        }}
      />
      
      {/* Кнопка изменения размера */}
      {resizeable && (
        <div
          className={`resize-handle ${isOverlayVisible ? 'visible' : ''}`}
          onMouseDown={handleResizeStart}
          style={{
            
          }}
        />
      )}
      </div>
    </div>
    
  </>);
};

export default DraggableElement;