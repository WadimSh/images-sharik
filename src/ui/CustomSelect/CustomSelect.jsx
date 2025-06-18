import { useState, useRef, useEffect } from "react";
import './CustomSelect.css';

export const CustomSelect = ({
  options,
  value,
  onChange,
  className = "",
  dropdownMaxHeight = "200px",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleOptionClick = (key) => {
    onChange(key);
    setIsOpen(false);
  };

  return (
    <div className={`custom-select-container ${className}`} ref={selectRef}>
      <div
        className="custom-select-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{options[value]}</span>
        <span className={`arrow ${isOpen ? 'up' : 'down'}`}></span>
      </div>
      {isOpen && (
        <div
          className="custom-select-dropdown"
          style={{ maxHeight: dropdownMaxHeight }}
        >
          {Object.entries(options).map(([key, label]) => (
            <div
              key={key}
              className={`custom-select-option ${
                key === value ? "selected" : ""
              }`}
              onClick={() => handleOptionClick(key)}
            >
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};