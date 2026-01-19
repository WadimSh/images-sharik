import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ImageDigitalizationModal } from '../../components/ImageDigitalizationModal/ImageDigitalizationModal';
import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { LanguageContext } from '../../contexts/contextLanguage';
import { apiGetAllImages } from '../../services/mediaService';

export const Images = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImage, setModalImage] = useState(false);

  const loadImagesFromBackend = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage
      }

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key];
        }
      });

      const result = await apiGetAllImages(params);

      if (result && result.files) {
        setImages(result.files);
        setTotalCount(result.pagination.total)
      } else {
        setImages([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error loading images from backend:', error);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadImagesFromBackend();
    }, 100); 
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, loadImagesFromBackend]);

  const handleBack = () => {
    navigate(-1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleCloseModal = () => {
    setModalImage(false);
    setTimeout(() => {
      setSelectedImage(null);
    }, 300); 
  };

  const handleImageClick = (image) => {
    const index = images.findIndex(img => img._id === image._id);
    setSelectedImageIndex(index);
    setSelectedImage(image);
    setModalImage(true);
  };

  const getFullImageUrl = (thumbnailUrl) => {
    const baseUrl = 'https://mp.sharik.ru';
    return thumbnailUrl.startsWith('http') ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
  };

  return (
    <div>
      <div className='header-section' style={{ margin: '10px 10px 20px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{'Библиотека изображений'}</h2>
      </div>

      {/* Пагинация */} 
      <PaginationPanel
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[50, 80, 100]}
        loading={false}
      />
          
      <div className="dashboard-content">
        {loading ? (
          <div className="loader-container-gallery">
            <div className="loader"></div>
          </div>
        ) : (
          <div style={{ paddingBottom: '86px' }}>
            {images.length === 0 ? (
              <div style={{ color: '#333', fontSize: '16px', textAlign: 'center', marginTop: '20px' }}>
                <span>Пока здесь ничего нет.</span>
              </div>
            ) : (
              <div className="images-grid">
                {images.map((image) => (
                  <div 
                    key={image._id} 
                    className="images_card"
                    onClick={() => handleImageClick(image)}
                  >
                    <div className="images-container">
                      <img
                        src={getFullImageUrl(image.thumbnailUrl)}
                        alt={image.fileName}
                        loading="lazy"
                        className="image-thumbnail"
                        onError={(e) => {
                          // Если миниатюра не загрузилась, попробуем загрузить оригинал
                          e.target.src = getFullImageUrl(image.url);
                        }}
                      />
                    </div>
                    <div className="image-info-overlay">
                      <div className="image-filename" title={image.fileName}>
                        {image.fileName}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedImage && (
        <ImageDigitalizationModal 
          isOpen={modalImage}
          onClose={handleCloseModal}
          images={images}
          imageData={selectedImage}
          currentIndex={selectedImageIndex}
        />
      )}
    </div>
  );
};