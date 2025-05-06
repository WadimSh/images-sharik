import { FaArrowUp, FaArrowDown, FaExchangeAlt } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';

import { FontControls } from "./FontControls";

export const ElementsList = ({
  elements,
  colorInputRef,
  handleMoveUp,
  handleMoveDown,
  handleRemoveElement,
  handleFlipImage,
  handleReplaceImage,
  handleColorButtonClick,
  handleRemoveBackground,
  processingIds,
  selectedTextElementId,
  setSelectedTextElementId,
  handleTextEditToggle,
  handleColorChange,
  handleFontChange
}) => (
  <div className="sidebar">
    <div className="elements-list">
      <h3 style={{ marginTop: '0' }}>Элементы дизайна</h3>
      {[...elements].reverse().map((element, index) => {
        const originalIndex = elements.length - 1 - index;
        return (
          <div key={element.id} className="element-item">
            <div className="element-info">
              <span>
                {element.type === 'text' && '📝 '}
                {element.type === 'image' && (
                  <img 
                    src={element.image}
                    style={{
                      width: '18px',
                      height: '18px',
                      objectFit: 'cover',
                      marginRight: '4px',
                      verticalAlign: 'text-bottom',
                      borderRadius: '2px'
                    }}
                    alt="Превью"
                  />
                )}
                {element.type === 'shape' && (
                  <div 
                    style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: element.color,
                      marginRight: '4px',
                      borderRadius: '2px'
                    }}
                  />
                )}
              </span>
              {element.type === 'text' && <span className="quoted-truncate">
                "<span className="truncated-text">{element.text}</span>"
              </span>}
              {element.type === 'image' && 'Изображение'}
              {element.type === 'shape' && 'Фигура'}
            </div>
            <div className="element-controls">
              {element.type === 'image' && (
                <button
                onClick={() => handleFlipImage(element.id)}
                className="flip-button"
                title="Зеркальное отражение"
                >
                  <FaExchangeAlt />
                </button>
              )}  
              {element.type === 'image' && (
                <button
                  onClick={() => handleReplaceImage(element.id)}
                  className="replace-button"
                  title="Заменить изображение"
                >
                  <FiRefreshCw />
                </button>
              )}
              {element.isProduct && (
                <button
                  onClick={() => handleRemoveBackground(element.id)}
                  className="remove-bg-button"
                  title="Удалить фон"
                  disabled={processingIds.has(element.id)}
                >
                  {processingIds.has(element.id) ? (
                    <div className="spinner"></div>
                  ) : (
                    '🎭'
                  )}
                </button>
              )}
              {element.type === 'shape' && (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorButtonClick(element.id);
                }}
                  className="replace-button"
                  title="Изменения цвета"
                >
                  🎨
                </button>
              )}
              {element.type === 'text' && (
                <button
                  onClick={() => setSelectedTextElementId(
                    prev => prev === element.id ? null : element.id
                  )}
                  className="font-settings-button"
                  title="Настройки шрифта"
                >
                  Аа
                </button>
               )}
              {element.type === 'text' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextEditToggle(element.id, true);
                  }}
                  className="replace-button"
                  title="Изменения текста"
                >
                  ✎
                </button>
              )}
              <button 
                onClick={() => handleMoveUp(originalIndex)} 
                disabled={originalIndex === 0}
                className="move-button"
              >
                <FaArrowDown />
              </button>
              <button 
                onClick={() => handleMoveDown(originalIndex)} 
                disabled={originalIndex === elements.length - 1}
                className="move-button"
              >
                <FaArrowUp />
              </button>
              <button 
                onClick={() => handleRemoveElement(element.id)}
                className="remove-button"
              >
                ×
              </button>
            </div>
          </div>
        )
      })}
    </div>
    <input
      type="color"
      ref={colorInputRef}
      onChange={handleColorChange}
      style={{ 
        position: 'absolute',
        left: '-220px',
        opacity: 0,
        height: 0,
        width: 0 
      }}
    />
    
    {/* Панель настроек шрифта вне цикла элементов */}
    {selectedTextElementId && (
      <div className="font-controls-wrapper">
        <FontControls
          element={elements.find(el => el.id === selectedTextElementId)}
          onClose={() => setSelectedTextElementId(null)}
          onChange={handleFontChange}
        />
      </div>
    )}     
  </div>
);