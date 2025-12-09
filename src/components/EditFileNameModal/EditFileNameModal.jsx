import { useEffect, useState, useContext, useRef } from "react";
import { LanguageContext } from "../../contexts/contextLanguage";
import { useMarketplace } from "../../contexts/contextMarketplace";
import './EditFileNameModal.css';

const EditFileNameModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  initialFileName,
  slideNumber
}) => {
  const { t } = useContext(LanguageContext);
  const { marketplace: globalMarketplace } = useMarketplace();
  const modalRef = useRef(null);

  // Используем локальное состояние которое не зависит от initialFileData
  const [articles, setArticles] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('');
  const [error, setError] = useState('');

  // Парсим начальное имя файла только один раз при открытии
  const [parsedData, setParsedData] = useState(null);
  
  useEffect(() => {
    if (isOpen && initialFileName) {
      const parseFileName = (fileName) => {
        const parts = fileName.replace('.png', '').split('_');
        
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
        
        const articlesPart = parts.slice(0, parts.length - 5).join('_');
        const marketplacePart = parts[parts.length - 5];
        const slideTypePart = parts[parts.length - 4];
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
      // Добавляем обработчик клавиши Escape
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
    
    const newFileName = `${articles}_${selectedMarketplace}_${parsedData.slideType}_${parsedData.size}_${parsedData.date}_${parsedData.time}.png`;
    onConfirm(newFileName, articles, selectedMarketplace);
    onClose();
  };
  
  if (!isOpen || !parsedData) return null;
  
  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" ref={modalRef}>
        <div className="modal-header">
          <h3>{t('header.editFileName')}</h3>
          <button 
            className="modal-close-btn"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className="original-name">
          <strong>{t('header.originalName')}</strong>
          <code>{initialFileName}</code>
        </div>
        
        <div className="form-group">
          <label>{t('header.article')}</label>
          <input
            type="text"
            value={articles}
            onChange={handleArticleChange}
            placeholder="XXXX-XXXX"
            className={`input-field ${error ? 'input-error' : ''}`}
            maxLength={9}
          />
        </div>
        
        <div className="form-group">
          <label>{t('header.marketplace')}</label>
          <select 
            value={selectedMarketplace} 
            onChange={(e) => setSelectedMarketplace(e.target.value)}
            className="select-field"
          >
            <option value="WB">Wildberries (WB)</option>
            <option value="OZ">Ozon (OZ)</option>
            <option value="AM">Amazon (AM)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>{t('header.newFileName')}</label>
          <div className="preview-box">
            <code>
              {articles}_{selectedMarketplace}_{parsedData.slideType}_{parsedData.size}_{parsedData.date}_{parsedData.time}.png
            </code>
          </div>
        </div>
        
        <div className="modal-buttons">
          <button onClick={onClose} className="btn-cancel">
            {t('modals.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            className={`btn-confirm ${isSubmitDisabled() ? 'btn-disabled' : ''}`}
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