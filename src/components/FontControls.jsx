import { useRef, useEffect, useState, useContext } from "react";
import { LanguageContext } from "../contexts/contextLanguage";
import { BRAND_FONTS } from "../constants/brandFonts"; 

export const FontControls = ({ element, onClose, onChange, onChangeMulti, isMulti, selectedElementIds, elements }) => {
  const controlsRef = useRef(null);
  const { t } = useContext(LanguageContext);
  const [fontSize, setFontSize] = useState(element?.fontSize || 24);
  const [fontFamily, setFontFamily] = useState(element?.fontFamily || 'Arial');
  
  // Функция для проверки состояния стиля у всех выбранных элементов
  const checkMultiStyleState = (property, value) => {
    if (!isMulti || !selectedElementIds || !elements) return false;
    return selectedElementIds.every(id => 
      elements.find(el => el.id === id)?.[property] === value
    );
  };

  // Обновляем fontSize когда меняется element
  useEffect(() => {
    setFontSize(element?.fontSize || 24);
  }, [element?.fontSize]);

  useEffect(() => {
    setFontFamily(element?.fontFamily || 'Arial');
  }, [element?.fontFamily]);
  
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (controlsRef.current && !controlsRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
  
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Функция для определения размера шрифта в опции
  const getFontSizeForOption = (fontKey) => {
    if (fontKey === 'GemarFont') return '15px';
    return '18px';
  };
  
  return (
    <div className="font-controls" ref={controlsRef}>
      <div className="style-controls">
        <button
          className={`style-button bold ${
            isMulti 
              ? checkMultiStyleState('fontWeight', 'bold') ? 'active' : ''
              : element?.fontWeight === 'bold' ? 'active' : ''
          }`}
          onClick={() => {
            if (isMulti) {
              const newState = !checkMultiStyleState('fontWeight', 'bold') ? 'bold' : 'normal';
              onChangeMulti(selectedElementIds, 'fontWeight', newState);
            } else {
              onChange(element?.id, 'fontWeight', 
                element?.fontWeight === 'bold' ? 'normal' : 'bold'
              );
            }
          }}
        >
          B
        </button>
        
        <button
          className={`style-button italic ${
            isMulti 
              ? checkMultiStyleState('fontStyle', 'italic') ? 'active' : ''
              : element?.fontStyle === 'italic' ? 'active' : ''
          }`}
          onClick={() => {
            if (isMulti) {
              const newState = !checkMultiStyleState('fontStyle', 'italic') ? 'italic' : 'normal';
              onChangeMulti(selectedElementIds, 'fontStyle', newState);
            } else {
              onChange(element?.id, 'fontStyle', 
                element?.fontStyle === 'italic' ? 'normal' : 'italic'
              );
            }
          }}
        >
          I
        </button>

        <button
          className={`style-button underline ${element?.textDecoration === 'underline' ? 'active' : ''}`}
          onClick={() => { 
            if (isMulti) {
              const newState = !checkMultiStyleState('textDecoration', 'underline') ? 'underline' : 'none';
              onChangeMulti(selectedElementIds, 'textDecoration', newState);
            } else {
              onChange(element?.id, 'textDecoration', 
                element?.textDecoration === 'underline' ? 'none' : 'underline'
              );
            }
          }}
        >
          U
        </button>

        <button
          className={`style-button line-through ${element?.textDecoration === 'line-through' ? 'active' : ''}`}
          onClick={() => {
            if (isMulti) {
              const newState = !checkMultiStyleState('textDecoration', 'line-through') ? 'line-through' : 'none';
              onChangeMulti(selectedElementIds, 'textDecoration', newState);
            } else {
              onChange(element?.id, 'textDecoration', 
                element?.textDecoration === 'line-through' ? 'none' : 'line-through'
              );
            }
          }}
        >
          S
        </button>
      </div>

      <label>
        {t('elements.labelFontSize')}
        <input
          type="number"
          value={fontSize}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 24;
            setFontSize(value);
            if (isMulti) {
              onChangeMulti(selectedElementIds, 'fontSize', value);
            } else {
              onChange(element?.id, 'fontSize', value);
            }
          }}
          min="8"
          max="72"
        />
      </label>
      
      <label>
        {t('elements.labelFontColor')} 
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="color-picker-wrapper">
            <input
              type="color"
              className="color-picker-input"
              value={isMulti ? '#333333' : element?.color || '#333333'}
              onChange={(e) => {
                if (isMulti) {
                  onChangeMulti(selectedElementIds, 'color', e.target.value);
                } else {
                  onChange(element?.id, 'color', e.target.value);
                }
              }}
            />
            <div 
              className="color-preview"
              style={{ color: isMulti ? '#333333' : element?.color || '#333333' }}
            />
          </div>
          <span className="color-hex">
            {isMulti ? '#333333' : element?.color || '#333333'}
          </span>
        </div>
      </label>

      <label>
        {t('elements.labelFont')}&emsp;
        <select
          value={fontFamily}
          onChange={(e) => {
            setFontFamily(e.target.value);
            if (isMulti) {
              onChangeMulti(selectedElementIds, 'fontFamily', e.target.value);
            } else {
              onChange(element?.id, 'fontFamily', e.target.value);
            }
          }}
        >
          {/* Генерируем опции из BRAND_FONTS */}
          {Object.entries(BRAND_FONTS).map(([fontKey, fontLabel]) => (
            <option 
              key={fontKey} 
              value={fontKey}
              style={{ 
                fontFamily: fontKey, 
                fontSize: getFontSizeForOption(fontKey)
              }}
            >
              {fontLabel}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};