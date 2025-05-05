import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaClipboardCheck, FaSave } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import UPNG from 'upng-js';

export const HeaderSection = ({
  captureRef,
  slideNumber,
  templates,
  setTemplates,
  selectedTemplate,
  setSelectedTemplate,
  loadTemplate,
  handleCreateTemplate
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  // Функция для формирования заголовка
  const getHeaderTitle = () => {
    const slide = slideNumber || '1'; // По умолчанию первый слайд
    return slide === '1' 
      ? 'Основной слайд' 
      : `Слайд ${slide}`;
  };

  // Функция для удаления макета
  const handleDeleteTemplate = (templateName) => {
    const updatedTemplates = { ...templates };
    delete updatedTemplates[templateName];
    localStorage.setItem('templatesLocal', JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
    if (selectedTemplate === templateName) setSelectedTemplate('');
  };

  // Функция выгрузки макета в одельный файл
  const handleExportTemplate = (templateName) => {
    const template = templates[templateName];
    if (!template) return;
  
    // Формируем имя файла
    const fileName = templateName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zа-яё0-9_-]/gi, '') + '.json';
  
    // Создаем JSON строку
    const json = JSON.stringify(template, null, 2);
    
    // Создаем Blob и ссылку для скачивания
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Функция выгрузки слайда в формате png
  const handleDownload = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Формирование имени файла
      const [baseCode, slideNumber] = id.split('_');
      const slideType = slideNumber === '1' ? 'main' : `slide${slideNumber}`;
    
      const now = new Date();
      const datePart = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        now.getFullYear()
      ].join('');
    
      const timePart = [
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0')
      ].join('');

      const fileName = `${baseCode}_WB_${slideType}_900x1200_${datePart}_${timePart}.png`;

      // Генерация изображения
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF' // Убираем прозрачность для уменьшения размера
      });

      // Получаем сырые данные изображения
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
      // Оптимизация с UPNG
      const pngBuffer = UPNG.encode(
        [imageData.data.buffer], // Пиксельные данные
        canvas.width,
        canvas.height,
        256, // Количество цветов (256 = 8-битная палитра)
        0    // Задержка для анимации
      );

      // Создаем Blob и URL
      const blob = new Blob([pngBuffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();

      // Очистка
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert('Ошибка при генерации изображения!');
    }
  };

  // Эффект для загрузки макетов при монтировании и изменении
  useEffect(() => {
    const loadTemplates = () => {
      const savedTemplates = localStorage.getItem('templatesLocal');
      if (savedTemplates) {
        setTemplates(JSON.parse(savedTemplates));
      }
    };
  
    loadTemplates();
    // Слушаем изменения в localStorage
    window.addEventListener('storage', loadTemplates);
    return () => window.removeEventListener('storage', loadTemplates);
  }, []);

  return (
    <div className="header-section">
      <button onClick={handleBack} className='button-back'>
        {'< Назад'}
      </button>
      <h2>{getHeaderTitle()}</h2>
      <div className="template-select-wrapper">
        {Object.keys(templates).length > 0 && (
          <div className="template-select-container">
            <div 
              className="template-select-header"
              onClick={() => setIsTemplateListOpen(!isTemplateListOpen)}
            >
              <span className="selected-template-text">
                {selectedTemplate || 'Выберите макет'}
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
                        setSelectedTemplate(name);
                        loadTemplate(name);
                        setIsTemplateListOpen(false);
                      }}
                    >
                      {name}
                    </span>
                    <div className="template-buttons">
                      <button 
                        className="export-template-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportTemplate(name);
                        }}
                        title="Сохранить в файл"
                      >
                        <FaSave />
                      </button>
                      <button 
                        className="delete-template-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTemplate(name);
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
        )}
      </div>
      <button onClick={handleCreateTemplate} className="template-button">
        <FaClipboardCheck /> Создать макет
      </button>
      <button onClick={handleDownload} className="download-button">
        <FaDownload /> Скачать дизайн
      </button>
    </div>
  );
};
