import { useRef, useEffect } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export const ImageSliderModal = ({ baseCode, images, currentIndex, onClose, onIndexChange }) => {
  const thumbnailsRef = useRef(null);
  const thumbnailRefs = useRef([]);
  
  useEffect(() => {
    if (thumbnailsRef.current && thumbnailRefs.current[currentIndex] && images?.length > 0) {
      const container = thumbnailsRef.current;
      const activeThumb = thumbnailRefs.current[currentIndex];
      
      // Проверяем, нужно ли скроллить (если контент не помещается)
      const needsScroll = container.scrollWidth > container.clientWidth;
      
      if (needsScroll) {
        // Вычисляем позицию для скролла, чтобы активное превью было по центру
        const scrollLeft = activeThumb.offsetLeft - (container.clientWidth / 2) + (activeThumb.clientWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [currentIndex, images]);

  // Проверка наличия изображений после всех хуков
  if (!images || images.length === 0) return null;

  const handlePrev = () => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    onIndexChange((currentIndex + 1) % images.length);
  };

  const handleThumbnailClick = (index) => {
    onIndexChange(index);
  };

  // Функции для скролла превью
  const scrollThumbnailsLeft = () => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollThumbnailsRight = () => {
    if (thumbnailsRef.current) {
      thumbnailsRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  // Проверяем, нужно ли показывать кнопки скролла
  const needsScrollButtons = thumbnailsRef.current && 
    thumbnailsRef.current.scrollWidth > thumbnailsRef.current.clientWidth;

  return (
    <div className="modals-overlay" onClick={onClose}>
      <div className="modals-container" style={{ width: '60%' }} onClick={e => e.stopPropagation()}>
        <div className="modals-header">
          <h2>{baseCode}</h2>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        <div className="modals-content" style={{ overflow: 'hidden' }} >
          <div className="slider-main">
            <button className="slider-arrow slider-arrow-prev" onClick={handlePrev}>
              <IoIosArrowBack size={32} />
            </button>

            <div className="slider-main-image">
              <img 
                src={images[currentIndex]} 
                alt={`Изображение ${currentIndex + 1}`}
                className="slider-image"
              />
            </div>

            <button className="slider-arrow slider-arrow-next" onClick={handleNext}>
              <IoIosArrowForward size={32} />
            </button>
          </div>

          <div className="slider-thumbnails-container">
            {needsScrollButtons && (
              <button 
                className="thumbnails-scroll-btn thumbnails-scroll-left" 
                onClick={scrollThumbnailsLeft}
              >
                <IoIosArrowBack size={20} />
              </button>
            )}
            
            <div 
              className="slider-thumbnails" 
              ref={thumbnailsRef}
              style={{
                justifyContent: !needsScrollButtons ? 'center' : 'flex-start',
                scrollbarWidth: 'none', // Скрываем скроллбар для Firefox
                msOverflowStyle: 'none', // Скрываем скроллбар для IE/Edge
              }}
            >
              {images.map((image, index) => (
                <div 
                  key={index}
                  ref={el => thumbnailRefs.current[index] = el}
                  className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img 
                    src={image} 
                    alt={`Миниатюра ${index + 1}`}
                    className="thumbnail-image"
                  />
                </div>
              ))}
            </div>

            {needsScrollButtons && (
              <button 
                className="thumbnails-scroll-btn thumbnails-scroll-right" 
                onClick={scrollThumbnailsRight}
              >
                <IoIosArrowForward size={20} />
              </button>
            )}
          </div>
          
        </div>
        <div className="modals-footer">
          <div className="slider-counter">
            {currentIndex + 1} / {images.length}
          </div>
        </div>
      </div>
    </div>
  );
};