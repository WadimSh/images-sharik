import { useState, useRef, useEffect } from 'react';
import DraggableElement from './DraggableElement';

export const TextElement = ({ 
  text, 
  position, 
  onDrag, 
  containerWidth, 
  containerHeight,
  onTextChange,
  rotation = 0,
  onRotate,
  isEditing,      // Принимаем состояние редактирования извне
  onEditToggle    // Колбэк для переключения состояния
}) => {
  const [editedText, setEditedText] = useState(text);
  const inputRef = useRef(null);

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
      position={position}
      onDrag={onDrag}
      containerWidth={containerWidth}
      containerHeight={containerHeight}
      dimensions={{ width: 'auto', height: 'auto' }}
      onRotate={onRotate}
      rotation={rotation}
    >
      <div className="text-content-wrapper">
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
          <div
            style={{ 
              color: '#333',
              fontSize: '24px',
              fontFamily: 'Arial',
              wordBreak: 'break-word',
              maxWidth: '100%',
              position: 'relative',
              paddingRight: '12px',
              transform: `rotate(${rotation}deg)`
            }}
          >
            {editedText}
          </div>
        )}
      </div>
    </DraggableElement>
  );
};