import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaClipboardCheck } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import UPNG from 'upng-js';

import { TemplateSelector } from '../ui/TemplateSelector/TemplateSelector';
import { useMarketplace } from '../contexts/contextMarketplace';
import { designsDB, collageDB, historyDB } from '../utils/handleDB';
import { LanguageContext } from '../contexts/contextLanguage';

export const HeaderSection = ({
  captureRef,
  slideNumber,
  templates,
  setTemplates,
  selectedTemplate,
  setSelectedTemplate,
  collageTemples,
  setCollageTemples,
  selectedCollageTemple,
  setSelectedCollageTemple,
  loadTemplate,
  loadCollageTemplate,
  handleCreateTemplate,
  handleCreateCollageTemple
}) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { marketplace } = useMarketplace();
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleBack = () => {
    if (!slideNumber) {
      localStorage.removeItem('design-collage');
      localStorage.removeItem('collage-articles');
    } else {
      const baseCode = id.split('_').slice(0, -1).join('_');
      sessionStorage.removeItem(`design-${id}`);
      sessionStorage.removeItem(`product-${baseCode}`);
    }
    navigate(-1);
  };
  
  // Функция для формирования заголовка
  const getHeaderTitle = () => {
    const slide = slideNumber || 'collage'; // По умолчанию первый слайд
    
    if (slide === 'collage') {
      return marketplace === 'WB' 
        ? t('header.wbCollage') 
        : t('header.ozonCollage');
    }

    if (slide === '1') {
      return t('header.mainSlide');
    }

    return `${t('header.slideNumber')} ${slide}`;
  };

  // Функция для удаления макета
  const handleDeleteTemplate = async(templateName) => {
    try {
      await designsDB.delete(templateName);

      const updatedTemplates = await designsDB.getAll();
      const updatedTemplatesObj = updatedTemplates.reduce((acc, template) => {
        acc[template.code] = template.data;
        return acc;
      }, {});

      setTemplates(updatedTemplatesObj);
      if (selectedTemplate === templateName) setSelectedTemplate('');
    } catch (error) {
      console.error('Ошибка удаления макета:', error);
    }
  };

  const handleDeleteCollageTemple = async(templateName) => {
    try {
      await collageDB.delete(templateName);

      const updatedCollages = await collageDB.getAll();
      const updatedCollagesObj = updatedCollages.reduce((acc, collage) => {
        acc[collage.code] = collage.elements;
        return acc;
      }, {});

      setCollageTemples(updatedCollagesObj);
      if (selectedCollageTemple === templateName) setSelectedCollageTemple('');
    } catch (error) {
      console.error('Ошибка удаления макета:', error);
    }
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
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      let baseCode, slideType;
      let slideNumberPart = slideNumber;
      
      // Определяем базовый код в зависимости от режима
      if (slideNumber === '') {
        const articles = JSON.parse(localStorage.getItem('collage-articles')) || [];
        baseCode = articles.length > 0 ? articles.join('_') : 'collage';
        slideType = 'collage';
      } else {
        [baseCode, slideNumberPart] = id.split('_');
        slideType = slideNumberPart === '1' ? 'main' : `slide${slideNumberPart}`;
      }
    
      // Формируем дату и время
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

      // Формирование имени файла
      const fileName = `${baseCode}_${marketplace}_${slideType}_900x1200_${datePart}_${timePart}.png`;

      // Получаем ключ для хранилища
      const sessionKey = slideNumber ? `design-${id}` : 'design-collage';

      // Достаём данные из соответствующего хранилища
      const designData = sessionKey === 'design-collage' 
        ? localStorage.getItem(sessionKey) 
        : sessionStorage.getItem(sessionKey);

      // Если данные есть и fileName определён - сохраняем в историю
      if (designData && fileName) {
        const historyKey = fileName.replace('.png', '');
        await historyDB.put({
          code: historyKey,  // Используем имя файла как ключ
          data: JSON.parse(designData)   // Сохраняем сырые данные
        });
      }

      // Генерация изображения
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        imageRendering: 'pixelated' // Улучшаем рендеринг
      });

      // Получаем сырые данные изображения
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
      // Оптимизация с UPNG с лучшими настройками для градиентов
      const pngBuffer = UPNG.encode(
        [imageData.data.buffer],
        canvas.width,
        canvas.height,
        0,    // 0 = 32-bit RGBA, сохраняем полное качество цвета
        0,    // Задержка для анимации
        {
          cnum: 50000,  // Увеличиваем количество цветов в палитре
          dith: 1,      // Включаем дизеринг для лучших градиентов
          filter: 0     // Используем адаптивную фильтрацию
        }
      );

      // Создаем Blob и URL
      const blob = new Blob([pngBuffer], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      setLoading(false);
      // Очистка
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert('Ошибка при генерации изображения!');
    }
  };

  const templateProps = {
    templates: slideNumber ? templates : collageTemples,
    selectedTemplate: slideNumber ? selectedTemplate : selectedCollageTemple,
    isTemplateListOpen,
    setIsTemplateListOpen,
    onSelect: slideNumber ? setSelectedTemplate : setSelectedCollageTemple,
    loadTemplate: slideNumber ? loadTemplate : loadCollageTemplate,
    onExport: slideNumber ? handleExportTemplate : undefined,
    onDelete: slideNumber ? handleDeleteTemplate : handleDeleteCollageTemple,
    showExport: !!slideNumber,
    placeholder: t('header.placeholder')
  };

  // Эффект для загрузки макетов при монтировании и изменении
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const savedLocalTemplates = JSON.parse(localStorage.getItem('templatesLocal') || '{}');
        const hasLocalTemplates = Object.keys(savedLocalTemplates).length > 0;
        if (hasLocalTemplates) {
          try {
            // Переносим каждый шаблон в базу
            await Promise.all(
              Object.entries(savedLocalTemplates).map(async ([name, data]) => {
                try {
                  // Проверяем, нет ли уже такого шаблона в базе
                  const existing = await designsDB.get(name);
                  if (!existing) {
                    await designsDB.add({
                      code: name,
                      data: data,
                    });
                  }
                } catch (e) {
                  console.error(`Ошибка переноса шаблона ${name}:`, e);
                }
              })
            );
            
            // Очищаем localStorage после успешного переноса
            localStorage.removeItem('templatesLocal');
            console.log('Все шаблоны перенесены в IndexedDB');
          } catch (migrationError) {
            console.error('Ошибка миграции шаблонов:', migrationError);
          }
        }

        const designsFromDB = await designsDB.getAll();
        if (designsFromDB.length > 0) {
          const templatesObj = designsFromDB.reduce((acc, template) => {
            acc[template.code] = template.data;
            return acc;
          }, {});
          setTemplates(templatesObj);
        }

      } catch (error) {
        console.error('Ошибка загрузки макетов:', error);
      }
    };
  
    loadTemplates();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const savedLocalCollages = JSON.parse(localStorage.getItem('collagesLocal') || '{}');
        const hasLocalCollages = Object.keys(savedLocalCollages).length > 0;

        if (hasLocalCollages) {
          try {
            // Переносим каждый шаблон в базу
            await Promise.all(
              Object.entries(savedLocalCollages).map(async ([name, data]) => {
                try {
                  // Проверяем, нет ли уже такого шаблона в базе
                  const existing = await collageDB.get(name);
                  if (!existing) {
                    await collageDB.add({
                      code: name,
                      elements: data,
                    });
                  }
                } catch (e) {
                  console.error(`Ошибка переноса шаблона ${name}:`, e); 
                }
              })
            );
            
            // Очищаем localStorage после успешного переноса
            localStorage.removeItem('collagesLocal');
          } catch (migrationError) {
            console.error('Ошибка миграции шаблонов:', migrationError);
          }
        }

        const collagesFromDB = await collageDB.getAll();
        if (collagesFromDB.length > 0) {
          const collagesObj = collagesFromDB.reduce((acc, collage) => {
            acc[collage.code] = collage.elements;
            return acc;
          }, {});
          setCollageTemples(collagesObj);
        }
      } catch (error) {
        console.error('Ошибка загрузки макетов:', error);
      }
    };
  
    loadTemplates();
  }, []);

  return (
    <div className={`header-section ${marketplace}`}>
      <button onClick={handleBack} className='button-back'>
        {t('header.back')}
      </button>
      <h2>{getHeaderTitle()}</h2>
      <TemplateSelector {...templateProps} />
      <button onClick={slideNumber ? handleCreateTemplate : handleCreateCollageTemple} className="template-button">
        <FaClipboardCheck /> {`${t('header.createLayout')}`}
      </button>
      <button onClick={handleDownload} className="download-button">
        {!loading ? (
          <><FaDownload /> {`${t('header.downloadDesign')}`}</>
        ) : (
          <div className="spinner"></div>
        )}
      </button>
    </div>
  );
};
