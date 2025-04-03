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
        Шрифт:
        <select
          value={element.fontFamily || 'Arial'}
          onChange={(e) => onChange(element.id, 'fontFamily', e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Georgia">Georgia</option>
          <option value="Courier New">Courier New</option>
        </select>
      </label>
    </div>
  );
};