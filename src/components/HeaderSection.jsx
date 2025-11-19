import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaClipboardCheck } from 'react-icons/fa';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import html2canvas from 'html2canvas';
import UPNG from 'upng-js';

import { TemplateSelector } from '../ui/TemplateSelector/TemplateSelector';
import { ToggleSwitch } from '../ui/ToggleSwitch/ToggleSwitch';
import { useMarketplace } from '../contexts/contextMarketplace';
import { designsDB, collageDB, historyDB } from '../utils/handleDB';
import { LanguageContext } from '../contexts/contextLanguage';
import { apiCreateHistoriy } from '../services/historiesService';

export const HeaderSection = ({
  captureRef,
  setZoom,
  slideNumber,
  templates,
  setTemplates,
  templateSize,
  collageSize,
  setTemplateSize,
  setCollageSize,
  selectedTemplate,
  setSelectedTemplate,
  collageTemples,
  setCollageTemples,
  selectedCollageTemple,
  setSelectedCollageTemple,
  loadTemplate,
  loadCollageTemplate,
  handleCreateTemplate,
  handleCreateCollageTemple,
  showBlindZones,
  setShowBlindZones,
  sizeLabel
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
      const collageTitles = {
        'WB': t('header.wbCollage'),
        'OZ': t('header.ozonCollage'),
        'AM': t('header.amazonCollage')
      };
      return collageTitles[marketplace] || t('header.wbCollage');
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
      console.error('Layout deletion error:', error);
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
      console.error('Layout deletion error:', error);
    }
  };


  // Функция выгрузки макета в одельный файл
  const handleExportTemplate = (templateName) => {
    const template = templates[templateName];
    if (!template) return;
  
    const templateSizeValue = templateSize[templateName] || '900x1200';

    // Формируем имя файла с размером
    const fileName = templateName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-zа-яё0-9_-]/gi, '') 
      + '_' + templateSizeValue // Добавляем размер через нижнее подчеркивание
      + '.json';
  
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

  // Парсит код истории для извлечения articles, marketplace, type, size
  const parseHistoryCode = (code) => {
    const parts = code.split('_');

    if (parts.length < 6) {
      return {
        articles: [],
        marketplace: '',
        type: 'unknown',
        size: ''
      };
    }

    // Определяем индекс типа (collage, main, slideX)
    let typeIndex = -1;
    let type = 'unknown';

    // Ищем тип дизайна
    if (parts.includes('collage')) {
      typeIndex = parts.indexOf('collage');
      type = 'collage';
    } else if (parts.includes('main')) {
      typeIndex = parts.indexOf('main');
      type = 'main';
    } else {
      // Ищем любой слайд (slideX)
      for (let i = 0; i < parts.length; i++) {
        if (parts[i].startsWith('slide')) {
          typeIndex = i;
          type = parts[i];
          break;
        }
      }
    }

    // Если не нашли тип, возвращаем значения по умолчанию
    if (typeIndex === -1) {
      return {
        articles: [],
        marketplace: '',
        type: 'unknown',
        size: ''
      };
    }

    // Артикулы - это все части ДО marketplace
    const articles = parts.slice(0, typeIndex - 1);
    const marketplace = parts[typeIndex - 1] || '';
    const size = parts[typeIndex + 1] || '';

    return {
      articles,
      marketplace,
      type,
      size
    };
  };

  // Функция выгрузки слайда в формате png
  const handleDownload = async () => {
    try {
      setLoading(true);
      setShowBlindZones(false);
      setZoom(prev => ({ ...prev, level: 1 }));
      await new Promise(resolve => setTimeout(resolve, 500));

      const element = captureRef.current;
      const width = Math.floor(element.offsetWidth);
      const height = Math.floor(element.offsetHeight);
      
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
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0')
      ].join('');

      // Формирование имени файла
      const fileName = `${baseCode}_${marketplace}_${slideType}_${sizeLabel}_${datePart}_${timePart}.png`;

      // Получаем ключ для хранилища
      const sessionKey = slideNumber ? `design-${id}` : 'design-collage';

      // Достаём данные из соответствующего хранилища
      const designData = sessionKey === 'design-collage' 
        ? localStorage.getItem(sessionKey) 
        : sessionStorage.getItem(sessionKey);

      // Если данные есть и fileName определён - сохраняем в историю
      if (designData && fileName) {
        const historyKey = fileName.replace('.png', '');
        const parsedDesignData = JSON.parse(designData);

        await historyDB.put({
          code: historyKey,  // Используем имя файла как ключ
          data: parsedDesignData   // Сохраняем сырые данные
        });
      
        // 🔥 ОТПРАВЛЯЕМ ДАННЫЕ НА БЭКЕНД
        try {
          // Парсим код для извлечения дополнительных полей
          const parsedInfo = parseHistoryCode(historyKey);
          
          // Формируем данные для бэкенда
          const historyData = {
            name: historyKey,
            data: parsedDesignData,
            company: localStorage.getItem('company'),
            articles: parsedInfo.articles,
            marketplace: parsedInfo.marketplace,
            type: parsedInfo.type,
            size: parsedInfo.size
            // Не включаем опциональные поля чтобы избежать ошибок валидации
          };

          // Отправляем на бэкенд
          await apiCreateHistoriy(historyData);
          console.log('История успешно отправлена на сервер:', historyKey);
        } catch (backendError) {
          console.warn('Ошибка отправки истории на сервер:', backendError);
          // Не блокируем скачивание из-за ошибки отправки
        }
      }

      // Генерация изображения
      const canvas = await html2canvas(element, {
        width: width,
        height: height,
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#FFFFFF',
        imageRendering: 'pixelated', // Улучшаем рендеринг
        removeContainer: true
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
      console.error('Generation error:', error);
      alert('Error during image generation!');
    } finally {
      setLoading(false);
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
    placeholder: t('header.placeholder'),
    size: slideNumber ? templateSize : collageSize,
  };

  // Эффект для загрузки макетов при монтировании и изменении
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const designsFromDB = await designsDB.getAll();
        if (designsFromDB.length > 0) {
          const templatesObj = designsFromDB.reduce((acc, template) => {
            acc[template.code] = template.data;
            return acc;
          }, {});
          setTemplates(templatesObj);

          const templatesSize = designsFromDB.reduce((acc, template) => {
            acc[template.code] = template.size || '900x1200';
            return acc;
          }, {});
          setTemplateSize(templatesSize);
        }

      } catch (error) {
        console.error('Error loading layouts:', error);
      }
    };
  
    loadTemplates();
  }, []);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const collagesFromDB = await collageDB.getAll();
        if (collagesFromDB.length > 0) {
          const collagesObj = collagesFromDB.reduce((acc, collage) => {
            acc[collage.code] = collage.elements;
            return acc;
          }, {});
          setCollageTemples(collagesObj);

          const templatesSize = collagesFromDB.reduce((acc, template) => {
            acc[template.code] = template.size || '900x1200';
            return acc;
          }, {});
          setCollageSize(templatesSize);
        }
      } catch (error) {
        console.error('Error loading layouts:', error);
      }
    };
  
    loadTemplates();
  }, []);
  
  return (
    <div className={`header-section ${marketplace}`}>
      <button onClick={handleBack} className='button-back'>
        <HiOutlineChevronLeft /> {t('header.back')}
      </button>
      <h2>{getHeaderTitle()}</h2>

      <div>
        <ToggleSwitch
          checked={showBlindZones}
          onChange={setShowBlindZones}
          size="medium"
          onColor="#2196F3"
          offColor="#cccccc"
          label={showBlindZones ? t('header.hideBlindZones') : t('header.showBlindZones')}
        />
      </div>
      
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
