import { useState, useContext } from 'react';

import { LanguageContext } from '../contexts/contextLanguage';
import { useAuth } from '../contexts/AuthContext';
import { 
  apiCreateCollage, 
  apiGetCollageByName, 
  apiUpdateCollage,
  apiGetAllCollages
} from '../services/templateService';

export const CollageTempleModal = ({
  setIsCollageTempleModalOpen,
  setCollageTemples,
  setSelectedCollageTemple,
  setCollageSize
}) => {
  const { t } = useContext(LanguageContext);
  const { user } = useAuth();

  const [templateName, setTemplateName] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalStep, setModalStep] = useState('input'); // 'input', 'overwrite', 'success', 'error'
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveTemplate = async (isOverwrite = false) => {
    try {
      const name = templateName.trim();
      if (!name) return;
      
      setIsSaving(true);

      // Проверяем дубликаты через API
      const existingCollage = await apiGetCollageByName(name);

      if (!isOverwrite && existingCollage) {
        setModalStep('overwrite');
        setModalMessage(t('template.exists'));
        setIsSaving(false);
        return;
      }
  
      // Логика сохранения
      const storageKey = 'design-collage';
      const savedDesign = localStorage.getItem(storageKey);
      const currentDesign = savedDesign ? JSON.parse(savedDesign) : [];

      const savedSize = localStorage.getItem('size');
      const currentSize = savedSize ? JSON.parse(savedSize) : '900x1200';
  
      // Заменяем динамические данные на плейсхолдеры
      const modifiedDesign = currentDesign.map(element => ({
        ...element,
        image: element.type === 'image' && element.isProduct ? "{{ITEM_IMAGE}}" : element.image,
        text: element.type === 'text' && element.isProductCode ? "{{ITEM_CODE}}" : element.text
      }));

      // Формируем данные для API
      const collageData = {
        name: name,
        data: modifiedDesign,
        size: currentSize,
        company: user.company[0].id
      };
  
      try {
        if (isOverwrite && existingCollage) {
          // Обновляем существующий коллаж по ID
          await apiUpdateCollage(existingCollage.id, {
            data: modifiedDesign,
            size: currentSize
          });
        } else {
          // Создаем новый коллаж
          await apiCreateCollage(collageData);
        }

        // Обновляем список коллажей из API
        const updatedCollages = await apiGetAllCollages(true); // force refresh
        
        const updatedTemplates = {};
        const updatedTemplatesSize = {};
        
        updatedCollages.forEach(collage => {
          updatedTemplates[collage.name] = collage.data;
          updatedTemplatesSize[collage.name] = collage.size || '900x1200';
        });

        // Успешное сохранение
        setModalStep('success');
        setModalMessage(t('template.saved'));

        setCollageTemples(updatedTemplates);
        setCollageSize(updatedTemplatesSize);

        setSelectedCollageTemple(name);

        // Автоматическое закрытие через 2 сек
        setTimeout(() => {
          setIsCollageTempleModalOpen(false);
          setModalStep('input');
          setTemplateName('');
          setIsSaving(false);
        }, 2000);
        
      } catch (apiError) {
        console.error('API Error:', apiError);
        throw new Error("Save error: " + (apiError.message || 'Unknown error'));
      }
    } catch (error) {
      setModalStep('error');
      setModalMessage(t('template.saveError') + ': ' + error.message);
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    if (!isSaving) {
      setIsCollageTempleModalOpen(false);
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