import { useState } from 'react';

export const CollageTempleModal = ({
  setIsCollageTempleModalOpen,
  setCollageTemples,
  setSelectedCollageTemple
}) => {
  const [templateName, setTemplateName] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalStep, setModalStep] = useState('input'); // 'input', 'overwrite', 'success', 'error'

  const handleSaveTemplate = async (isOverwrite = false) => {
    try {
      const name = templateName.trim().toLowerCase();
      if (!name) return;
  
      // Получаем существующие шаблоны
      const existingTemplates = JSON.parse(localStorage.getItem('collagesLocal')) || {};
      console.log(isOverwrite)
      // Проверка на существующий шаблон
      const existingNames = Object.keys(existingTemplates).map(n => n.toLowerCase());
      if (!isOverwrite && existingNames.includes(name)) {
        setModalStep('overwrite');
        setModalMessage('Макет с таким именем уже существует!');
        return;
      }
  
      // Логика сохранения
      const storageKey = 'design-collage';
      const savedDesign = sessionStorage.getItem(storageKey);
      const currentDesign = savedDesign ? JSON.parse(savedDesign) : [];
  
      const modifiedDesign = currentDesign.map(element => ({
        ...element,
        image: element.type === 'image' && element.isProduct ? "{{ITEM_IMAGE}}" : element.image,
        text: element.type === 'text' && element.isProductCode ? "{{ITEM_CODE}}" : element.text
      }));
  
      const updatedTemplates = {
        ...existingTemplates,
        [name]: modifiedDesign
      };
  
      localStorage.setItem('collagesLocal', JSON.stringify(updatedTemplates));
      
      // Успешное сохранение
      setModalStep('success');
      setModalMessage('Макет успешно сохранён!');

      setCollageTemples(updatedTemplates); // Обновляем состояние шаблонов
      setSelectedCollageTemple(name); // Выбираем новый шаблон
      
      // Автоматическое закрытие через 2 сек
      setTimeout(() => {
        setIsCollageTempleModalOpen(false);
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
      setIsCollageTempleModalOpen(false);
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
                  setIsCollageTempleModalOpen(false);
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
                  setIsCollageTempleModalOpen(false);
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