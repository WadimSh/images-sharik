import { useState, useRef, useEffect } from 'react';

const DraggableElement = ({ 
  children, 
  position, 
  onDrag, 
  onRemove,
  containerWidth, 
  containerHeight,
  onResize,
  resizeable
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);
  const initialSize = useRef({ width: 0, height: 0 });

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
  
      const maxX = containerWidth - elementRef.current.offsetWidth;
      const maxY = containerHeight - elementRef.current.offsetHeight;
  
      onDrag({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
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
  
  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onRemove) onRemove();
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={elementRef}
      className="draggable-element"
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={handleContextMenu}
    >
      {children}
      {resizeable && (
        <div
          className='resize-handle'
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  );
};

export default DraggableElement;