import { FaExchangeAlt } from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import { RxDragHandleDots2 } from "react-icons/rx";

import { DraggableElementItem } from './DraggableElemetItem';
import { FontControls } from "./FontControls";

export const ElementsList = ({
  elements,
  colorInputRef,
  handleRemoveElement,
  handleFlipImage,
  handleColorButtonClick,
  handleRemoveBackground,
  processingIds,
  selectedTextElementId,
  setSelectedTextElementId,
  handleTextEditToggle,
  handleColorChange,
  handleFontChange,
  moveElement,
  selectedElementId, // Добавляем новый пропс
  setSelectedElementId // Добавляем обработчик выбора
}) => (
  <div className="sidebar">
    <div className="elements-list">
      <h3 style={{ marginTop: '0' }}>Компоненты дизайна</h3>
      {[...elements].reverse().map((element, index) => {
        const originalIndex = elements.length - 1 - index;
        return (
          <DraggableElementItem
            key={element.id}
            element={element}
            originalIndex={originalIndex}
            moveElement={moveElement}
            elements={elements}
            isSelected={element.id === selectedElementId} // Передаем флаг выделения
             // Обработчик клика
          >
          <div className={`element-item ${element.id === selectedElementId ? 'selected' : ''}`} onClick={() => setSelectedElementId(element.id)}>
            <div className="element-info">
              <RxDragHandleDots2 className="drag-handle" />
              <span style={{alignSelf: 'center'}}>
                {element.type === 'text' && '📝 '}
                {(element.type === 'image' || element.type === 'element') && (
                  <img 
                    src={element.image}
                    style={{
                      width: '30px',
                      height: '30px',
                      objectFit: 'contain',
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
                      width: '30px',
                      height: '30px',
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
              {(element.type === 'image' && !element.isProduct) && 'Изображение'}
              {element.isProduct && 'Основной товар'}
              {element.type === 'element' && 'Элемент'}
              {element.type === 'shape' && 'Фигура'}
            </div>
            <div className="element-controls">
              {(element.type === 'image' || element.type === 'element') && (
                <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFlipImage(element.id);
                }}
                className="flip-button"
                title="Зеркальное отражение"
                >
                  <FaExchangeAlt />
                </button>
              )}  
              {element.type === 'image' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveBackground(element.id);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTextElementId(
                      prev => prev === element.id ? null : element.id
                    );
                  }}
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
                onClick={() => handleRemoveElement(element.id)}
                className="remove-button"
              >
                ×
              </button>
            </div>
          </div>
          </DraggableElementItem>
        );
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