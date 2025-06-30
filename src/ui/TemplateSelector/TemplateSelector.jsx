import { useEffect, useRef, useState } from 'react';
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
  const tooltipRef = useRef(null);
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    content: '',
    position: { top: 0, left: 0 }
  });

  // Проверка, обрезан ли текст
  const isTextTruncated = (element) => {
    return element && element.scrollWidth > element.clientWidth;
  };

  // Обработчик наведения на текст
  const handleNameMouseEnter = (e, name) => {
    const element = e.currentTarget;
    if (isTextTruncated(element)) {
      const rect = element.getBoundingClientRect();
      setTooltipState({
        visible: true,
        content: name,
        position: {
          top: rect.top - 10,
          left: rect.left
        }
      });
    }
  };

  const handleNameMouseLeave = () => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  };

  // Закрытие тултипа при клике в любом месте
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsTemplateListOpen(false);
      }
      
      // Закрываем тултип при любом клике
      setTooltipState(prev => ({ ...prev, visible: false }));
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Закрытие тултипа при скролле
  useEffect(() => {
    const handleScroll = () => {
      setTooltipState(prev => ({ ...prev, visible: false }));
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  // Закрытие тултипа при закрытии списка
  useEffect(() => {
    if (!isTemplateListOpen) {
      setTooltipState(prev => ({ ...prev, visible: false }));
    }
  }, [isTemplateListOpen]);

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
                  onMouseEnter={(e) => handleNameMouseEnter(e, name)}
                  onMouseLeave={handleNameMouseLeave}
                  onClick={() => {
                    onSelect(name);
                    loadTemplate(name);
                    setIsTemplateListOpen(false);
                    setTooltipState(prev => ({ ...prev, visible: false })); // Закрытие при выборе
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
      
      {/* Кастомный тултип */}
      {tooltipState.visible && (
        <div 
          ref={tooltipRef}
          className="template-tooltip"
          style={{
            top: `${tooltipState.position.top}px`,
            left: `${tooltipState.position.left}px`,
            transform: 'translateY(-100%)'
          }}
        >
          {tooltipState.content}
        </div>
      )}
    </div>
  );
};