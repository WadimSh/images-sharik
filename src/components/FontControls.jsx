import { useRef, useEffect, useState, useContext } from "react";

import { LanguageContext } from "../contexts/contextLanguage";

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
              // Определяем новое состояние на основе текущего состояния всех элементов
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
              // Определяем новое состояние на основе текущего состояния всех элементов
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
              setFontFamily(e.target.value);
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
        {isMulti ? '#333333' : element?.color || '#333333'}
        </div>
      </label>

      <label>
        {t('elements.labelFont')}&emsp;
        <select
          value={fontFamily}
          onChange={(e) => {
            if (isMulti) {
              onChangeMulti(selectedElementIds, 'fontFamily', e.target.value);
            } else {
              onChange(element?.id, 'fontFamily', e.target.value);
            }
          }}
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
    </div>
  );
};