import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { FaDownload, FaClipboardCheck, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

import DraggableCard from '../../components/DraggableCard';
import { DownloadModal } from '../../components/DownloadModal';
import { SelectionTemplatesModal } from '../../components/SelectionTemplatesModal';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import img from '../../assets/illustrations.png';

export const Template = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { logout } = useAuth();

  const scrollContainerRef = useRef(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const [isModal, setIsModal] = useState(false);
  const [isDownload, setIsDownload] = useState(false);
  const [template, setTemplate] = useState([]);

  const handleBack = () => {
    logout();
    navigate(-1);
  };

  // Проверяем позицию скролла и доступность прокрутки
  const checkScrollPosition = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

      // Проверяем, есть ли вообще возможность скролла
      const canScroll = scrollWidth > clientWidth;
      setIsScrollable(canScroll);

      // Обновляем состояние теней
      setShowLeftShadow(scrollLeft > 5); // Небольшой порог для плавности
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  // Прокрутка с учетом границ
  const scrollBy = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const scrollStep = container.clientWidth * 0.8; // Адаптивный шаг
  
      let targetScroll;
      if (direction === 'left') {
        targetScroll = Math.max(0, currentScroll - scrollStep);
      } else {
        targetScroll = Math.min(maxScroll, currentScroll + scrollStep);
      }
  
      container.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Инициализация и обработка изменений
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      // Принудительно устанавливаем в начало при загрузке
      container.scrollLeft = 0;

      // Добавляем обработчик ресайза
      const resizeObserver = new ResizeObserver(checkScrollPosition);
      resizeObserver.observe(container);

      return () => resizeObserver.disconnect();
    }
  }, []);

  // Обработчик скролла
  const handleScroll = () => {
    checkScrollPosition();
  };

  // Проверяем при изменении шаблонов
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollPosition();
      // Автоматически скроллим к началу при изменении шаблонов
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = 0;
      }
    }, 100); // Небольшая задержка для обновления DOM

    return () => clearTimeout(timer);
  }, [template]);

  const moveCard = (dragIndex, hoverIndex) => {
    setTemplate(prev => {
      const newItems = [...prev];
      const [removed] = newItems.splice(dragIndex, 1);
      newItems.splice(hoverIndex, 0, removed);
      return newItems;
    });
  };

  const handleDelete = (data) => {
    setTemplate(prev => prev.filter(item => item !== data));
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
    <div className="template-page">
      <div className='header-section' style={{ margin: '10px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.tempSubtitle')}</h2>
        {template.length !== 0 && <>
          <button onClick={() => setIsModal(true)} className="template-button">
            <FaClipboardCheck /> {t('header.addLayout')}
          </button>
          <button onClick={() => setIsDownload(true)} className="download-button">
            <FaDownload /> {t('header.downloadLayout')}
          </button>
        </>}
      </div>

      <div className="content-wrapper template-wrapper">
        {template.length !== 0 ? (<>
          <span className="template-instruction">
            {t('views.templateMessageCreating')}
          </span>
          <div className="scroll-container-wrapper">
            {/* Кнопка прокрутки влево */}
            {isScrollable && showLeftShadow && (
              <button 
                onClick={() => scrollBy('left')}
                className="scroll-button left"
              >
                <FaChevronLeft />
              </button>
            )}

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="cards-container"
          >
          {template.map((temp, index) => (
            <div 
              key={index} 
              className="card-wrapper"
              style={{ marginLeft: index === 0 ? '0px' : '0' }}
            >
              <DraggableCard
                index={index}
                item={temp}
                moveCard={moveCard}
                handleDelete={handleDelete}
              />
            </div>
            ))}
            </div>

            {/* Кнопка прокрутки вправо */}
            {isScrollable && showRightShadow && (
                <button 
                  onClick={() => scrollBy('right')}
                  className="scroll-button right"
                >
                  <FaChevronRight />
                </button>
              )}

              {/* Динамические тени */}
              <div className={`shadow left ${showLeftShadow ? 'visible' : ''}`}></div>
              <div className={`shadow right ${showRightShadow ? 'visible' : ''}`}></div>
            </div>
          </>): (<>
        <img src={img} className="empty-state-image" />
        <span className="empty-state-message">
          {t('views.templateMessageStarted')}
        </span>
        <button onClick={() => setIsModal(true)} className="download-button">
          {t('views.templateStartedButton')}
        </button>
        </>)}
      </div>
      {isModal && (
        <SelectionTemplatesModal 
          isOpen={isModal}
          onClose={() => setIsModal(false)}
          setTemplate={setTemplate}
        />
      )}
      {isDownload && (
        <DownloadModal 
          isOpen={isDownload}
          onClose={() => setIsDownload(false)}
          template={template}
        />
      )}
    </div>
    </DndProvider>
  );
};