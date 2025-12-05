import { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';

import { LanguageContext } from '../contexts/contextLanguage';
import { useAuth } from '../contexts/AuthContext';
import { 
  apiCreateDesign, 
  apiGetDesignByName, 
  apiUpdateDesign,
  apiGetAllDesigns
} from '../services/templatesService';

export const TemplateModal = ({
  setIsTemplateModalOpen,
  setTemplates,
  setSelectedTemplate,
  setTemplateSize
}) => {
  const { id } = useParams();
  const { t } = useContext(LanguageContext);
  const { user } = useAuth();

  const [templateName, setTemplateName] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalStep, setModalStep] = useState('input'); // 'input', 'overwrite', 'success', 'error'
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTemplate = async (isOverwrite = false) => {
    try {
      const name = templateName.trim().toLowerCase();
      if (!name) return;

      setIsSaving(true);
  
      // Проверяем дубликаты в IndexedDB
      const existingDesign = await apiGetDesignByName(name);
      
      if (!isOverwrite && existingDesign) {
        setModalStep('overwrite');
        setModalMessage(t('template.exists'));
        setIsSaving(false);
        return;
      }
  
      // Логика сохранения
      const storageKey = `design-${id}`;
      const savedDesign = sessionStorage.getItem(storageKey);
      const currentDesign = savedDesign ? JSON.parse(savedDesign) : [];
      
      const savedSize = sessionStorage.getItem('size');
      const currentSize = savedSize ? JSON.parse(savedSize) : '900x1200';
  
      const modifiedDesign = currentDesign.map(element => ({
        ...element,
        image: element.type === 'image' && element.isProduct ? "{{ITEM_IMAGE}}" : element.image
      }));

      const designData = {
        name: name,
        data: modifiedDesign,
        size: currentSize,
        company: user.company[0].id
      };
  
      try {
        if (isOverwrite && existingDesign) {
          await apiUpdateDesign(existingDesign.id, {
            data: modifiedDesign,
            size: currentSize
          });
        } else {
          await apiCreateDesign(designData);
        }
        
        // Обновляем список шаблонов из базы
        const updatedDesigns = await apiGetAllDesigns(true);

        const updatedTemplates = {};
        const updatedTemplatesSize = {};
        
        updatedDesigns.forEach(design => {
          updatedTemplates[design.name] = design.data;
          updatedTemplatesSize[design.name] = design.size || '900x1200';
        });

        // Успешное сохранение
        setModalStep('success');
        setModalMessage(t('template.saved'));

        setTemplates(updatedTemplates); // Обновляем состояние шаблонов
        setTemplateSize(updatedTemplatesSize);
        
        setSelectedTemplate(name); // Выбираем новый шаблон

        // Автоматическое закрытие через 2 сек
        setTimeout(() => {
          setIsTemplateModalOpen(false);
          setModalStep('input');
          setTemplateName('');
        }, 2000);

      } catch (apiError) {
        console.error('API Error:', apiError);
        throw new Error("Save error");
      }
      
    } catch (error) {
      setModalStep('error');
      setModalMessage("Save error" + ': ' + error.message);
    }
  };

  const handleCloseModal = () => {
    if (!isSaving) {
      setIsTemplateModalOpen(false);
      setModalStep('input');
      setTemplateName('');
    }
  };
  
  return (
    <div className="modal-overlay" onClick={handleCloseModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {modalStep === 'input' ? (
          <>
            <h2>{t('template.create')}</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t('template.namePlaceholder')}
              className="template-input"
              maxLength={50} // Ограничение длины
              disabled={isSaving}
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && templateName.trim() && !isSaving) {
                  handleSaveTemplate();
                }
              }}
            />
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={handleCloseModal}
                disabled={isSaving}
              >
                {t('modals.cancel')}
              </button>
              <button
                className="create-button"
                onClick={() => handleSaveTemplate(false)}
                disabled={!templateName.trim() || isSaving}
              >
                {t('template.create')}
              </button>
            </div>
          </>
        ) : modalStep === 'overwrite' ? (
          <>
            <h2>{t('template.warning')}</h2>
            <p>{modalMessage}</p>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => {
                  setModalStep('input');
                  setIsSaving(false);
                }}
                disabled={isSaving}
              >
                {t('modals.cancel')}
              </button>
              <button
                className="create-button"
                onClick={() => handleSaveTemplate(true)}
                disabled={isSaving}
              >
                {t('template.overwrite')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{modalStep === 'success' ? t('template.success') : t('template.error')}</h2>
            <p>{modalMessage}</p>
            <div className="modal-actions">
              <button
                className="close-button"
                onClick={handleCloseModal}
                disabled={isSaving && modalStep === 'success'}
              >
                {t('modals.close')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};