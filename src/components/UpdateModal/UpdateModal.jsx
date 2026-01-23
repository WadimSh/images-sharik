import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import './UpdateModal.css';

export const UpdateModal = ({
  isOpen,
  onClose,
  markdownFile,
  localStorageKey,
  data,
  headerImage 
}) => {
  const [markdownContent, setMarkdownContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // При открытии модалки загружаем markdown файл
  useEffect(() => {
    if (isOpen) {
      loadMarkdownFile();
    }
  }, [isOpen]);

  // Закрытие по Escape
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

  // Функция загрузки markdown файла
  const loadMarkdownFile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(markdownFile);
      
      if (!response.ok) {
        throw new Error(`Ошибка загрузки: ${response.status}`);
      }
      
      const text = await response.text();
      setMarkdownContent(text);
    } catch (err) {
      console.error('Ошибка загрузки changelog:', err);
      setError(`Не удалось загрузить файл обновлений: ${markdownFile}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-upload-overlay" onClick={onClose}>
      <div className="modal-upload-content update-modal" onClick={(e) => e.stopPropagation()}>
        {/* Хедер с картинкой */}
        <div className="update-modal-header-with-image">
          {headerImage && (
            <div className="header-image-container" style={headerImage === 'none' ? { height: '160px' } : {}}>
              <img 
                src={headerImage} 
                alt="Обновление" 
                className="header-image"
                onError={(e) => {
                  e.target.style.display = 'none'; // Скрываем если картинка не загрузилась
                }}
              />
            </div>
          )}
        </div>

        <div className="modal-body update-modal-body">
          {isLoading ? (
            <div className="update-loading">
              <div className="spinners"></div>
              <p>Загрузка информации об обновлениях...</p>
            </div>
          ) : error ? (
            <div className="update-error">
              <div className="error-icon">⚠️</div>
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown
                components={{
                  // Кастомные компоненты для лучшего отображения
                  h1: ({node, ...props}) => <h1 className="update-h1" {...props} />,
                  h2: ({node, ...props}) => <h2 className="update-h2" {...props} />,
                  h3: ({node, ...props}) => <h3 className="update-h3" {...props} />,
                  h4: ({node, ...props}) => <h4 className="update-h4" {...props} />,
                  p: ({node, ...props}) => <p className="update-p" {...props} />,
                  ul: ({node, ...props}) => <ul className="update-ul" {...props} />,
                  ol: ({node, ...props}) => <ol className="update-ol" {...props} />,
                  li: ({node, ...props}) => <li className="update-li" {...props} />,
                  a: ({node, ...props}) => (
                    <a className="update-link" target="_blank" rel="noopener noreferrer" {...props} />
                  ),
                  strong: ({node, ...props}) => <strong className="update-strong" {...props} />,
                  em: ({node, ...props}) => <em className="update-em" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="update-blockquote" {...props} />,
                  code: ({node, inline, className, children, ...props}) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline ? (
                      <pre className="update-pre">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    ) : (
                      <code className="update-inline-code" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {markdownContent}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="modal-footer update-modal-footer">
          <div className="update-info">
            <input 
              type="checkbox" 
              id="dont-show-again"
              onChange={(e) => {
                if (e.target.checked) {
                  localStorage.setItem(localStorageKey, data);
                } else {
                  localStorage.removeItem(localStorageKey);
                }
              }}
            />
            <label htmlFor="dont-show-again">
              Больше не показывать
            </label>
          </div>

          <button 
            className="btn btn-primary"
            onClick={onClose}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};