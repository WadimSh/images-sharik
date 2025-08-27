import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

export const ImageSliderModal = ({ baseCode, images, currentIndex, onClose, onIndexChange }) => {

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

          <div className="slider-thumbnails">
            {images.map((image, index) => (
              <div 
                key={index}
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