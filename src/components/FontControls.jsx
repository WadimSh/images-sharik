import { useRef, useEffect } from "react";

export const FontControls = ({ element, onClose, onChange }) => {
  const controlsRef = useRef(null);
  // Полный список шрифтов Windows с группировкой
  const fontGroups = [
    {
      group: "Основные",
      fonts: [
        'Arial', 'Arial Black', 'Arial Narrow',
        'Calibri', 'Calibri Light',
        'Times New Roman', 
        'Verdana', 'Tahoma',
        'Segoe UI', 'Segoe Print', 'Segoe Script',
        'Georgia', 'Cambria', 'Candara'
      ]
    },
    {
      group: "Заголовочные",
      fonts: [
        'Impact', 'Rockwell', 'Franklin Gothic',
        'Bahnschrift', 'Britannic Bold', 'Haettenschweiler'
      ]
    },
    {
      group: "Рукописные",
      fonts: [
        'Comic Sans MS', 'MV Boli', 'Ink Free',
        'Lucida Handwriting', 'Papyrus'
      ]
    },
    {
      group: "Моноширинные",
      fonts: [
        'Consolas', 'Courier New', 'Lucida Console',
        'MS Gothic', 'OCR A Extended'
      ]
    },
    {
      group: "Классические",
      fonts: [
        'Garamond', 'Book Antiqua', 'Palatino Linotype',
        'Century Gothic', 'Baskerville Old Face'
      ]
    },
    {
      group: "Специальные",
      fonts: [
        'Wingdings', 'Wingdings 2', 'Wingdings 3',
        'Webdings', 'Symbol'
      ]
    }
  ];


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