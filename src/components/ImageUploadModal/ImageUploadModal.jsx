import { useState, useEffect } from 'react';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import './ImageUploadModal.css';

const ImageUploadModal = ({ isOpen, onClose, onUpload, initialFileName }) => {
  const [articles, setArticles] = useState(['']);
  const [fileName, setFileName] = useState('');
  const [isValid, setIsValid] = useState(false);

  // Обновляем состояние fileName когда изменяется initialFileName
  useEffect(() => {
    if (initialFileName) {
      setFileName(initialFileName);
    }
  }, [initialFileName]);

  // Сбрасываем форму при открытии/закрытии модалки
  useEffect(() => {
    if (!isOpen) {
      // Сбрасываем состояние при закрытии
      setTimeout(() => {
        setArticles(['']);
        setFileName('');
      }, 300);
    } else {
      // Устанавливаем начальное значение при открытии
      if (initialFileName) {
        setFileName(initialFileName);
      }
    }
  }, [isOpen, initialFileName]);

  // Валидация артикулов
  const validateArticle = (article) => {
    const articleRegex = /^\d{4}-\d{4}$/;
    return articleRegex.test(article);
  };

  // Проверка всех полей
  useEffect(() => {
    const hasValidArticles = articles.every(article => 
      article === '' || validateArticle(article)
    );
    const hasAtLeastOneArticle = articles.some(article => article.trim() !== '');
    setIsValid(hasValidArticles && hasAtLeastOneArticle && fileName.trim() !== '');
  }, [articles, fileName]);

  const handleArticleChange = (index, value) => {
    const newArticles = [...articles];
    newArticles[index] = value;
    setArticles(newArticles);
  };

  const addArticleField = () => {
    if (articles.length < 5) {
      setArticles([...articles, '']);
    }
  };

  const removeArticleField = (index) => {
    if (articles.length > 1) {
      const newArticles = articles.filter((_, i) => i !== index);
      setArticles(newArticles);
    }
  };

  const handleSubmit = () => {
    const filteredArticles = articles.filter(article => article.trim() !== '');
    onClose();
    onUpload(fileName, filteredArticles);
    setArticles(['']);
    setFileName('');
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setArticles(['']);
      setFileName('');
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="image-upload-modal-overlay" onClick={handleClose}>
      <div className="image-upload-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="image-upload-modal-content">
          <div className="image-upload-modal-header">
            <h3>Загрузка изображения</h3>
            <button onClick={handleClose} className="image-upload-modal-close">
              <FiX />
            </button>
          </div>
          
          <div className="image-upload-modal-body">
            {/* Поле для имени файла */}
            <div className="image-upload-form-group">
              <label htmlFor="fileName">Имя файла:</label>
              <input
                id="fileName"
                type="text"
                value={fileName || ''}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Введите имя файла"
                className="image-upload-file-name-input"
                autoComplete="off"
              />
              <div className="image-upload-input-hint">
                Будет использовано для сохранения файла
              </div>
            </div>

            {/* Поля для артикулов */}
            <div className="image-upload-form-group">
              <label>Артикулы товаров:</label>
              <div className="image-upload-articles-container">
                {articles.map((article, index) => (
                  <div key={index} className="image-upload-article-input-wrapper">
                    <div className="image-upload-article-input-group">
                      <input
                        type="text"
                        value={article}
                        onChange={(e) => handleArticleChange(index, e.target.value)}
                        placeholder="XXXX-XXXX (например: 1234-5678)"
                        className={`image-upload-article-input ${article && !validateArticle(article) ? 'error' : ''}`}
                        autoComplete="off"
                      />
                      {articles.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeArticleField(index)}
                          className="image-upload-remove-article-btn"
                        >
                          <span>×</span>
                        </button>
                      )}
                    </div>
                    {article && !validateArticle(article) && (
                      <div className="image-upload-error-message">Формат: XXXX-XXXX</div>
                    )}
                  </div>
                ))}
              </div>
              
              {articles.length < 5 && (
                <button 
                  type="button" 
                  onClick={addArticleField}
                  className="image-upload-add-article-btn"
                >
                  + Добавить еще артикул
                </button>
              )}
            </div>
          </div>

          <div className="image-upload-modal-footer">
            <button onClick={handleClose} className="image-upload-btn image-upload-btn-secondary">
              Отмена
            </button>
            <button 
              onClick={handleSubmit} 
              disabled={!isValid}
              className={`image-upload-btn image-upload-btn-primary ${!isValid ? 'disabled' : ''}`}
            >
              <FiUploadCloud /> Загрузить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadModal;