import { useEffect, useRef, useContext } from 'react';
import { RxDragHandleDots2 } from "react-icons/rx";
import { FaChevronDown, FaWandMagicSparkles, FaPencil, FaArrowRightArrowLeft } from "react-icons/fa6";
import { RiDeleteBin2Line } from "react-icons/ri";
import { IoColorPaletteOutline } from "react-icons/io5";
import { TbRadiusTopLeft, TbRadiusTopRight, TbRadiusBottomLeft, TbRadiusBottomRight } from "react-icons/tb";
import { LuImageOff } from "react-icons/lu";
import { BsBorderWidth, BsLockFill, BsUnlockFill } from "react-icons/bs";
import { RxBorderWidth } from "react-icons/rx";
import { MdOpacity } from "react-icons/md";
import { FaArrowUp, FaArrowDown, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { GrTextAlignLeft, GrTextAlignCenter, GrTextAlignRight } from "react-icons/gr";

import { hexToRgba } from "../utils/hexToRgba";
import { DraggableElementItem } from './DraggableElemetItem';
import { LanguageContext } from '../contexts/contextLanguage';
import { Tooltip } from '../ui/Tooltip/Tooltip';
import { FontSelect } from '../ui/FontSelect/FontSelect';
import { BRAND_COLORS } from '../constants/brandColors';
import { BRAND_GRADIENT } from '../constants/brandGradient';
import { BRAND_IMAGES } from '../constants/brandImages';
import { BRAND_FONTS } from '../constants/brandFonts';

const fontOptions = {
  'GemarFont': 'GemarFont',
  'HeliosCond': 'HeliosCond',
  'BelbalFont': 'BelbalFont',
  'BelbalFontRegul': 'BelbalFontRegul',
  'FreeSetRegular': 'FreeSetRegular',
  'FreeSetBold': 'FreeSetBold',
  'MyriadPro': 'MyriadPro',
  'RF_Krabuler': 'RF Krabuler',
  'Bosk': 'Bosk',
  'Troubleside': 'Troubleside',
  'Badaboom': 'Badaboom',
  'FuturaRound': 'FuturaRound',
  'FuturaRoundDemi': 'FuturaRoundDemi',
  'RoslinGothic_DG': 'RoslinGothic 👻',
  'Alterna Nr': 'Alterna Nr 👻',
  'Jolly Lodger': 'Jolly Lodger 👻',
  'Swampy': 'Swampy 👻',
  'Magnolia-Script': 'Magnolia 🌷',
  'Lemon Tuesday': 'Lemon 🌷',
  'UniNeueLight': 'Uni Neue 🌷',
  'UniNeueHeavy-Italic': 'Uni Neue Heavy 🌷',
  'NautilusPompilius': 'Nautilus 🌷',
  'Cartonsix NC': 'Cartonsix 🎄',
  'Ice Kingdom': 'Ice Kingdom ⛄🎄',
  'Comic CAT': 'Comic 🎄❤️',
  'Pribambas': 'Pribambas 🎄🌷',
  'VividSans': 'VividSans 🎄',
  'Zametka': 'Zametka 🎄',
  'Kosko': 'Kosko ❤️',
  'Bebas Neue Cyrillic': 'Bebas Neue ⚔️',
  'ft83': 'Русский стиль 🪆',
  'Sunday': 'Русский стиль 2🪆',
  'HeliosCondBlack': 'Helios Cond Black 🎈',
  'Arial': 'Arial',
  'Times New Roman': 'Times New Roman',
  'Verdana': 'Verdana',
  'Georgia': 'Georgia',
  'Courier New': 'Courier New',
  'Calibri': 'Calibri',
  'Tahoma': 'Tahoma',
  'Impact': 'Impact',
  'Comic Sans MS': 'Comic Sans MS',
  'Lucida Sans': 'Lucida Sans',
  'Segoe UI': 'Segoe UI',
  'Cambria': 'Cambria',
  'Garamond': 'Garamond',
  'Franklin Gothic': 'Franklin Gothic',
  'Consolas': 'Consolas',
  'Palatino Linotype': 'Palatino Linotype',
  'Trebuchet MS': 'Trebuchet MS',
  'Book Antiqua': 'Book Antiqua',
  'Century Gothic': 'Century Gothic',
  'Candara': 'Candara'
};

export const ElementsList = ({
  elements,
  setElements,
  colorInputRef,
  borderColorInputRef,
  handleRemoveElement,
  handleFlipImage,
  handleColorButtonClick,
  handleRemoveBackground,
  handleAddShadow,
  handleDirectionChange,
  handleBorderRadiusChange,
  handleGradientChange,
  handleoOpacityChange,
  handleBorderChange,
  handleBorderColorChange,
  handleBorderColorButtonClick,
  handleLineThicknessChange,
  handleLineEndsChange,
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
  lockedElementId,
  setLockedElementId,
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

  // Функция для извлечения числового значения из строки направления
  const parseGradientAngle = (direction) => {
    if (!direction) return 0;

    // Извлекаем число из строк типа "45deg", "to right", "135deg" и т.д.
    const angleMatch = direction.match(/(\d+)deg/);
    if (angleMatch) return parseInt(angleMatch[1]);

    // Преобразуем ключевые слова в градусы
    switch (direction) {
      case 'to top': return 0;
      case 'to right': return 90;
      case 'to bottom': return 180;
      case 'to left': return 270;
      default: return 0;
    }
  };

  const handleSelectBackground = async (imagePath) => {
    try {
      // 1. Находим background элемент в массиве elements
      const backgroundElement = elements.find(el => el.type === 'background');
      if (!backgroundElement) {
        console.error('Background element not found');
        return;
      }
  
      // 2. Загружаем изображение для получения размеров
      const img = new Image();
      img.src = imagePath;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
  
      // 3. Обновляем background элемент
      setElements(prev => prev.map(el => {
        if (el.id === backgroundElement.id) {
          return {
            ...el,
            backgroundImage: imagePath,
            originalImageWidth: img.naturalWidth,
            originalImageHeight: img.naturalHeight,
            // Сохраняем цвет/градиент для полупрозрачных изображений
            color: el.color || '#ccddea',
            gradient: el.gradient || null
          };
        }
        return el;
      }));
  
    } catch (error) {
      console.error('Error loading background image:', error);
      alert('Could not set background image');
    }
  };

  const handleRemoveBackgroundImage = (elementId, setElements) => {
    setElements(prev => prev.map(el => {
      if (el.id === elementId) {
        // Создаем новый объект без backgroundImage, но сохраняем все остальные свойства
        const updatedElement = {
          ...el,
          backgroundImage: null,
          originalImageWidth: undefined,
          originalImageHeight: undefined,
          imageScale: undefined
        };
        
        // Удаляем ненужные свойства (опционально)
        delete updatedElement.originalImageWidth;
        delete updatedElement.originalImageHeight;
        delete updatedElement.imageScale;
        
        return updatedElement;
      }
      return el;
    }));
  };

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
          const isLocked = lockedElementId.has(element.id);
          const isBackground = element.type === 'background';
                 
          return (
            <DraggableElementItem
              key={element.id}
              element={element}
              originalIndex={originalIndex}
              moveElement={isBackground ? undefined : moveElement}
              elements={elements}
              isSelected={selectedElementIds.includes(element.id)}
              disabled={isExpanded}
              setExpandedElementId={setExpandedElementId}
              isBackground={isBackground}
            >
              <div 
                ref={el => {
                  if (el) {
                    elementRefs.current.set(element.id, el);
                  } else {
                    elementRefs.current.delete(element.id);
                  }
                }}
                className={`element-item ${(element.id === selectedElementId) && !isLocked ? 'selected' : ''} ${selectedElementIds.includes(element.id) && !isLocked ? 'selected' : ''} ${isExpanded ? 'disabled-drag' : ''}`}
                onClick={(e) => {
                  if (isBackground) return; // Запрещаем выбор фона
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
                    style={element.type === 'background' ? { color: '#ddd', cursor: 'no-drop' } : {}}
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedElementId(null); // Закрываем все меню
                    }}
                  />
                  <span style={{alignSelf: 'center'}}>
                    {element.type === 'text' && '📝 '}
                    {(element.type === 'image' || element.type === 'element' || (element.type === 'background' && element.backgroundImage)) && (
                      <img 
                        src={element.image || element.backgroundImage}
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
                    {(element.type === 'shape' || (element.type === 'background' && !element.backgroundImage)) && (
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
                    {element.type === 'line' && (
                      <div 
                        style={{
                          width: '30px',
                          height: '2px',
                          background: element.color,
                          transform: `rotate(-45deg)`,
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
                  {element.type === 'line' && t('elements.labelLine')}
                  {element.type === 'background' && t('elements.labelBackground')}
                </div>
                
                <div>
                  {!isBackground && <button 
                    className='expand-button'
                    onClick={(e) => {
                      e.stopPropagation();
                      setLockedElementId(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(element.id)) {
                          newSet.delete(element.id); // Разблокируем
                        } else {
                          newSet.add(element.id); // Блокируем
                        }
                        return newSet;
                      });
                    }}
                  >
                    {isLocked ? <BsLockFill /> : <BsUnlockFill />}
                  </button>}

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

                  {element.type === 'background' && (
                    <div className="element-controls">
                      <span>{t('elements.labelImage')}</span>
                      <div className="color-control" style={{ flexWrap: 'wrap' }}>
                        {BRAND_IMAGES.map((img, index) => (
                          <div 
                            key={index}
                            className="images-brand"
                            onClick={() => handleSelectBackground(img)}
                          >
                            <img 
                              src={img} 
                              alt={`Decoration ${index + 1}`}
                            />
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveBackgroundImage(element.id, setElements);
                        }}
                        className="remove-button"
                        disabled={!element.backgroundImage}
                      >
                        <><LuImageOff /> {t('ui.removeImage')}</>
                      </button>
                    </div>
                  )}

                  {element.type === 'background' && (
                    <div className="element-controls line">
                      <span>{t('elements.subtitleColor')}</span>
                      <div className="color-control" style={{ flexWrap: 'wrap' }}>
                        {BRAND_COLORS.map(brand => (
                          <Tooltip 
                          key={brand.title}
                          content={brand.title}
                          position={brand.position || 'bottom'}
                        >
                          <button 
                            onClick={() => {
                              setElements(prev => 
                                prev.map(el => 
                                  el.id === element.id 
                                    ? { ...el, color: brand.color, gradient: null } 
                                    : el
                                )
                              );
                            }}
                            style={{ 
                              background: brand.color,
                              border: element?.color === brand.color && "2px solid #2196F3",
                            }}
                            className="color-button"
                          />
                          </Tooltip>
                        ))}
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleColorButtonClick(element.id);
                        }}
                        className="remove-bg-button"
                      >
                        <><IoColorPaletteOutline /> {t('views.generatorMenuChangeColor')}</>
                      </button>
                    </div>
                  )}

                  {element.type === 'line' && (
                    <div className="element-controls">
                      <span>{t('elements.subtitleLine')}</span>
                      <div className="color-control">
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            background: element.color,
                            marginRight: '4px',
                            borderRadius: '2px'
                          }}
                        />
                        <span className="color-hex" style={{ userSelect: 'text' }}>{element.color}</span>
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
                      <div className="font-controls">
                        <label>
                          {`${t('elements.labelLineThickness')}, px:`}
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={element.lineThickness || 2}
                            onChange={(e) => handleLineThicknessChange(element.id, e.target.value)}
                          />
                        </label>
                      </div>
                      <div className="font-controls">
                        <label>
                          {t('elements.labelLineArrows')}
                          <div className="arrow-buttons">
                              <button
                                className={`arrow-btn ${element.lineEnds?.start === 'arrow' ? 'active' : ''}`}
                                onClick={() => handleLineEndsChange(
                                  element.id, 
                                  'start', 
                                  element.lineEnds?.start === 'arrow' ? 'none' : 'arrow'
                                )}
                                title={element.lineEnds?.start === 'arrow' ? 'Убрать стрелку' : 'Добавить стрелку'}
                              >
                                ←
                              </button>
                              <button
                                className={`arrow-btn ${element.lineEnds?.end === 'arrow' ? 'active' : ''}`}
                                onClick={() => handleLineEndsChange(
                                  element.id, 
                                  'end', 
                                  element.lineEnds?.end === 'arrow' ? 'none' : 'arrow'
                                )}
                                title={element.lineEnds?.end === 'arrow' ? 'Убрать стрелку' : 'Добавить стрелку'}
                              >
                                →
                              </button>
                            </div>
                        </label>
                      </div>
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
                      <span>{t('elements.labelBorder')}</span>
                      {element.borderWidth === 0 && <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBorderChange(element.id, 'width', 1);
                          handleBorderChange(element.id, 'color', '#000000')
                        }}
                        className="remove-bg-button"
                      >
                        <><BsBorderWidth /> {t('elements.buttonAddBorder')}</>
                      </button>}

                      {element.borderWidth !== 0 && <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBorderChange(element.id, 'width', 0)
                        }}
                        className="remove-button"
                      >
                        <><RxBorderWidth /> {t('elements.buttonRemoveBorder')}</>
                      </button>}
                      {element.borderWidth > 0 && <div className="color-control">
                        <div 
                          style={{
                            width: '20px',
                            height: '20px',
                            background: element.borderColor || '#000',
                            marginRight: '4px',
                            borderRadius: '2px',
                            marginLeft: '10px'
                          }}
                        />
                        <span className="color-hex" style={{ userSelect: 'text' }}>{element.borderColor || '#000000'}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBorderColorButtonClick(element.id);
                          }}
                          className="change-color-button"
                        >
                          <IoColorPaletteOutline 
                            style={{
                            width: '24px',
                            height: '24px',
                            marginRight: '10px'
                          }}
                          />
                        </button>
                      </div>}
                      {element.borderWidth > 0 && <div className="font-controls">
                        <label>
                          {t('elements.borderWidth')}, px:
                          <input
                            type="number"
                            min="0"
                            max="50"
                            value={element.borderWidth || 0}
                            onChange={(e) => handleBorderChange(element.id, 'width', parseInt(e.target.value) || 0)}
                          />
                        </label>
                      </div>}

                    </div>
                  )}

                  {element.type === 'background' && (
                    <div className="element-controls line">
                      <span>{t('elements.subtitleGradient')}</span>
                      <div className="color-control" style={{ flexWrap: 'wrap' }}>
                        {BRAND_GRADIENT.map(brand => (
                          <Tooltip 
                          key={brand.title}
                          content={brand.title}
                          position={brand.position || 'bottom'}
                        >
                          <button 
                            onClick={() => {
                              setElements(prev => prev.map(el => {
                                if (el.id === element.id) {
                                  return {
                                    ...el,
                                    // Сбрасываем цвет, если был задан ранее
                                    color: null,
                                    // Устанавливаем градиент из выбранного бренда
                                    gradient: {
                                      direction: brand.direction || 'to right', // Направление из BRAND_GRADIENT
                                      colors: brand.color,                      // Цвета из BRAND_GRADIENT
                                      opacity: [1, 1],                         // Фиксированная прозрачность
                                      start: 0,
                                    },
                                  };
                                }
                                return el;
                              }));
                              
                            }}
                            style={{ 
                              background: `linear-gradient(${brand.direction}, ${brand.color[0]}, ${brand.color[1]}${brand.color[2] ? `, ${brand.color[2]}` : ''})`,
                              border: element?.gradient?.colors?.join() === brand.color.join() && "2px solid #2196F3",
                            }}
                            className="color-button"
                          />
                          </Tooltip>
                        ))}
                      </div>

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

                        <div className="font-controls">
                          <label>
                            {t('elements.subtitleRotation')}, deg:
                            <input
                              type="number"
                              min="0"
                              max="360"
                              step="1"
                              value={parseGradientAngle(element.gradient?.direction) || 0}
                              onChange={(e) => {
                                const degrees = parseInt(e.target.value);
                                handleGradientChange(
                                  element.id, 
                                  'direction', 
                                  `${degrees}deg` // Преобразуем в CSS-формат (например "45deg")
                                );
                              }}
                            />
                          </label>
                        </div>

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
                        {/* Выбор цветов */}
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

                        {element.gradient?.colors?.[2] && <div className="opacity-control">
                          <label>{t('elements.subtitleColor')} 3:</label>
                          <input
                            type="color"
                            value={element.gradient?.colors?.[2] || '#ffffff'}
                            onChange={(e) => handleGradientChange(element.id, 'color3', e.target.value)}
                          />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={element.gradient?.opacity?.[2] || 1}
                            onChange={(e) => handleGradientChange(element.id, 'opacity3', e.target.value)}
                          />
                          <span>{(element.gradient?.opacity?.[2] || 1).toFixed(1)}</span>
                        </div>}
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

                        <div className="font-controls">
                          <label>
                            {t('elements.subtitleRotation')}, deg:
                            <input
                              type="number"
                              min="0"
                              max="360"
                              step="1"
                              value={parseGradientAngle(element.gradient?.direction) || 0}
                              onChange={(e) => {
                                const degrees = parseInt(e.target.value);
                                handleGradientChange(
                                  element.id, 
                                  'direction', 
                                  `${degrees}deg` // Преобразуем в CSS-формат (например "45deg")
                                );
                              }}
                            />
                          </label>
                        </div>

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
                        {/* Выбор цветов */}
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
                        <div className="style-controls-wrapper">
                          <div className="toggle-group">
                            <button
                              className={`toggle-option ${element.textAlign === 'left' ? 'active' : ''}`}
                              onClick={() => handleFontChange(element.id, 'textAlign', 'left')}
                            >
                              <GrTextAlignLeft />
                            </button>
                            <button
                              className={`toggle-option ${element.textAlign === 'center' ? 'active' : ''}`}
                              onClick={() => handleFontChange(element.id, 'textAlign', 'center')}
                            >
                              <GrTextAlignCenter />
                            </button>
                            <button
                              className={`toggle-option ${element.textAlign === 'right' ? 'active' : ''}`}
                              onClick={() => handleFontChange(element.id, 'textAlign', 'right')}
                            >
                              <GrTextAlignRight />
                            </button>
                            <div className="active-indicator" data-active-option={element.textAlign}></div>
                          </div>
                        </div>

                        <div className="style-controls" style={{ marginBottom: '20px'}}>
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
                            className={`style-button underline ${element.textDecoration === 'underline' ? 'active' : ''}`}
                            onClick={() => 
                              handleFontChange(element.id, 'textDecoration', 
                                element.textDecoration === 'underline' ? 'none' : 'underline'
                              )
                            }
                          >
                            U
                          </button>

                          <button
                            className={`style-button line-through ${element.textDecoration === 'line-through' ? 'active' : ''}`}
                            onClick={() => 
                              handleFontChange(element.id, 'textDecoration', 
                                element.textDecoration === 'line-through' ? 'none' : 'line-through'
                              )
                            }
                          >
                            S
                          </button>
                        </div>

                        <label>
                          {t('elements.labelFont')}
                          <FontSelect
                            options={BRAND_FONTS}
                            value={element.fontFamily || 'Arial'}
                            onChange={(fontValue) => handleFontChange(element.id, 'fontFamily', fontValue)}
                            onHover={(fontValue) => handleFontChange(element.id, 'fontFamily', fontValue)} // 🔥 Ховер применяет шрифт
                            dropdownMaxHeight="300px"
                            optionStyle={{
                              fontSize: (value) => value.includes('Gemar') ? '15px' : '18px'
                            }}
                          />
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
                  
                  {element.type !== 'background' && <div className="element-controls line">
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
                  </div>}

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

                  {element.type !== 'background' && <div className="element-controls line">
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
                  </div>}

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
      <input
        type="color"
        ref={borderColorInputRef}
        onChange={handleBorderColorChange} // ← Отдельный обработчик
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