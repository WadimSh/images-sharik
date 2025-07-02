import { useState, useRef, useEffect } from 'react';
import DraggableElement from './DraggableElement';

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
  onDeselect,
  zoom,
  captureRef
}) => {
  const [editedText, setEditedText] = useState(element.text);
  const inputRef = useRef(null);
  const textContainerRef = useRef(null);
  
  const textStyle = {
    position: 'relative',
    paddingLeft: '2px',
    color: element.color || '#333',
    fontSize: `${element.fontSize || 32}px`,
    fontFamily: element.fontFamily || 'HeliosCond',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textDecoration: element.textDecoration || 'none',
    textAlign: element.textAlign || 'left',
    lineHeight: 1,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden',
    width: '100%',
    height: '100%',
    // display: 'flex',
    // alignItems: element.textAlign?.vertical || 'flex-start',
    // justifyContent: element.textAlign?.horizontal || 'left',
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
            style={{
              ...textStyle,
              width: '100%',
              height: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
            }}
          />
        ) : (
          <div
            style={textStyle}
            dangerouslySetInnerHTML={{ __html: editedText.replace(/\n/g, '<br/>') }}
          />
        )}
      </div>
    </DraggableElement>
  );
};