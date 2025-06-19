import { useEffect, useRef, useContext } from 'react';
import { RxDragHandleDots2 } from "react-icons/rx";
import { FaChevronDown, FaWandMagicSparkles, FaPencil, FaArrowRightArrowLeft } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import { IoColorPaletteOutline } from "react-icons/io5";
import { TbRadiusTopLeft, TbRadiusTopRight, TbRadiusBottomLeft, TbRadiusBottomRight } from "react-icons/tb";
import { MdOpacity } from "react-icons/md";
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';

import { hexToRgba } from "../utils/hexToRgba";
import { DraggableElementItem } from './DraggableElemetItem';
import { LanguageContext } from '../contexts/contextLanguage';

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
  selectedElementIds,
  setSelectedElementIds,
  expandedElementId,
  setExpandedElementId,
  onPositionChange,
  onSizeChange,
  onRotationChange,
  onProportionalResize,
}) => {
  // Создаем ref для контейнера списка
  const listContainerRef = useRef(null);
  // Создаем Map для хранения refs элементов
  const elementRefs = useRef(new Map());
  // Создаем Map для хранения refs меню элементов
  const menuRefs = useRef(new Map());

  const { t } = useContext(LanguageContext);

  // Эффект для прокрутки к выделенному элементу
  useEffect(() => {
    if (selectedElementId) {
      const elementRef = elementRefs.current.get(selectedElementId);
      if (elementRef && listContainerRef.current) {
        // Получаем позиции элемента и контейнера
        const element = elementRef;
        const container = listContainerRef.current;
        const elementRect = element.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Проверяем, находится ли элемент в видимой области
        const isInView = (
          elementRect.top >= containerRect.top &&
          elementRect.bottom <= containerRect.bottom
        );

        // Если элемент не в поле зрения, прокручиваем к нему
        if (!isInView) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }
      }
    }
  }, [selectedElementId]);

  // Эффект для прокрутки к раскрытому меню
  useEffect(() => {
    if (expandedElementId) {
      // Сначала даем React время для рендеринга меню
      setTimeout(() => {
        const elementRef = elementRefs.current.get(expandedElementId);
        const menuRef = menuRefs.current.get(expandedElementId);
        
        if (elementRef && menuRef && listContainerRef.current) {
          const element = elementRef;
          const menu = menuRef;
          const container = listContainerRef.current;
          const elementRect = element.getBoundingClientRect();
          const menuRect = menu.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();

          // Проверяем видимость элемента и его меню
          const elementTop = elementRect.top - containerRect.top;
          const menuBottom = menuRect.bottom - containerRect.top;
          const containerHeight = containerRect.height;

          // Если элемент находится слишком низко и меню не помещается
          if (menuBottom > containerHeight) {
            // Прокручиваем так, чтобы элемент был вверху, а меню помещалось
            const newScrollTop = container.scrollTop + elementTop;
            container.scrollTo({
              top: newScrollTop,
              behavior: 'smooth'
            });
          }
          // Если элемент находится слишком высоко (за пределами видимой области сверху)
          else if (elementTop < 0) {
            container.scrollTo({
              top: container.scrollTop + elementTop,
              behavior: 'smooth'
            });
          }
        }
      }, 0);
    }
  }, [expandedElementId]);

  return (
    <div className="sidebar">
      <h3 style={{ marginTop: '0', marginBottom: '10px' }}>{t('elements.title')}</h3>
      <div className="elements-list" ref={listContainerRef}>
        
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
              isSelected={selectedElementIds.includes(element.id)}
              disabled={isExpanded}
              setExpandedElementId={setExpandedElementId}
            >
              <div 
                ref={el => {
                  if (el) {
                    elementRefs.current.set(element.id, el);
                  } else {
                    elementRefs.current.delete(element.id);
                  }
                }}
                className={`element-item ${element.id === selectedElementId ? 'selected' : ''} ${selectedElementIds.includes(element.id) ? 'selected' : ''} ${isExpanded ? 'disabled-drag' : ''}`}
                onClick={(e) => {
                  if (e.shiftKey) {
                    if (selectedElementIds.includes(element.id)) {
                      setSelectedElementIds(prev => prev.filter(id => id !== element.id));
                    } else {
                      setSelectedElementIds(prev => [...prev, element.id]);
                    }
                  } else {
                    setSelectedElementId(element.id);
                    setSelectedElementIds([]);
                  }
                }}
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
                        alt="alt"
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
                  {(element.type === 'image' && !element.isProduct) && t('elements.labelImage')}
                  {element.isProduct && t('elements.labelMainProduct')}
                  {element.type === 'element' && t('elements.labelElement')}
                  {element.type === 'shape' && t('elements.labelShape')}
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
                <div 
                  className="element-controls-dropdown" 
                  onClick={e => e.stopPropagation()}
                  ref={el => {
                    if (el) {
                      menuRefs.current.set(element.id, el);
                    } else {
                      menuRefs.current.delete(element.id);
                    }
                  }}
                >

                  {element.type === 'text' && (
                    <div className="element-controls">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTextEditToggle(element.id, true);
                        }}
                        className="remove-bg-button"
                      >
                        <><FaPencil /> {t('views.generatorMenuTextEdit')}</>
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
                      >
                        <><FaArrowRightArrowLeft /> {t('views.generatorMenuFlipImage')}</>
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
                        disabled={processingIds.has(element.id)}
                      >
                        {processingIds.has(element.id) ? (
                          <div className="spinner"></div>
                        ) : (
                          <><FaWandMagicSparkles /> {t('views.generatorMenuRemoveBackground')}</>
                        )}
                      </button>
                    </div>
                  )}

                  {(element.type === 'image' || element.type === 'element') && (
                    <div className="element-controls line">
                      <span>{t('elements.subtitleShadow')}</span>

                      <div className="font-controls">
                        <label>{t('elements.labelHorizontal')}
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
                        <label>{t('elements.labelVertical')}
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
                        disabled={processingShedowIds.has(element.id)}
                      >
                        {processingShedowIds.has(element.id) ? (
                          <div className="spinner"></div>
                        ) : (
                          <><FaWandMagicSparkles /> {t('elements.buttonAddShadow')}</>
                        )}
                      </button>
                    </div>
                  )}

                  {element.type === 'shape' && (
                    <div className="element-controls">
                      <span>{t('elements.subtitleColor')}</span>
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
                      <span>{t('elements.subtitleRadiusChange')}</span>
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
                      <span>{t('elements.subtitleGradient')}</span>
                      <div className="gradient-controls">
                        {/* Выбор направления */}
                        <div className="direction-buttons">
                          <button
                            onClick={() => handleGradientChange(element.id, 'direction', 'to right')}
                            className={element.gradient?.direction === 'to right' ? 'active' : ''}
                          >
                            →
                          </button>
                          <button
                            onClick={() => handleGradientChange(element.id, 'direction', 'to left')}
                            className={element.gradient?.direction === 'to left' ? 'active' : ''}
                          >
                            ←
                          </button>
                          <button
                            onClick={() => handleGradientChange(element.id, 'direction', 'to bottom')}
                            className={element.gradient?.direction === 'to bottom' ? 'active' : ''}
                          >
                            ↓
                          </button>
                          <button
                            onClick={() => handleGradientChange(element.id, 'direction', 'to top')}
                            className={element.gradient?.direction === 'to top' ? 'active' : ''}
                          >
                            ↑
                          </button>
                        </div>

                        {/* Выбор цветов */}
                        <div className="opacity-control">
                          <label>{t('elements.labelPointStart')}</label>
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
                          <label>{t('elements.subtitleColor')} 1:</label>
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
                          <label>{t('elements.subtitleColor')} 2:</label>
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
                      <span>{t('elements.subtitleTextFont')}</span>
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
                          {t('elements.labelFont')}
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
                          {t('elements.labelFontSize')}
                          <input
                            type="number"
                            value={element.fontSize || 24}
                            onChange={(e) => handleFontChange(element.id, 'fontSize', parseInt(e.target.value))}
                            min="8"
                          />
                        </label>

                        <label>
                          {t('elements.labelFontColor')} 
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
                    <span>{t('elements.subtitlePosition')}</span>
                    <div className="font-controls">
                      <label>
                        {t('elements.labelHorizontally')}, px:
                        <input
                          type="number"
                          value={(element.position.x).toFixed(0)}
                          onChange={(e) => onPositionChange(element.id, 'x', e.target.value)}
                        />
                      </label>
                      <label>
                        {t('elements.labelVertically')}, px:
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
                      <span>{t('elements.subtitleSize')}</span>
                      <div className="font-controls">
                      <label>
                        {t('elements.labelWidth')}, px:
                        <input
                          type="number"
                          value={(element.width).toFixed(0)}
                          onChange={(e) => onSizeChange(element.id, 'width', e.target.value)}
                        />
                      </label>
                      <label>
                        {t('elements.labelHeight')}, px:
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
                      <span>{t('elements.subtitleSize')}</span>
                      <div className="font-controls">
                      <label>
                        {t('elements.labelWidth')}, px:
                        <input
                          type="number"
                          value={(element.width).toFixed(0)}
                          onChange={(e) => onProportionalResize(element.id, 'width', e.target.value)}
                        />
                      </label>
                      <label>
                        {t('elements.labelHeight')}, px:
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
                    <span>{t('elements.subtitleRotation')}</span>
                    <div className="font-controls">
                      <label>
                        {t('elements.subtitleRotation')}, deg:
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
                    >
                      <RiDeleteBin2Line /> {t('modals.delete')}
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
};