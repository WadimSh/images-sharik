import { useState } from 'react';
import { useParams } from 'react-router-dom';

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
  
      // Получаем существующие шаблоны
      const existingTemplates = JSON.parse(localStorage.getItem('templatesLocal')) || {};
      console.log(isOverwrite)
      // Проверка на существующий шаблон
      const existingNames = Object.keys(existingTemplates).map(n => n.toLowerCase());
      if (!isOverwrite && existingNames.includes(name)) {
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
  
      const updatedTemplates = {
        ...existingTemplates,
        [name]: modifiedDesign
      };
  
      localStorage.setItem('templatesLocal', JSON.stringify(updatedTemplates));
      
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