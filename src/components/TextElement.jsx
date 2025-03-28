import { useState, useRef, useEffect } from 'react';
import DraggableElement from './DraggableElement';

export const TextElement = ({ 
  text, 
  position, 
  onDrag, 
  onRemove, 
  containerWidth, 
  containerHeight,
  onTextChange 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [showEditButton, setShowEditButton] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onTextChange(editedText);
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
    >
      <div 
        style={{ 
          position: 'relative',
          display: 'inline-block',
          maxWidth: `${containerWidth - position.x}px`,
        }}
        onMouseEnter={() => setShowEditButton(true)}
        onMouseLeave={() => setShowEditButton(false)}
      >
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
              paddingRight: '12px'
            }}
          >
            {editedText}
            {/* Кнопка удаления */}
            <button 
              className='remove-handle'
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              ×
            </button>
            {showEditButton && (
              <button
                onClick={handleEditClick}
                className='text-change'
              >
                ✎
              </button>
            )}
          </div>
        )}
      </div>
    </DraggableElement>
  );
};