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

        <button
          className={`style-button underline ${element.textDecoration === 'underline' ? 'active' : ''}`}
          onClick={() => { 
            if (isMulti) {
              const newState = !checkMultiStyleState('textDecoration', 'underline') ? 'underline' : 'none';
              onChangeMulti(selectedElementIds, 'textDecoration', newState);
            } else {
              onChange(element.id, 'textDecoration', 
                element.textDecoration === 'underline' ? 'none' : 'underline'
              );
            }
          }}
        >
          U
        </button>

        <button
          className={`style-button line-through ${element.textDecoration === 'line-through' ? 'active' : ''}`}
          onClick={() => {
            if (isMulti) {
              const newState = !checkMultiStyleState('textDecoration', 'line-through') ? 'line-through' : 'none';
              onChangeMulti(selectedElementIds, 'textDecoration', newState);
            } else {
              onChange(element.id, 'textDecoration', 
                element.textDecoration === 'line-through' ? 'none' : 'line-through'
              )
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
          <option value="GemarFont" style={{ fontFamily: 'GemarFont', fontSize: '15px' }}>GemarFont</option>
          <option value="HeliosCond" style={{ fontFamily: 'HeliosCond', fontSize: '18px' }}>HeliosCond</option>
          <option value="BelbalFont" style={{ fontFamily: 'BelbalFont', fontSize: '18px' }}>BelbalFont</option>
          <option value="BelbalFontRegul" style={{ fontFamily: 'BelbalFontRegul', fontSize: '18px' }}>BelbalFontRegul</option>
          <option value="FreeSetRegular" style={{ fontFamily: 'FreeSetRegular', fontSize: '18px' }}>FreeSetRegular</option>
          <option value="FreeSetBold" style={{ fontFamily: 'FreeSetBold', fontSize: '18px' }}>FreeSetBold</option>
          <option value="MyriadPro" style={{ fontFamily: 'MyriadPro', fontSize: '18px' }}>MyriadPro</option>
          <option value="RF_Krabuler" style={{ fontFamily: 'RF_Krabuler', fontSize: '18px' }}>RF Krabuler</option>
          <option value="Bosk" style={{ fontFamily: 'Bosk', fontSize: '18px' }}>Bosk</option>
          <option value="Troubleside" style={{ fontFamily: 'Troubleside', fontSize: '18px' }}>Troubleside</option>
          <option value="Badaboom" style={{ fontFamily: 'Badaboom', fontSize: '18px' }}>Badaboom</option>
          <option value="FuturaRound" style={{ fontFamily: 'FuturaRound', fontSize: '18px' }}>FuturaRound</option>
          <option value="FuturaRoundDemi" style={{ fontFamily: 'FuturaRoundDemi', fontSize: '18px' }}>FuturaRoundDemi</option>
          <option value="RoslinGothic_DG" style={{ fontFamily: 'RoslinGothic_DG', fontSize: '18px' }}>RoslinGothic 👻</option>
          <option value="Alterna Nr" style={{ fontFamily: 'Alterna Nr', fontSize: '18px' }}>Alterna Nr 👻</option>
          <option value="Jolly Lodger" style={{ fontFamily: 'Jolly Lodger', fontSize: '18px' }}>Jolly Lodger 👻</option>
          <option value="Swampy" style={{ fontFamily: 'Swampy', fontSize: '18px' }}>Swampy 👻</option>
          <option value="Cartonsix NC" style={{ fontFamily: 'Cartonsix NC', fontSize: '18px' }}>Cartonsix 🎄</option>
          <option value="Ice Kingdom" style={{ fontFamily: 'Ice Kingdom', fontSize: '18px' }}>Ice Kingdom ⛄🎄</option>
          <option value="Comic CAT" style={{ fontFamily: 'Comic CAT', fontSize: '18px' }}>Comic 🎄❤️</option>
          <option value="Pribambas" style={{ fontFamily: 'Pribambas', fontSize: '18px' }}>Pribambas 🎄🌷</option>
          <option value="VividSans" style={{ fontFamily: 'VividSans', fontSize: '18px' }}>VividSans 🎄</option>
          <option value="Zametka" style={{ fontFamily: 'Zametka', fontSize: '18px' }}>Zametka 🎄</option>
          <option value="Kosko" style={{ fontFamily: 'Kosko', fontSize: '18px' }}>Kosko ❤️</option>
          <option value="ft83" style={{ fontFamily: 'ft83', fontSize: '18px' }}>Русский стиль 🪆</option>
          <option value="Sunday" style={{ fontFamily: 'Sunday', fontSize: '18px' }}>Русский стиль 2🪆</option>
          <option value="HeliosCondBlack" style={{ fontFamily: 'HeliosCondBlack', fontSize: '18px' }}>Helios Cond Black 🎈</option>
          <option value="Arial" style={{ fontFamily: 'Arial', fontSize: '18px' }}>Arial</option>
          <option value="Arial" style={{ fontFamily: 'Arial', fontSize: '18px' }}>Arial</option>
          <option value="Times New Roman" style={{ fontFamily: 'Times New Roman', fontSize: '18px' }}>Times New Roman</option>
          <option value="Verdana" style={{ fontFamily: 'Verdana', fontSize: '18px' }}>Verdana</option>
          <option value="Georgia" style={{ fontFamily: 'Georgia', fontSize: '18px' }}>Georgia</option>
          <option value="Courier New" style={{ fontFamily: 'Courier New', fontSize: '18px' }}>Courier New</option>
          <option value="Calibri" style={{ fontFamily: 'Calibri', fontSize: '18px' }}>Calibri</option>
          <option value="Tahoma" style={{ fontFamily: 'Tahoma', fontSize: '18px' }}>Tahoma</option>
          <option value="Impact" style={{ fontFamily: 'Impact', fontSize: '18px' }}>Impact</option>
          <option value="Comic Sans MS" style={{ fontFamily: 'Comic Sans MS', fontSize: '18px' }}>Comic Sans MS</option>
          <option value="Lucida Sans" style={{ fontFamily: 'Lucida Sans', fontSize: '18px' }}>Lucida Sans</option>
          <option value="Segoe UI" style={{ fontFamily: 'Segoe UI', fontSize: '18px' }}>Segoe UI</option>
          <option value="Cambria" style={{ fontFamily: 'Cambria', fontSize: '18px' }}>Cambria</option>
          <option value="Garamond" style={{ fontFamily: 'Garamond', fontSize: '18px' }}>Garamond</option>
          <option value="Franklin Gothic" style={{ fontFamily: 'Franklin Gothic', fontSize: '18px' }}>Franklin Gothic</option>
          <option value="Consolas" style={{ fontFamily: 'Consolas', fontSize: '18px' }}>Consolas</option>
          <option value="Palatino Linotype" style={{ fontFamily: 'Palatino Linotype', fontSize: '18px' }}>Palatino Linotype</option>
          <option value="Trebuchet MS" style={{ fontFamily: 'Trebuchet MS', fontSize: '18px' }}>Trebuchet MS</option>
          <option value="Book Antiqua" style={{ fontFamily: 'Book Antiqua', fontSize: '18px' }}>Book Antiqua</option>
          <option value="Century Gothic" style={{ fontFamily: 'Century Gothic', fontSize: '18px' }}>Century Gothic</option>
          <option value="Candara" style={{ fontFamily: 'Candara', fontSize: '18px' }}>Candara</option>
        </select>
      </label>
    </div>
  );
};