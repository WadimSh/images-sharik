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
  if (Object.keys(templates).length === 0) return null;

  return (
    <div className="template-select-wrapper">
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
                      title="Сохранить в файл"
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
                    title="Удалить макет"
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