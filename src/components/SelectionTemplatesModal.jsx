import { useContext, useEffect, useState } from "react";

import { PreviewDesign } from "./PreviewDesign";
import { LanguageContext } from "../contexts/contextLanguage";
import { designsDB } from "../utils/handleDB";

export const SelectionTemplatesModal = ({ isOpen, onClose, setTemplate }) => {
  const { t } = useContext(LanguageContext);

  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState({});
  const [isChecked, setIsChecked] = useState([]);
  const [selectedTemplates, setSelectedTemplates] = useState([]);

  const handleTemplateToggle = (templateKey, templateData) => {
    setIsChecked(prev => {
      if (prev.includes(templateKey)) {
        return prev.filter(key => key !== templateKey);
      } else {
        return [...prev, templateKey];
      }
    });
    setSelectedTemplates(prev => {
      if (prev.includes(templateData)) {
        return prev.filter(key => key !== templateData);
      } else {
        return [...prev, templateData];
      }
    });
  };

  const handleAddToTemplate = () => {
    setTemplate(prev => [...prev, ...selectedTemplates]);
    onClose();
  };

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setIsLoading(true);
        const designsFromDB = await designsDB.getAll();
        if (designsFromDB.length > 0) {
          const templatesObj = designsFromDB.reduce((acc, template) => {
            acc[template.code] = template.data;
            return acc;
          }, {});
          setTemplates(templatesObj);
        }
      } catch (error) {
        console.error('Layout deletion error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);
  
  return (
    <div className={`modal ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="modal-contente" onClick={(e) => e.stopPropagation()} style={{ width: '76vw', maxWidth: '76vw' }}>
        { Object.keys(templates).length === 0 ? (<>
          <div className="modal-header">
            <button onClick={onClose} className="close-btn" style={{ marginLeft: 'auto' }} aria-label={t('modals.close')}>&times;</button>
          </div>
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            <div className="limit-warning">
              Вы пока не создали ни одного макета для дизайна карточки. Вернитесь в редактор и создайте несколько вариантов. Это позволит 
              вам использовать их для разработки шаблонов.
            </div>
          )}
        </>) : (<>
          <div className="modal-header">
            <h2>Выберите необходимые макеты</h2>
            <button onClick={onClose} className="close-btn" aria-label={t('modals.close')}>&times;</button>
          </div>

          <div className="items-grid" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {Object.entries(templates).map(([templateKey, templateData]) => {
              const isChecke = isChecked.includes(templateKey);

              return(
              <div 
                key={templateKey} 
                className="item-card" 
                style={{ 
                  position: 'relative',
                  flexDirection: 'column', 
                  width: '100%', 
                  maxWidth: '270px', 
                  maxHeight: '360px', 
                  minWidth: '270px', 
                  minHeight: '360px', 
                }}
              >
                <div className="item-content" style={{ position: 'absolute' }}>
                  <PreviewDesign elements={templateData} />
                </div>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isChecke}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleTemplateToggle(templateKey, templateData);
                    }}
                  />
                  <span className="checkmark"></span>
                </label>
              </div>
              )})
            }
          </div>

          <div className="modal-footer">
            <div className="selection-counter">
              {`Выбрано макетов: ${isChecked.length}`}
            </div>
            <button 
              className="confirm-button"
              onClick={handleAddToTemplate}
              disabled={isChecked.length === 0}
            >
              Добавить в шаблон
            </button>
          </div>
        </>)}
        
      </div>
    </div>
  );
};