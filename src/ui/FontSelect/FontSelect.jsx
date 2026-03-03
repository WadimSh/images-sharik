import { useState, useRef, useEffect, useContext } from "react";
import { createPortal } from "react-dom"; // 🔥 Добавить импорт
import { LanguageContext } from "../../contexts/contextLanguage";
import './FontSelect.css';

export const FontSelect = ({
  options,
  value,
  onChange,
  onHover, 
  className = "",
  dropdownMaxHeight = "200px",
  disabled = false,
  optionStyle = {} 
}) => {
  const { t } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState("bottom");
  const [hoveredOption, setHoveredOption] = useState(null);
  const [dropdownStyles, setDropdownStyles] = useState({}); // 🔥 Для позиционирования портала
  
  const selectRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Фильтрация опций
  useEffect(() => {
    const filtered = Object.entries(options).filter(([key, label]) =>
      label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // 🔥 Обновленная функция для расчета позиции dropdown
  const updateDropdownPosition = () => {
    if (selectRef.current && isOpen) {
      const rect = selectRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = parseInt(dropdownMaxHeight) || 200;
      
      let position = "bottom";
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        position = "top";
      }
      setDropdownPosition(position);

      // Рассчитываем позицию для портала
      const styles = {
        position: 'fixed',
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        maxHeight: dropdownMaxHeight,
        zIndex: 99999,
      };

      if (position === "bottom") {
        styles.top = `${rect.bottom}px`;
      } else {
        styles.bottom = `${window.innerHeight - rect.top}px`;
      }

      setDropdownStyles(styles);
    }
  };

  // Обновляем позицию при открытии и скролле
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      
      // Обновляем позицию при скролле
      const handleScroll = () => {
        updateDropdownPosition();
      };
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleScroll);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleClickOutside = (event) => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsOpen(false);
      setSearchTerm("");
      setHoveredOption(null);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setSearchTerm("");
    setHoveredOption(null);
  };

  const handleOptionClick = (key) => {
    if (disabled) return;
    onChange(key);
    setIsOpen(false);
    setHoveredOption(null);
  };

  const handleOptionHover = (key) => {
    if (disabled || !onHover) return;
    setHoveredOption(key);
    onHover(key);
  };

  const handleOptionLeave = () => {
    if (disabled || !onHover) return;
    setHoveredOption(null);
  };

  return (
    <div className={`font-select-container ${className} ${disabled ? 'disabled' : ''}`} ref={selectRef}>
      {isOpen ? (
        <input
          ref={inputRef}
          type="text"
          className="font-select-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={options[value] || t('ui.searchPlaceholder')}
          disabled={disabled}
        />
      ) : (
        <div className={`font-select-header ${disabled ? 'disabled' : ''}`} onClick={handleSelectClick}>
          <span style={{ fontFamily: value || 'inherit' }}>{options[value] || t('ui.selectedMessage')}</span>
          <span className={`arrow ${isOpen ? 'up' : 'down'}`}></span>
        </div>
      )}

      {/* 🔥 Портальный dropdown */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className={`font-select-dropdown font-select-dropdown--${dropdownPosition}`}
          style={dropdownStyles}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(([key, label]) => (
              <div
                key={key}
                className={`font-select-option ${key === value ? "selected" : ""} ${key === hoveredOption ? "hovered" : ""}`}
                onClick={() => handleOptionClick(key)}
                onMouseEnter={() => handleOptionHover(key)}
                onMouseLeave={handleOptionLeave}
                style={{
                  ...optionStyle,
                  fontFamily: key,
                  backgroundColor: key === hoveredOption ? '#f0f0f0' : key === value ? '#e6f7ff' : 'transparent'
                }}
              >
                {label}
              </div>
            ))
          ) : (
            <div className="font-select-no-results">{t('ui.noResults')}</div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};