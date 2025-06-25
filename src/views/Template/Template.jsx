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
import img from '../../assets/illustrations.png';

export const Template = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const scrollContainerRef = useRef(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);

  const [isModal, setIsModal] = useState(false);
  const [isDownload, setIsDownload] = useState(false);
  const [template, setTemplate] = useState([]);

  const handleBack = () => {
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
    <div style={{ overflow: 'hidden', height: '100vh' }}>
      <div className='header-section' style={{ margin: '10px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.tempSubtitle')}</h2>
        {template.length !== 0 && <><button onClick={() => setIsModal(true)} className="template-button">
          <FaClipboardCheck /> Добавить макет
        </button>
        <button onClick={() => setIsDownload(true)} className="download-button">
          <><FaDownload /> Создать шаблон</>
        </button></>}
      </div>

      <div 
        className="content-wrapper" 
        style={{
            padding: '10px',
            height: 'calc(100vh - 60px)', // Учитываем высоту шапки
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            overflow: 'hidden',
            position: 'relative',
            boxSizing: 'border-box'
          }}
      >
        {template.length !== 0 ? (<>
          <span style={{ fontSize: '18px', lineHeight: '1.2', textAlign: 'center', marginTop: '5%', marginBottom: '3%' }}>
            Для создания необходимого шаблона, просто меняйте местами карточки,<br/> убирайте ненужные или добавляйте новые макеты.
          </span>
          <div style={{ 
            position: 'relative',
            width: '100%',
            padding: '0 40px', // Увеличили отступы для кнопок
            boxSizing: 'border-box'
          }}>
            {/* Кнопка прокрутки влево */}
            {isScrollable && showLeftShadow && (
              <button 
                onClick={() => scrollBy('left')}
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  background: 'rgba(255,255,255,0.8)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  cursor: 'pointer'
                }}
              >
                <FaChevronLeft />
              </button>
            )}


          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            style={{ 
              display: 'flex',
              justifyContent: 'flex-start',
              overflowX: 'auto',
              width: '100%',
              padding: '20px 0',
              boxSizing: 'border-box',
              gap: '15px',
              cursor: 'grab',
              scrollBehavior: 'smooth',
              scrollbarWidth: 'thin',
              scrollbarColor: '#888 transparent',
              WebkitOverflowScrolling: 'touch', // Для плавного скролла на iOS
              msOverflowStyle: 'none',
              '&::-webkit-scrollbar': {
                height: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
                margin: '0 40px'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: '3px',
              }
            }}
          >
          {template.map((temp, index) => (
            <div 
              key={index} 
              style={{ 
                flexShrink: 0,
                width: '270px',
                height: '360px',
                scrollSnapAlign: 'start',
                marginLeft: index === 0 ? '0px' : '0'
              }}
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
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 2,
                    background: 'rgba(255,255,255,0.8)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                >
                  <FaChevronRight />
                </button>
              )}

              {/* Динамические тени */}
              <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '30px',
                background: showLeftShadow 
                  ? 'linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)' 
                  : 'none',
                pointerEvents: 'none',
                transition: 'background 0.3s ease'
              }}></div>
              <div style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '30px',
                background: showRightShadow 
                  ? 'linear-gradient(270deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)' 
                  : 'none',
                pointerEvents: 'none',
                transition: 'background 0.3s ease'
              }}></div>
            </div>
            </>): (<>
        <img src={img} style={{ width: '264px', height: '264px', marginTop: '5%' }} />
        <span style={{ fontSize: '18px', lineHeight: '1.2', textAlign: 'center', marginBottom: '16px' }}>
          Для создания шаблона нужно добавить несколько макетов.<br/> Начните с нажатия кнопки.
        </span>
        <button onClick={() => setIsModal(true)} className="download-button">
          Добавить макеты
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