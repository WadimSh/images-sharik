import { useState, useRef, useEffect } from 'react';
import DraggableElement from './DraggableElement';

const TEXT_STYLES = {
  STROKE: 'stroke',     // Контур
  SHADOW: 'shadow',     // Тень
  COMBINED: 'combined'  // Комбинированный
};

export const TextElement = ({ 
  contextMenuRef,
  element, // Теперь получаем весь объект элемента
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  onTextChange,
  onRotate,
  onResize,
  isEditing,      // Принимаем состояние редактирования извне
  onEditToggle,    // Колбэк для переключения состояния
  onContextMenu,
  onClick,
  selectedElementId,
  selectedElementIds,
  lockedElementId,
  onDeselect,
  zoom,
  captureRef
}) => {
  const [editedText, setEditedText] = useState(element.text);
  const inputRef = useRef(null);
  const textContainerRef = useRef(null);

const getTextStyles = () => {
  const baseStyle = {
    position: 'relative',
    paddingLeft: '2px',
    color: element.color || '#333',
    fontSize: `${element.fontSize || 32}px`,
    fontFamily: element.fontFamily || 'HeliosCond',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    textAlign: element.textAlign || 'left',
    lineHeight: element.fontFamily === 'Lemon Tuesday' ? 1.8 : 1.3,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  };

  // Применяем стили в зависимости от выбранного типа
  switch (element.textStyle) {
    case TEXT_STYLES.STROKE:
      return {
        ...baseStyle,
        WebkitTextStroke: '3px white',
        textStroke: '3px white',
      };
    case TEXT_STYLES.SHADOW:
      return {
        ...baseStyle,
        textShadow: '0 0 4px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.8), 0 0 4px rgba(0, 0, 0, 0.8)'
      };
    case TEXT_STYLES.COMBINED:
      return {
        ...baseStyle,
        textShadow: '-1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 #666, 1px 1px 0 #666, 0 0 4px rgba(0, 0, 0, 0.8), 0 0 8px rgba(0, 0, 0, 0.5)'
      };
    default:
      return baseStyle; // Обычный текст без оформления
  }
};
  
  const handleResize = (newSize) => {
    onResize({
      width: newSize.width,
      height: newSize.height,
      x: newSize.x ?? position.x, // Сохраняем новую позицию
      y: newSize.y ?? position.y
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    onTextChange(editedText);
    onEditToggle(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <DraggableElement
      contextMenuRef={contextMenuRef}
      id={element.id}
      position={element.position}
      onDrag={onDrag}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ 
        width: element.width || 'auto', 
        height: element.height || 'auto' 
      }}
      onResize={handleResize}
      onRotate={onRotate}
      rotation={element.rotation || 0}
      onContextMenu={onContextMenu}  
      onClick={onClick}
      selectedElementId={selectedElementId}
      selectedElementIds={selectedElementIds}
      lockedElementId={lockedElementId}
      onDeselect={onDeselect}
      splitResizable
      hideOverlay={isEditing}
      zoom={zoom}
      captureRef={captureRef}
    >
      <div 
        className="text-content-wrapper" 
        ref={textContainerRef}
        style={{ 
          width: element.width ? `${element.width}px` : 'auto',
          height: element.height ? `${element.height}px` : 'auto',
          boxSizing: 'border-box'
        }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className='text-input'
            style={getTextStyles()}
          />
        ) : (
          <div
            style={getTextStyles()}
            dangerouslySetInnerHTML={{ __html: editedText.replace(/\n/g, '<br/>') }}
          />
        )}
      </div>
    </DraggableElement>
  );
};

// контур
// .thick-stroke {
//   -webkit-text-stroke: 3px white;
//   text-stroke: 3px white;
// }

// тень
// text-shadow: 
//  0 0 4px rgba(0, 0, 0, 0.8),
//  0 0 4px rgba(0, 0, 0, 0.8),
//  0 0 4px rgba(0, 0, 0, 0.8),
//  0 0 4px rgba(0, 0, 0, 0.8);

// комбинированная
// text-shadow: 
//  -1px -1px 0 white,
//  1px -1px 0 white,
//  -1px 1px 0 #666,
//  1px 1px 0 #666,
//  0 0 4px rgba(0, 0, 0, 0.8),
//  0 0 8px rgba(0, 0, 0, 0.5);