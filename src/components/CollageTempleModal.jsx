import { useState, useContext } from 'react';
import { LanguageContext } from '../contexts/contextLanguage';
import { collageDB } from '../utils/handleDB';

export const CollageTempleModal = ({
  setIsCollageTempleModalOpen,
  setCollageTemples,
  setSelectedCollageTemple,
  setCollageSize
}) => {
  const { t } = useContext(LanguageContext);
  const [templateName, setTemplateName] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalStep, setModalStep] = useState('input'); // 'input', 'overwrite', 'success', 'error'

  const handleSaveTemplate = async (isOverwrite = false) => {
    try {
      const name = templateName.trim().toLowerCase();
      if (!name) return;
  
      // Проверяем дубликаты в IndexedDB
      const existingInDB = await collageDB.getAll();
      const dbDuplicate = existingInDB.some(d => d.code.toLowerCase() === name);

      if (!isOverwrite && dbDuplicate) {
        setModalStep('overwrite');
        setModalMessage(t('template.exists'));
        return;
      }
  
      // Логика сохранения
      const storageKey = 'design-collage';
      const savedDesign = localStorage.getItem(storageKey);
      const currentDesign = savedDesign ? JSON.parse(savedDesign) : [];

      const savedSize = localStorage.getItem('size');
      const currentSize = savedSize ? JSON.parse(savedSize) : '900x1200';
  
      const modifiedDesign = currentDesign.map(element => ({
        ...element,
        image: element.type === 'image' && element.isProduct ? "{{ITEM_IMAGE}}" : element.image,
        text: element.type === 'text' && element.isProductCode ? "{{ITEM_CODE}}" : element.text
      }));
  
      try {
        if (isOverwrite) {
          // Удаляем старую версию, если перезаписываем
          await collageDB.delete(name);
        }
        
        await collageDB.add({
          code: name,
          elements: modifiedDesign,
          size: currentSize
        });

        // Обновляем список шаблонов из базы
        const updatedCollages = await collageDB.getAll();
        const updatedTemplates = updatedCollages.reduce((acc, collage) => {
          acc[collage.code] = collage.elements;
          return acc;
        }, {});
        const updatedTemplatesSize = updatedCollages.reduce((acc, template) => {
          acc[template.code] = template.size || '900x1200';
          return acc;
        }, {});

        // Успешное сохранение
        setModalStep('success');
        setModalMessage(t('template.saved'));

        setCollageTemples(updatedTemplates); // Обновляем состояние шаблонов
        setCollageSize(updatedTemplatesSize);

        setSelectedCollageTemple(name); // Выбираем новый шаблон

        // Автоматическое закрытие через 2 сек
        setTimeout(() => {
          setIsCollageTempleModalOpen(false);
          setModalStep('input');
          setTemplateName('');
        }, 2000);
        
      } catch (dbError) {
        console.error('DB Error:', dbError);
        throw new Error("Save error");
      }
    } catch (error) {
      setModalStep('error');
      setModalMessage("Save error" + ': ' + error.message);
    }
  };
  
  return (
    <div className="modal-overlay" onClick={() => {
      setIsCollageTempleModalOpen(false);
      setModalStep('input');
      setTemplateName('');
    }}>
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
              onKeyDown={(e) => { 
                if (e.key === 'Enter' && templateName.trim()) {
                  handleSaveTemplate();
                }
              }}
            />
            <div className="modal-actions">
              <button 
                className="cancel-button"
                onClick={() => {
                  setIsCollageTempleModalOpen(false);
                  setTemplateName('');
                }}
              >
                {t('modals.cancel')}
              </button>
              <button
                className="create-button"
                onClick={() => handleSaveTemplate(false)}
                disabled={!templateName.trim()}
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
                onClick={() => setModalStep('input')}
              >
                {t('modals.cancel')}
              </button>
              <button
                className="create-button"
                onClick={() => handleSaveTemplate(true)}
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
                onClick={() => {
                  setIsCollageTempleModalOpen(false);
                  setModalStep('input');
                  setTemplateName('');
                }}
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