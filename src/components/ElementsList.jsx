import { FaExchangeAlt } from 'react-icons/fa';
import { RxDragHandleDots2 } from "react-icons/rx";
import { FaChevronDown, FaWandMagicSparkles, FaPencil } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import { IoColorPaletteOutline } from "react-icons/io5";

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
  setSelectedElementId, // Добавляем обработчик выбора
  expandedElementId, // Новый пропс для отслеживания раскрытого элемента
  setExpandedElementId // Обработчик раскрытия/закрытия
}) => (
  <div className="sidebar">
    <div className="elements-list">
      <h3 style={{ marginTop: '0' }}>Компоненты дизайна</h3>
      {[...elements].reverse().map((element, index) => {
        const originalIndex = elements.length - 1 - index;
        const isExpanded = expandedElementId === element.id;

        return (
          <DraggableElementItem
            key={element.id}
            element={element}
            originalIndex={originalIndex}
            moveElement={moveElement}
            elements={elements}
            isSelected={element.id === selectedElementId} // Передаем флаг выделения
          >
            <div 
              className={`element-item ${element.id === selectedElementId ? 'selected' : ''}`} 
              onClick={() => setSelectedElementId(element.id)}
            >

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
              <button 
                className={`expand-button ${isExpanded ? 'expanded' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedElementId(isExpanded ? null : element.id);
                }}
              >
                <FaChevronDown />
              </button>
            </div>

            {isExpanded && (
              <div className="element-controls-dropdown" onClick={e => e.stopPropagation()}>

                {(element.type === 'image' || element.type === 'element') && (
                  <div className="element-controls">
                    <label className="flip-checkbox-label">
                      <input
                        type="checkbox"
                        checked={element.isFlipped || false}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleFlipImage(element.id);
                        }}
                        className="flip-checkbox"
                      />
                      <span className="checkbox-text">Отобразить зеркально</span>
                    </label>
                  </div>
                )}  

                {element.type === 'image' && (
                  <div className="element-controls">
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
                        <><FaWandMagicSparkles /> Удалить фон</>
                      )}
                    </button>
                  </div>
                )}

                {element.type === 'shape' && (
                  <div className="element-controls">
                    <span>Цвет</span>
                    <div className="color-control">
                      <div 
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: element.color,
                          marginRight: '4px',
                          borderRadius: '2px'
                        }}
                      />
                      <span className="color-hex">{element.color}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorButtonClick(element.id);
                        }}
                        className="change-color-button"
                      >
                        <IoColorPaletteOutline 
                          style={{
                          width: '24px',
                          height: '24px',
                        }}
                        />
                      </button>
                    </div>
                  </div>
                )}

                {element.type === 'text' && (
                  <div className="element-controls">
                    <span>Типографика</span>
                    <div className="font-controls">
                      <div className="style-controls">
                        <button
                          className={`style-button bold ${element.fontWeight === 'bold' ? 'active' : ''}`}
                          onClick={() => 
                            handleFontChange(element.id, 'fontWeight', 
                              element.fontWeight === 'bold' ? 'normal' : 'bold'
                            )
                          }
                        >
                          B
                        </button>
                        
                        <button
                          className={`style-button italic ${element.fontStyle === 'italic' ? 'active' : ''}`}
                          onClick={() => 
                            handleFontChange(element.id, 'fontStyle', 
                              element.fontStyle === 'italic' ? 'normal' : 'italic'
                            )
                          }
                        >
                          I
                        </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTextEditToggle(element.id, true);
                            }}
                            className="replace-button"
                            title="Изменения текста"
                          >
                            <FaPencil />
                          </button>
                      </div>

                      <label>
                        Размер:
                        <input
                          type="number"
                          value={element.fontSize || 24}
                          onChange={(e) => handleFontChange(element.id, 'fontSize', parseInt(e.target.value))}
                          min="8"
                          max="72"
                        />
                      </label>

                      <label>
                        Цвет:
                        <div className="color-picker-wrapper">
                          <input
                            type="color"
                            className="color-picker-input"
                            value={element.color || '#333333'}
                            onChange={(e) => handleFontChange(element.id, 'color', e.target.value)}
                          />
                          <div 
                            className="color-preview"
                            style={{ color: element.color || '#333333' }}
                          />
                        </div>
                      </label>

                      <label>
                        Шрифт:
                        <select
                          value={element.fontFamily || 'Arial'}
                          onChange={(e) => handleFontChange(element.id, 'fontFamily', e.target.value)}
                        >
                          <option value="HeliosCond">HeliosCond</option>
                          <option value="GemarFont">GemarFont</option>
                          <option value="BelbalFont">BelbalFont</option>
                          <option value="BelbalFontRegul">BelbalFontRegul</option>
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                          <option value="Verdana">Verdana</option>
                          <option value="Georgia">Georgia</option>
                          <option value="Courier New">Courier New</option>
                          <option value="Calibri">Calibri</option>
                          <option value="Tahoma">Tahoma</option>
                          <option value="Impact">Impact</option>
                          <option value="Comic Sans MS">Comic Sans MS</option>
                          <option value="Lucida Sans">Lucida Sans</option>
                          <option value="Segoe UI">Segoe UI</option>
                          <option value="Cambria">Cambria</option>
                          <option value="Garamond">Garamond</option>
                          <option value="Franklin Gothic">Franklin Gothic</option>
                          <option value="Consolas">Consolas</option>
                          <option value="Palatino Linotype">Palatino Linotype</option>
                          <option value="Trebuchet MS">Trebuchet MS</option>
                          <option value="Book Antiqua">Book Antiqua</option>
                          <option value="Century Gothic">Century Gothic</option>
                          <option value="Candara">Candara</option>
                        </select>
                      </label>
                    </div>
                  </div>
                )}  

                <div className="element-controls line">
                  <button 
                    onClick={() => handleRemoveElement(element.id)}
                    className="remove-button"
                    title="Удалить компонент"
                  >
                    <RiDeleteBin2Line /> Удалить
                  </button>
                </div>  
                
              </div>
            )}  
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
  </div>
);