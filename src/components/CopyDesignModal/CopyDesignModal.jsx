import { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../../contexts/contextLanguage';
import './CopyDesignModal.css';

export const CopyDesignModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  currentMarketplace,
  loading
}) => {
  const { t } = useContext(LanguageContext);
  const [article, setArticle] = useState('');
  const [marketplace, setMarketplace] = useState(currentMarketplace || '');
  const [isValidFormat, setIsValidFormat] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Проверка формата артикула
    const formatRegex = /^\d{4}-\d{4}$/;
    setIsValidFormat(formatRegex.test(article));
  }, [article]);

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

  const handleArticleChange = (e) => {
    const value = e.target.value;
    
    // Разрешаем полностью очистить поле
    if (value === '') {
      setArticle('');
      return;
    }
    
    // Удаляем все нецифры
    let cleaned = value.replace(/[^\d]/g, '');
    
    // Форматируем с дефисом после 4 цифр
    if (cleaned.length > 4) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4, 8);
    }
    
    // Ограничиваем длину
    const newValue = cleaned.slice(0, 9);
    setArticle(newValue);
  };

  const handleClear = () => {
    setArticle('');
    setError('');
  };

  const handleSubmit = () => {
    if (!article.trim()) {
      setError('Пожалуйста, введите артикул');
      return;
    }
    
    if (!isValidFormat) {
      setError('Неверный формат артикула. Используйте формат: XXXX-XXXX');
      return;
    }
    
    if (!marketplace.trim()) {
      setError('Пожалуйста, выберите торговую площадку');
      return;
    }
    
    onConfirm(article, marketplace);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('modals.copyDesign')}</h3>
          <button 
            className="modal-close-btn"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        
        <div className="form-group">
          <label>{t('header.newArticle')}</label>
          <div className="input-wrapper">
            <input
              type="text"
              value={article}
              onChange={handleArticleChange}
              onKeyDown={handleKeyDown}
              placeholder="XXXX-XXXX"
              className={`input-field ${error ? 'input-error' : ''}`}
              maxLength={9}
              autoFocus
            />
            {article && (
              <button 
                className="clear-button"
                onClick={handleClear}
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>{t('header.marketplace') || 'Торговая площадка'}</label>
          <select 
            value={marketplace} 
            onChange={(e) => setMarketplace(e.target.value)}
            className="select-field"
          >
            <option value="WB">Wildberries (WB)</option>
            <option value="OZ">Ozon (OZ)</option>
            <option value="AM">Amazon (AM)</option>
          </select>
        </div>
        
        <div className="modal-buttons">
          <button onClick={onClose} className="btn-cancel" disabled={loading}>
            {t('modals.cancel')}
          </button>
          <button 
            onClick={handleSubmit} 
            className={`btn-confirm ${!isValidFormat || !marketplace || loading ? 'btn-disabled' : ''}`}
            disabled={!isValidFormat || !marketplace || loading}
          >
            {loading ? (
              <div className="spinner-small"></div>
            ) : (
              t('modals.confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};