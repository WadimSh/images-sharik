import { useState, useRef, useEffect } from 'react';
import DraggableElement from './DraggableElement';

export const TextElement = ({ 
  element, // Теперь получаем весь объект элемента
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  onTextChange,
  onRotate,
  isEditing,      // Принимаем состояние редактирования извне
  onEditToggle    // Колбэк для переключения состояния
}) => {
  const [editedText, setEditedText] = useState(element.text);
  const inputRef = useRef(null);

  const textStyle = {
    color: element.color || '#333',
    fontSize: `${element.fontSize || 24}px`,
    fontFamily: element.fontFamily || 'Arial',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    wordBreak: 'break-word',
    maxWidth: '100%',
    position: 'relative',
    transform: `rotate(${element.rotation}deg)`
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
      position={element.position}
      onDrag={onDrag}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width: 'auto', height: 'auto' }}
      onRotate={onRotate}
      rotation={element.rotation || 0}
    >
      <div className="text-content-wrapper" style={{ transform: `rotate(${element.rotation}deg)` }}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className='text-input'
            style={{ maxWidth: `${containerWidth - position.x}px` }}
          />
        ) : (
          <span
            style={textStyle}
          >
            {editedText}
          </span>
        )}
      </div>
    </DraggableElement>
  );
};