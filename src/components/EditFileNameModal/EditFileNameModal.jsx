import { useEffect, useState, useContext, useRef } from "react";
import { LanguageContext } from "../../contexts/contextLanguage";
import { useMarketplace } from "../../contexts/contextMarketplace";
import styles from './EditFileNameModal.module.css';

const EditFileNameModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialFileName,
  slideNumber,
  marketplace,
  removeBackground = false
}) => {
  const { t } = useContext(LanguageContext);
  const { marketplace: globalMarketplace } = useMarketplace();
  const modalRef = useRef(null);

  const [articles, setArticles] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [error, setError] = useState('');
  const [transparentBg, setTransparentBg] = useState(removeBackground);

  // Парсим начальное имя файла только один раз при открытии
  const [parsedData, setParsedData] = useState(null);
  const [cleanInitialFileName, setCleanInitialFileName] = useState('');
  
  useEffect(() => {
    if (isOpen && initialFileName) {
      // Убираем расширение из initialFileName для отображения
      const fileNameWithoutExt = initialFileName.replace(/\.(webp|png|jpg|jpeg)$/i, '');
      setCleanInitialFileName(fileNameWithoutExt);
      
      const parseFileName = (fileName) => {
        // Убираем расширение перед парсингом
        const nameWithoutExt = fileName.replace(/\.(webp|png|jpg|jpeg)$/i, '');
        const parts = nameWithoutExt.split('_');
        
        if (parts.length < 6) {
          return {
            articles: parts.slice(0, parts.length - 5).join('_'),
            marketplace: globalMarketplace || 'WB',
            slideType: slideNumber === '1' ? 'main' : `slide${slideNumber}`,
            size: parts[parts.length - 4] || '900x1200',
            date: parts[parts.length - 3] || '',
            time: parts[parts.length - 2] || ''
          };
        }
        
        let articlesPart = parts.slice(0, parts.length - 5).join('_');
        let slideTypePart = parts[parts.length - 4];
        
        // Если в slideType есть _transparent, убираем его
        if (slideTypePart.includes('_transparent')) {
          slideTypePart = slideTypePart.replace('_transparent', '');
          setTransparentBg(true);
        } else {
          setTransparentBg(false);
        }
        
        const marketplacePart = parts[parts.length - 5];
        const sizePart = parts[parts.length - 3];
        const datePart = parts[parts.length - 2];
        const timePart = parts[parts.length - 1];
        
        return {
          articles: articlesPart,
          marketplace: marketplacePart,
          slideType: slideTypePart,
          size: sizePart,
          date: datePart,
          time: timePart
        };
      };
      
      const data = parseFileName(initialFileName);
      setParsedData(data);
      setArticles(data.articles);
      setSelectedMarketplace(data.marketplace);
      setError('');
    }
  }, [isOpen, initialFileName, globalMarketplace, slideNumber]);

  useEffect(() => {
    if (isOpen) {
      const handleEscKey = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      
      return () => {
        document.removeEventListener('keydown', handleEscKey);
      };
    }
  }, [isOpen, onClose]);
  
  // Обработчик изменения артикула
  const handleArticleChange = (e) => {
    let value = e.target.value;
    
    if (value === '') {
      setArticles('');
      setError('');
      return;
    }
    
    const digits = value.replace(/\D/g, '');
    const limitedDigits = digits.slice(0, 8);
    
    let formattedValue = limitedDigits;
    if (limitedDigits.length > 4) {
      formattedValue = limitedDigits.slice(0, 4) + '-' + limitedDigits.slice(4);
    }
    
    setArticles(formattedValue);
    
    if (formattedValue.trim() === '') {
      setError('');
    } else if (formattedValue.length < 9) {
      setError('Неверный формат артикула. Используйте формат: XXXX-XXXX');
    } else {
      setError('');
    }
  };

  const validateArticle = (article) => {
    const regex = /^\d{4}-\d{4}$/;
    return regex.test(article);
  };
  
  const handleOverlayClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const isSubmitDisabled = () => {
    return !articles.trim() || 
           !selectedMarketplace.trim() || 
           !validateArticle(articles) ||
           !!error;
  };
  
  const handleSubmit = () => {
    if (!articles.trim()) {
      alert(t('header.articlesRequired'));
      return;
    }
    
    if (!selectedMarketplace.trim()) {
      alert(t('header.marketplaceRequired'));
      return;
    }
    
    if (!validateArticle(articles)) {
      setError('Неверный формат артикула. Используйте формат: XXXX-XXXX');
      return;
    }
    
    if (!parsedData) return;
    
    // Всегда используем WEBP формат
    const extension = 'webp';
    const isAM = selectedMarketplace === 'AM';
    // true = сохраняем с прозрачным фоном (без добавления белого фона)
    // false = добавляем белый фон при сохранении
    const shouldBeTransparent = isAM && transparentBg;
    
    // Добавляем суффикс _transparent если нужно
    const bgSuffix = shouldBeTransparent ? '_transparent' : '';
    
    const newFileName = `${articles}_${selectedMarketplace}_${parsedData.slideType}${bgSuffix}_${parsedData.size}_${parsedData.date}_${parsedData.time}.${extension}`;
    onConfirm(newFileName, articles, selectedMarketplace, shouldBeTransparent);
    onClose();
  };
  
  if (!isOpen || !parsedData) return null;
  
  const isAM = selectedMarketplace === 'AM';
  const bgSuffix = (isAM && transparentBg) ? '_transparent' : '';
  
  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent} ref={modalRef}>
        <div className={styles.modalHeader}>
          <h3>{t('header.editFileName')}</h3>
          <button 
            className={styles.modalCloseBtn}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className={styles.originalName}>
          <strong>{t('header.originalName')}</strong>
          <code>{cleanInitialFileName}</code>
        </div>
        
        <div className={styles.formGroup}>
          <label>{t('header.article')}</label>
          <input
            type="text"
            value={articles}
            onChange={handleArticleChange}
            placeholder="XXXX-XXXX"
            className={`${styles.inputField} ${error ? styles.inputError : ''}`}
            maxLength={9}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>{t('header.marketplace')}</label>
          <select 
            value={selectedMarketplace} 
            onChange={(e) => setSelectedMarketplace(e.target.value)}
            className={styles.selectField}
          >
            <option value="WB">Wildberries (WB)</option>
            <option value="OZ">Ozon (OZ)</option>
            <option value="AM">Amazon (AM)</option>
          </select>
        </div>

        {/* Переключатель фона только для Amazon */}
        {isAM && (
          <div className={styles.formGroup}>
            <label>Фон при сохранении</label>
            <div className={styles.backgroundToggle}>
              <button
                type="button"
                className={`${styles.toggleBtn} ${!transparentBg ? styles.active : ''}`}
                onClick={() => setTransparentBg(false)}
              >
                Добавить белый фон
              </button>
              <button
                type="button"
                className={`${styles.toggleBtn} ${transparentBg ? styles.active : ''}`}
                onClick={() => setTransparentBg(true)}
              >
                Сохранить как есть
              </button>
            </div>
            <small className={styles.hint}>
              {!transparentBg 
                ? "Автоматически добавится белый фон (изображение всегда будет с фоном)" 
                : "Фон не будет добавляться принудительно (сохранится текущее состояние)"}
            </small>
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label>{t('header.newFileName')}</label>
          <div className={styles.previewBox}>
            <code>
              {articles}_{selectedMarketplace}_{parsedData.slideType}{bgSuffix}_{parsedData.size}_{parsedData.date}_{parsedData.time}.webp
            </code>
          </div>
        </div>
        
        <div className={styles.modalButtons}>
          <button onClick={onClose} className={styles.btnCancel}>
            {t('modals.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            className={`${styles.btnConfirm} ${isSubmitDisabled() ? styles.btnDisabled : ''}`}
            disabled={isSubmitDisabled()}
          >
            {t('modals.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditFileNameModal;