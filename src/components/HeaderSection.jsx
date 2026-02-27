import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaDownload, FaClipboardCheck } from 'react-icons/fa';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import domtoimage from 'dom-to-image';

import EditFileNameModal from './EditFileNameModal/EditFileNameModal';
import { TemplateSelector } from '../ui/TemplateSelector/TemplateSelector';
import { ToggleSwitch } from '../ui/ToggleSwitch/ToggleSwitch';
import { useMarketplace } from '../contexts/contextMarketplace';
import { 
  apiGetAllDesigns, 
  apiGetAllCollages, 
  apiGetDesignByName, 
  apiDeleteDesign, 
  apiGetCollageByName, 
  apiDeleteCollage 
} from '../services/templatesService';
import { LanguageContext } from '../contexts/contextLanguage';
import { apiCreateHistory } from '../services/historiesService';
import { uploadGraphicFile } from '../services/mediaService';
import { useAuth } from '../contexts/AuthContext';

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
  const { user } = useAuth();
  
  const [isTemplateListOpen, setIsTemplateListOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [generatedFileName, setGeneratedFileName] = useState('');
      
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

  // Генерация имени файла по умолчанию
  const generateDefaultFileName = (baseCode, slideType) => {
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
    
    return `${baseCode}_${marketplace}_${slideType}_${sizeLabel}_${datePart}_${timePart}.png`;
  };

  // Функция для подготовки скачивания
  const prepareDownload = () => {
    if (!slideNumber) {
      // Для коллажей скачиваем сразу без редактирования
      handleDownload();
      return;
    }
    
    // Для слайдов формируем имя файла и показываем окно редактирования
    let baseCode, slideType;
    
    if (slideNumber === '') {
      const articles = JSON.parse(localStorage.getItem('collage-articles')) || [];
      baseCode = articles.length > 0 ? articles.join('_') : 'collage';
      slideType = 'collage';
    } else {
      [baseCode, slideType] = id.split('_');
      slideType = slideType === '1' ? 'main' : `slide${slideType}`;
    }
    
    const defaultFileName = generateDefaultFileName(baseCode, slideType);
    setGeneratedFileName(defaultFileName);
    setShowEditModal(true);
  };
  
  // Обработчик подтверждения редактирования
  const handleEditConfirm = (newFileName, articles, marketplace) => {
    // Запускаем скачивание с обновленными данными
    handleDownload(newFileName, articles, marketplace);
  };

  // Функция для удаления макета
  const handleDeleteTemplate = async(templateName) => {
    try {
      // Находим макет по имени из кэша
      const design = await apiGetDesignByName(templateName);
      if (!design) {
        console.error('Template not found:', templateName);
        return;
      }

      // Удаляем через API по ID
      await apiDeleteDesign(design.id);

      // Обновляем локальное состояние из кэша
      const updatedDesigns = await apiGetAllDesigns();
      const updatedTemplatesObj = {};
      const updatedTemplatesSize = {};

      updatedDesigns.forEach(design => {
        updatedTemplatesObj[design.name] = design.data;
        updatedTemplatesSize[design.name] = design.size || '900x1200';
      });

      setTemplates(updatedTemplatesObj);
      setTemplateSize(updatedTemplatesSize);

      if (selectedTemplate === templateName) setSelectedTemplate('');
    } catch (error) {
      console.error('Layout deletion error:', error);
    }
  };

  const handleDeleteCollageTemple = async(templateName) => {
    try {
      // Находим макет по имени из кэша
      const collage = await apiGetCollageByName(templateName);
      if (!collage) {
        console.error('Template not found:', templateName);
        return;
      }

      // Удаляем через API по ID
      await apiDeleteCollage(collage.id);

      // Обновляем локальное состояние из кэша
      const updatedCollages = await apiGetAllCollages();
      const updatedTemplatesObj = {};
      const updatedTemplatesSize = {};

      updatedCollages.forEach(collage => {
        updatedTemplatesObj[collage.name] = collage.data;
        updatedTemplatesSize[collage.name] = collage.size || '900x1200';
      });

      setCollageTemples(updatedTemplatesObj);
      setCollageSize(updatedTemplatesSize);

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

  // Основная функция скачивания
const handleDownload = async (customFileName = null, customArticles = null, customMarketplace = null) => {
  try {
    setLoading(true);
    setShowBlindZones(false);
    setZoom(prev => ({ ...prev, level: 1 }));
    await new Promise(resolve => setTimeout(resolve, 500));

    const element = captureRef.current;
    const width = Math.floor(element.offsetWidth);
    const height = Math.floor(element.offsetHeight);
    
    // Сохраняем оригинальные src для восстановления
    const images = element.getElementsByTagName('img');
    const originalSrcs = [];
    
    // Конвертируем все blob URL в data URL
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (img.src.startsWith('blob:')) {
        originalSrcs.push({ img, src: img.src });
        
        const response = await fetch(img.src);
        const blob = await response.blob();
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        
        img.src = dataUrl;
      }
    }
    
    // Используем dom-to-image для генерации
    const dataUrl = await domtoimage.toPng(element, {
      width: width,
      height: height,
      bgcolor: '#FFFFFF',
      quality: 1,
      style: {
        'transform': 'scale(1)',
        'transform-origin': '0 0'
      }
    });
    
    // Восстанавливаем оригинальные src
    originalSrcs.forEach(item => {
      item.img.src = item.src;
    });
    
    // Создаем изображение из dataUrl
    const img = new Image();
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    // Создаем canvas в 2 раза больше
    const canvas = document.createElement('canvas');
    canvas.width = width * 2;
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    
    // Рисуем изображение с увеличением (используем сглаживание для лучшего качества)
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Конвертируем canvas в blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png', 1);
    });
    
    // Определяем параметры для сохранения
    let fileName;
    let articlesForHistory;
    let marketplaceForHistory;
    let slideTypeForHistory;
    let companyId = user?.company?.[0]?.id;
    let baseCode, slideType;
    let slideNumberPart = slideNumber;
    
    if (customFileName) {
      fileName = customFileName;
      const parts = customFileName.replace('.png', '').split('_');
      if (parts.length >= 6) {
        articlesForHistory = parts.slice(0, parts.length - 5);
        marketplaceForHistory = parts[parts.length - 5];
        slideTypeForHistory = parts[parts.length - 4];
      }
    } else if (slideNumber === '') {
      const articles = JSON.parse(localStorage.getItem('collage-articles')) || [];
      const baseCode = articles.length > 0 ? articles.join('_') : 'collage';
      fileName = generateDefaultFileName(baseCode, 'collage');
      articlesForHistory = articles;
      marketplaceForHistory = marketplace;
      slideTypeForHistory = 'collage';
    } else {
      [baseCode, slideNumberPart] = id.split('_');
      slideType = slideNumberPart === '1' ? 'main' : `slide${slideNumberPart}`;
      fileName = generateDefaultFileName(baseCode, slideType);
      articlesForHistory = baseCode.split('_');
      marketplaceForHistory = marketplace;
      slideTypeForHistory = slideType;
    }
    
    const sessionKey = slideNumber ? `design-${id}` : 'design-collage';
    const designData = sessionKey === 'design-collage' 
      ? localStorage.getItem(sessionKey) 
      : sessionStorage.getItem(sessionKey);
    
    const imageFile = new File([blob], fileName, { type: 'image/png' });
    
    let uploadedFileData = null;
    const getMarketplaceFullName = (marketplaceCode) => {
      const marketplaceMap = {
        'WB': 'Wildberries',
        'OZ': 'Ozon',
        'AM': 'Amazon'
      };
      return marketplaceMap[marketplaceCode] || marketplaceCode;
    };
    
    const marketplaceTag = getMarketplaceFullName(marketplaceForHistory || marketplace);
    const tags = [...(articlesForHistory || [])];
    
    if (marketplaceTag) { tags.push(marketplaceTag); }
    
    if (companyId && marketplaceForHistory !== 'AM') {
      try {
        const uploadResult = await uploadGraphicFile(companyId, imageFile, null, tags);
        console.log('Файл успешно загружен на сервер:', uploadResult);
        
        if (uploadResult?.success && uploadResult?.data) {
          uploadedFileData = {
            fileId: uploadResult.data._id,
            url: uploadResult.data.url,
            thumbnailUrl: uploadResult.data.thumbnailUrl
          };
        }
      } catch (uploadError) {
        console.warn('Ошибка загрузки файла на сервер:', uploadError);
      }
    }
    
    if (designData && fileName) {
      const historyKey = fileName.replace('.png', '');
      const parsedDesignData = JSON.parse(designData);
      
      if (marketplaceForHistory !== 'AM') {
        try {
          const historyData = {
            name: historyKey,
            data: parsedDesignData,
            company: companyId,
            articles: articlesForHistory,
            marketplace: marketplaceForHistory || marketplace,
            type: slideTypeForHistory || (slideNumber === '1' ? 'main' : `slide${slideNumber}`),
            size: sizeLabel
          };
          
          if (uploadedFileData) {
            historyData.fileId = uploadedFileData.fileId;
            historyData.url = uploadedFileData.url;
            historyData.thumbnailUrl = uploadedFileData.thumbnailUrl;
          }
          
          await apiCreateHistory(historyData);
          console.log('История успешно отправлена на сервер:', historyKey);
        } catch (backendError) {
          console.warn('Ошибка отправки истории на сервер:', backendError);
          alert(`Ошибка отправки истории на сервер: ${backendError}`);
        }
      } else {
        console.log('Сохранение истории пропущено для marketplace AM');
      }
    }
    
    // Скачиваем файл
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = fileName;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setLoading(false);
  } catch (error) {
    console.error('Generation error:', error);
    alert('Error during image generation!');
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
        const designsFromDB = await apiGetAllDesigns();
        
        if (designsFromDB.length > 0) {
          const templatesObj = designsFromDB.reduce((acc, template) => {
            acc[template.name] = template.data;
            return acc;
          }, {});
          setTemplates(templatesObj);

          const templatesSize = designsFromDB.reduce((acc, template) => {
            acc[template.name] = template.size || '900x1200';
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
        const collagesFromDB = await apiGetAllCollages();
        
        if (collagesFromDB.length > 0) {
          const collagesObj = collagesFromDB.reduce((acc, collage) => {
            acc[collage.name] = collage.data;
            return acc;
          }, {});
          setCollageTemples(collagesObj);

          const templatesSize = collagesFromDB.reduce((acc, template) => {
            acc[template.name] = template.size || '900x1200';
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
    <>
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
      <button onClick={prepareDownload} className="download-button">
        {!loading ? (
          <><FaDownload /> {`${t('header.downloadDesign')}`}</>
        ) : (
          <div className="spinner"></div>
        )}
      </button>
    </div>

    {/* Модальное окно для редактирования названия (только для слайдов) */}
      {slideNumber && (
        <EditFileNameModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onConfirm={handleEditConfirm}
          initialFileName={generatedFileName}
          slideNumber={slideNumber}
        />
      )}
    </>
  );
};
