import { useState, useRef, useEffect, useContext } from "react";

import { LanguageContext } from "../../contexts/contextLanguage";
import './CustomSelect.css';

export const CustomSelect = ({
  options,
  value,
  onChange,
  className = "",
  dropdownMaxHeight = "200px",
}) => {
  const { t } = useContext(LanguageContext);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState("bottom"); // "bottom" или "top"
  const selectRef = useRef(null);
  const inputRef = useRef(null);

  // Фильтрация опций
  useEffect(() => {
    const filtered = Object.entries(options).filter(([key, label]) =>
      label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
  }, [searchTerm, options]);

  // Автофокус при открытии и расчет позиции
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      
      // 🔥 РАСЧЕТ ПОЗИЦИИ ВЫПАДАЮЩЕГО СПИСКА
      if (selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const dropdownHeight = parseInt(dropdownMaxHeight) || 200;
        
        // Если внизу мало места, но сверху много - открываем вверху
        if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
          setDropdownPosition("top");
        } else {
          setDropdownPosition("bottom");
        }
      }
    }
  }, [isOpen, dropdownMaxHeight]);

  const handleClickOutside = (event) => {
    if (selectRef.current && !selectRef.current.contains(event.target)) {
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectClick = () => {
    setIsOpen(!isOpen);
    setSearchTerm("");
  };

  const handleOptionClick = (key) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select-container ${className}`} ref={selectRef}>
      {/* Заголовок заменяется на инпут при открытии */}
      {isOpen ? (
        <input
          ref={inputRef}
          type="text"
          className="custom-select-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={options[value] || t('ui.searchPlaceholder')}
        />
      ) : (
        <div className="custom-select-header" onClick={handleSelectClick}>
          <span>{options[value] || t('ui.selectedMessage')}</span>
          <span className={`arrow ${isOpen ? 'up' : 'down'}`}></span>
        </div>
      )}

      {/* 🔥 ВЫПАДАЮЩИЙ СПИСОК С АВТОМАТИЧЕСКИМ ПОЗИЦИОНИРОВАНИЕМ */}
      {isOpen && (
        <div 
          className={`custom-select-dropdown custom-select-dropdown--${dropdownPosition}`}
          style={{ maxHeight: dropdownMaxHeight }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(([key, label]) => (
              <div
                key={key}
                className={`custom-select-option ${key === value ? "selected" : ""}`}
                onClick={() => handleOptionClick(key)}
              >
                {label}
              </div>
            ))
          ) : (
            <div className="custom-select-no-results">{t('ui.noResults')}</div>
          )}
        </div>
      )}
    </div>
  );
};