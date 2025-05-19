import { useRef, useEffect } from "react";

export const FontControls = ({ element, onClose, onChange }) => {
  const controlsRef = useRef(null);
  
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
          className={`style-button bold ${element.fontWeight === 'bold' ? 'active' : ''}`}
          onClick={() => 
            onChange(element.id, 'fontWeight', 
              element.fontWeight === 'bold' ? 'normal' : 'bold'
            )
          }
        >
          B
        </button>
        
        <button
          className={`style-button italic ${element.fontStyle === 'italic' ? 'active' : ''}`}
          onClick={() => 
            onChange(element.id, 'fontStyle', 
              element.fontStyle === 'italic' ? 'normal' : 'italic'
            )
          }
        >
          I
        </button>
      </div>

      <label>
        Размер:
        <input
          type="number"
          value={element.fontSize || 24}
          onChange={(e) => onChange(element.id, 'fontSize', parseInt(e.target.value))}
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
            onChange={(e) => onChange(element.id, 'color', e.target.value)}
          />
          <div 
            className="color-preview"
            style={{ color: element.color || '#333333' }}
          />
        </div>
      </label>

      <label>
        Шрифт:&emsp;
        <select
          value={element.fontFamily || 'Arial'}
          onChange={(e) => onChange(element.id, 'fontFamily', e.target.value)}
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
  );
};