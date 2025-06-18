import { useEffect, useRef } from 'react';
import { FaSave } from 'react-icons/fa';
import './TemplateSelector.css';

export const TemplateSelector = ({
  templates,
  selectedTemplate,
  isTemplateListOpen,
  setIsTemplateListOpen,
  loadTemplate,
  onSelect,
  onDelete,
  onExport,
  showExport = true,
  placeholder = 'Выберите макет'
}) => {
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsTemplateListOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (Object.keys(templates).length === 0) return null;
  
  return (
    <div className="template-select-wrapper" ref={selectRef}>
      <div className="template-select-container">
        <div 
          className="template-select-header"
          onClick={() => setIsTemplateListOpen(!isTemplateListOpen)}
        >
          <span className="selected-template-text">
            {selectedTemplate || placeholder}
          </span>
          <span className={`arrow ${isTemplateListOpen ? 'up' : 'down'}`}></span>
        </div>
        {isTemplateListOpen && (
          <div className="template-list">
            {Object.keys(templates).map(name => (
              <div key={name} className="template-item">
                <span 
                  className="template-name"
                  onClick={() => {
                    onSelect(name);
                    loadTemplate(name);
                    setIsTemplateListOpen(false);
                  }}
                >
                  {name}
                </span>
                <div className="template-buttons">
                  {showExport && (
                    <button 
                      className="export-template-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExport(name);
                      }}
                    >
                      <FaSave />
                    </button>
                  )}
                  <button 
                    className="delete-template-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(name);
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 