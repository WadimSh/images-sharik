import { useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { LanguageContext } from '../contexts/contextLanguage';
import { designsDB } from '../utils/handleDB';

export const TemplateModal = ({
  setIsTemplateModalOpen,
  setTemplates,
  setSelectedTemplate
}) => {
  const { id } = useParams();
  const { t } = useContext(LanguageContext);

  const [templateName, setTemplateName] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalStep, setModalStep] = useState('input'); // 'input', 'overwrite', 'success', 'error'

  const handleSaveTemplate = async (isOverwrite = false) => {
    try {
      const name = templateName.trim().toLowerCase();
      if (!name) return;
  
      // Проверяем дубликаты в IndexedDB
      const existingInDB = await designsDB.getAll();
      const dbDuplicate = existingInDB.some(d => d.code.toLowerCase() === name);

      if (!isOverwrite && dbDuplicate) {
        setModalStep('overwrite');
        setModalMessage(t('template.exists'));
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
  
      try {
        if (isOverwrite) {
          // Удаляем старую версию, если перезаписываем
          await designsDB.delete(name);
        }
        
        await designsDB.add({
          code: name,          // Имя шаблона как ключ
          data: modifiedDesign, // Сам дизайн
          size: currentSize
        });

        // Обновляем список шаблонов из базы
        const updatedDesigns = await designsDB.getAll();
        const updatedTemplates = updatedDesigns.reduce((acc, design) => {
          acc[design.code] = design.data;
          return acc;
        }, {});
        
        // Успешное сохранение
        setModalStep('success');
        setModalMessage(t('template.saved'));

        setTemplates(updatedTemplates); // Обновляем состояние шаблонов
        setSelectedTemplate(name); // Выбираем новый шаблон

        // Автоматическое закрытие через 2 сек
        setTimeout(() => {
          setIsTemplateModalOpen(false);
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
      setIsTemplateModalOpen(false);
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
                  setIsTemplateModalOpen(false);
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
                  setIsTemplateModalOpen(false);
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