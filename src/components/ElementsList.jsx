import { RxDragHandleDots2 } from "react-icons/rx";
import { FaChevronDown, FaWandMagicSparkles, FaPencil, FaArrowRightArrowLeft } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import { IoColorPaletteOutline } from "react-icons/io5";
import { TbRadiusTopLeft, TbRadiusTopRight, TbRadiusBottomLeft, TbRadiusBottomRight } from "react-icons/tb";
import { MdOpacity } from "react-icons/md";
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import { hexToRgba } from "../utils/hexToRgba";
import { DraggableElementItem } from './DraggableElemetItem';

export const ElementsList = ({
  elements,
  colorInputRef,
  handleRemoveElement,
  handleFlipImage,
  handleColorButtonClick,
  handleRemoveBackground,
  handleAddShadow,
  handleDirectionChange,
  handleBorderRadiusChange,
  handleGradientChange,
  handleoOpacityChange,
  processingIds,
  processingShedowIds,
  shadowSetting,
  handleTextEditToggle,
  handleColorChange,
  handleFontChange,
  moveElement,
  selectedElementId,
  setSelectedElementId,
  expandedElementId,
  setExpandedElementId,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  onProportionalResize,
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
            disabled={isExpanded}
            setExpandedElementId={setExpandedElementId}
          >
            <div 
              className={`element-item ${element.id === selectedElementId ? 'selected' : ''} ${isExpanded ? 'disabled-drag' : ''}`}
              onClick={() => setSelectedElementId(element.id)}
            >

              <div 
                className="element-info" 
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedElementId(isExpanded ? null : element.id);
                }}
              >
                <RxDragHandleDots2 
                  className="drag-handle" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedElementId(null); // Закрываем все меню
                  }}
                />
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
                        background: element.gradient 
                                      ? `linear-gradient(${element.gradient.direction}, 
                                        ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])}, 
                                        ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])})`
                                      : element.color,
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

                {element.type === 'text' && (
                  <div className="element-controls">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTextEditToggle(element.id, true);
                      }}
                      className="remove-bg-button"
                      title="Измененить текст"
                    >
                      <><FaPencil /> Измененить текст</>
                    </button>
                  </div>
                )}

                {(element.type === 'image' || element.type === 'element') && (
                  <div className="element-controls">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFlipImage(element.id);
                      }}
                      className="remove-bg-button"
                      title="Отобразить зеркально"
                    >
                      <><FaArrowRightArrowLeft /> Отобразить зеркально</>
                    </button>
                  </div>
                )}  

                {element.type === 'image' && (
                  <div className="element-controls" style={{ paddingTop: '0px' }}>
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

                {(element.type === 'image' || element.type === 'element') && (
                  <div className="element-controls line">
                    <span>Направление тени</span>
                    <div className="font-controls">
                      <label>Горизонталь:
                        <div>
                          <button
                            className={`direction-btn ${shadowSetting.offsetX === -20 ? 'active' : ''}`}
                            style={{ marginRight: '8px' }}
                            onClick={() => handleDirectionChange('offsetX', -20)}
                          >
                            <FaArrowLeft />
                          </button>
                          <button
                            className={`direction-btn ${shadowSetting.offsetX === 20 ? 'active' : ''}`}
                            onClick={() => handleDirectionChange('offsetX', 20)}
                          >
                            <FaArrowRight />
                          </button>
                        </div>
                      </label>
                    </div>

                    <div className="font-controls">
                      <label>Вертикаль:
                        <div>
                          <button
                            className={`direction-btn ${shadowSetting.offsetY === -20 ? 'active' : ''}`}
                            style={{ marginRight: '8px' }}
                            onClick={() => handleDirectionChange('offsetY', -20)}
                          >
                            <FaArrowUp />
                          </button>
                          <button
                            className={`direction-btn ${shadowSetting.offsetY === 20 ? 'active' : ''}`}
                            onClick={() => handleDirectionChange('offsetY', 20)}
                          >
                            <FaArrowDown />
                          </button>
                        </div>
                      </label>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddShadow(element.id, 20, 20);
                      }}
                      className="remove-bg-button"
                      title="Добавить тень"
                      disabled={processingShedowIds.has(element.id)}
                    >
                      {processingShedowIds.has(element.id) ? (
                        <div className="spinner"></div>
                      ) : (
                        <><FaWandMagicSparkles /> Добавить тень</>
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
                          background: element.gradient 
                                      ? `linear-gradient(${element.gradient.direction}, 
                                        ${hexToRgba(element.gradient.colors[0], element.gradient.opacity[0])}, 
                                        ${hexToRgba(element.gradient.colors[1], element.gradient.opacity[1])})`
                                      : element.color,
                          marginRight: '4px',
                          borderRadius: '2px'
                        }}
                      />
                      <span className="color-hex" style={{ userSelect: 'text' }}>{element.gradient?.colors?.[0] || element.color}</span>
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
                    <div className="color-control">
                      <MdOpacity
                        style={{
                          width: '24px',
                          height: '24px',
                        }}
                      />
                      <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={element.opacity || 1}
                          onChange={(e) => handleoOpacityChange(element.id, e.target.value)}
                        />
                        <span>{(element.opacity || 1).toFixed(1)}</span>
                    </div>
                  </div>
                )}

                {element.type === 'shape' && (
                  <div className="element-controls line">
                    <span>Скругление углов</span>
                    <div className="radius-controls">
                      <div className="radius-row">
                        <div className="radius-block">
                          <TbRadiusTopLeft className="radius-icon"/>
                          <input
                            type="number"
                            className="radius-input"
                            value={element.borderRadius?.topLeft || 0}
                            onChange={(e) => handleBorderRadiusChange(element.id, 'topLeft', e.target.value)}
                            min="0"
                            max="100"
                          />
                          px
                        </div>
                        <div className="radius-block">
                          <TbRadiusTopRight className="radius-icon"/>
                          <input
                            type="number"
                            className="radius-input"
                            value={element.borderRadius?.topRight || 0}
                            onChange={(e) => handleBorderRadiusChange(element.id, 'topRight', e.target.value)}
                            min="0"
                            max="100"
                          />
                          px
                        </div>
                      </div>
                      <div className="radius-row">
                        <div className="radius-block">
                          <TbRadiusBottomLeft className="radius-icon"/>
                          <input
                            type="number"
                            className="radius-input"
                            value={element.borderRadius?.bottomLeft || 0}
                            onChange={(e) => handleBorderRadiusChange(element.id, 'bottomLeft', e.target.value)}
                            min="0"
                            max="100"
                          />
                          px
                        </div>
                        <div className="radius-block">
                          <TbRadiusBottomRight className="radius-icon"/>
                          <input
                            type="number"
                            className="radius-input"
                            value={element.borderRadius?.bottomRight || 0}
                            onChange={(e) => handleBorderRadiusChange(element.id, 'bottomRight', e.target.value)}
                            min="0"
                            max="100"
                          />
                          px
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'shape' && (
                  <div className="element-controls line">
                    <span>Линейный градиент</span>
                    <div className="gradient-controls">
                      {/* Выбор направления */}
                      <div className="direction-buttons">
                        <button
                          onClick={() => handleGradientChange(element.id, 'direction', 'to right')}
                          className={element.gradient?.direction === 'to right' ? 'active' : ''}
                          title="Слева направо"
                        >
                          →
                        </button>
                        <button
                          onClick={() => handleGradientChange(element.id, 'direction', 'to left')}
                          className={element.gradient?.direction === 'to left' ? 'active' : ''}
                          title="Справа налево"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => handleGradientChange(element.id, 'direction', 'to bottom')}
                          className={element.gradient?.direction === 'to bottom' ? 'active' : ''}
                          title="Сверху вниз"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => handleGradientChange(element.id, 'direction', 'to top')}
                          className={element.gradient?.direction === 'to top' ? 'active' : ''}
                          title="Снизу вверх"
                        >
                          ↑
                        </button>
                      </div>

                      {/* Выбор цветов */}
                      <div className="opacity-control">
                        <label>Стартовая точка:</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={element.gradient?.start || 0}
                          onChange={(e) => handleGradientChange(element.id, 'start', e.target.value)}
                        />
                        <span>{(element.gradient?.start || 0)} %</span>
                      </div>
                      <div className="opacity-control">
                        <label>Цвет 1:</label>
                        <input
                          type="color"
                          value={element.gradient?.colors?.[0] || '#000000'}
                          onChange={(e) => handleGradientChange(element.id, 'color1', e.target.value)}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={element.gradient?.opacity?.[0] || 1}
                          onChange={(e) => handleGradientChange(element.id, 'opacity1', e.target.value)}
                        />
                        <span>{(element.gradient?.opacity?.[0] || 1).toFixed(1)}</span>
                      </div>
                      <div className="opacity-control">
                        <label>Цвет 2:</label>
                        <input
                          type="color"
                          value={element.gradient?.colors?.[1] || '#ffffff'}
                          onChange={(e) => handleGradientChange(element.id, 'color2', e.target.value)}
                        />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={element.gradient?.opacity?.[1] || 0}
                          onChange={(e) => handleGradientChange(element.id, 'opacity2', e.target.value)}
                        />
                        <span>{(element.gradient?.opacity?.[1] || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {element.type === 'text' && (
                  <div className="element-controls line">
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
                      </div>

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
                          <option value="FreeSetRegular">FreeSetRegular</option>
                          <option value="FreeSetBold">FreeSetBold</option>
                          <option value="MyriadPro">MyriadPro</option>
                          <option value="Bosk">Bosk</option>
                          <option value="Troubleside">Troubleside</option>
                          <option value="Badaboom">Badaboom</option>
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
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
                          <span className="color-hex" style={{ userSelect: 'text' }}>{element.color}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}  
                
                <div className="element-controls line">
                  <span>Позиционирование</span>
                  <div className="font-controls">
                    <label>
                      По горизотали, px:
                      <input
                        type="number"
                        value={(element.position.x).toFixed(0)}
                        onChange={(e) => onPositionChange(element.id, 'x', e.target.value)}
                      />
                    </label>
                    <label>
                      По вертикали, px:
                      <input
                        type="number"
                        value={(element.position.y).toFixed(0)}
                        onChange={(e) => onPositionChange(element.id, 'y', e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                {element.type === 'shape' && ( 
                  <div className="element-controls line">
                    <span>Размеры</span>
                    <div className="font-controls">
                    <label>
                      Ширина, px:
                      <input
                        type="number"
                        value={(element.width).toFixed(0)}
                        onChange={(e) => onSizeChange(element.id, 'width', e.target.value)}
                      />
                    </label>
                    <label>
                      Высота, px:
                      <input
                        type="number"
                        value={(element.height).toFixed(0)}
                        onChange={(e) => onSizeChange(element.id, 'height', e.target.value)}
                      />
                    </label>
                  </div>
                  </div>
                )}

                {(element.type === 'image' || element.type === 'element') && ( 
                  <div className="element-controls line">
                    <span>Размеры</span>
                    <div className="font-controls">
                    <label>
                      Ширина, px:
                      <input
                        type="number"
                        value={(element.width).toFixed(0)}
                        onChange={(e) => onProportionalResize(element.id, 'width', e.target.value)}
                      />
                    </label>
                    <label>
                      Высота, px:
                      <input
                        type="number"
                        value={(element.height).toFixed(0)}
                        onChange={(e) => onProportionalResize(element.id, 'height', e.target.value)}
                      />
                    </label>
                  </div>
                  </div>
                )}


                <div className="element-controls line">
                  <span>Поворот</span>
                  <div className="font-controls">
                    <label>
                      Поворот, deg:
                      <input
                        type="number"
                        value={(element.rotation || 0).toFixed(0)}
                        onChange={(e) => onRotationChange(element.id, e.target.value)}
                      />
                    </label>
                  </div>
                </div>

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