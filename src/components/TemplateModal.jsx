import { useState } from 'react';
import { useParams } from 'react-router-dom';

import { designsDB } from '../utils/handleDB';

export const TemplateModal = ({
  setIsTemplateModalOpen,
  setTemplates,
  setSelectedTemplate
}) => {
  const { id } = useParams();

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
        setModalMessage('Макет с таким именем уже существует!');
        return;
      }
  
      // Логика сохранения
      const storageKey = `design-${id}`;
      const savedDesign = sessionStorage.getItem(storageKey);
      const currentDesign = savedDesign ? JSON.parse(savedDesign) : [];
  
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
          data: modifiedDesign // Сам дизайн
        });

        // Обновляем список шаблонов из базы
        const updatedDesigns = await designsDB.getAll();
        const updatedTemplates = updatedDesigns.reduce((acc, design) => {
          acc[design.code] = design.data;
          return acc;
        }, {});
        
        // Успешное сохранение
        setModalStep('success');
        setModalMessage('Макет успешно сохранён!');

        setTemplates(updatedTemplates); // Обновляем состояние шаблонов
        setSelectedTemplate(name); // Выбираем новый шаблон

        // Автоматическое закрытие через 2 сек
        setTimeout(() => {
          setIsTemplateModalOpen(false);
          setModalStep('input');
          setTemplateName('');
        }, 2000);

      } catch (dbError) {
        console.error('Ошибка IndexedDB:', dbError);
        throw new Error('Не удалось сохранить в базу данных');
      }
      
      
      
    } catch (error) {
      setModalStep('error');
      setModalMessage('Ошибка при сохранении: ' + error.message);
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
            <h2>Создай свой макет</h2>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Введите название макета"
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
                Отменить
              </button>
              <button
                className="create-button"
                onClick={() => handleSaveTemplate(false)}
                disabled={!templateName.trim()}
              >
                Создать
              </button>
            </div>
          </>
        ) : modalStep === 'overwrite' ? (
          <>
            <h2>Внимание!</h2>
            <p>{modalMessage}</p>
            <div className="modal-actions">
              <button
                className="cancel-button"
                onClick={() => setModalStep('input')}
              >
                Отменить
              </button>
              <button
                className="create-button"
                onClick={() => handleSaveTemplate(true)}
              >
                Перезаписать
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>{modalStep === 'success' ? 'Успешно!' : 'Ошибка!'}</h2>
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
                Закрыть
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};