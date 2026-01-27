import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { FaTimes } from "react-icons/fa";
import { RiDeleteBin2Line } from "react-icons/ri";

import { ImageDigitalizationModal } from '../../components/ImageDigitalizationModal/ImageDigitalizationModal';
import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';
import FileUploadButton from '../../components/FileUploadButton';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useUpload } from '../../contexts/UploadContext';
import { apiGetAllImages, apiDeleteImage } from '../../services/mediaService';
import folder from '../../assets/folder.png';

// Компонент модалки подтверждения удаления
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, fileName }) => {
  if (!isOpen) return null;

  return (
    <div className="delete-confirmation-modal">
      <div className="delete-confirmation-content">
        <div className="delete-confirmation-header">
          <RiDeleteBin2Line className="warning-icon" />
          <h3>Удаление изображения</h3>
        </div>
        
        <div className="delete-confirmation-body">
          <p>Вы уверены, что хотите удалить изображение <strong>"{fileName}"</strong>?</p>
          <p className="warning-text">Это действие невозможно отменить. Изображение будет удалено навсегда.</p>
        </div>
        
        <div className="delete-confirmation-footer">
          <button 
            className="delete-btn delete-btn-secondary"
            onClick={onClose}
          >
            Отменить
          </button>
          <button 
            className="delete-btn delete-btn-danger"
            onClick={onConfirm}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
};

export const Images = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const { user, isAdmin } = useAuth();
  const { uploadState } = useUpload(); // Для отслеживания состояния загрузки

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImage, setModalImage] = useState(false);
  const [hoveredImageId, setHoveredImageId] = useState(null); // Для отслеживания наведения
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    imageId: null,
    fileName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Функция удаления изображения
  const handleDeleteImage = async () => {
    if (!deleteModal.imageId) return;
    
    try {
      setIsDeleting(true);
      await apiDeleteImage(deleteModal.imageId);
      
      // Закрываем модалку
      setDeleteModal({ isOpen: false, imageId: null, fileName: '' });
      
      // Перезагружаем изображения
      await loadImagesFromBackend();
      
      // Если удаляемое изображение было выбрано в модалке, закрываем модалку
      if (selectedImage && selectedImage._id === deleteModal.imageId) {
        setModalImage(false);
        setSelectedImage(null);
      }
      
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Произошла ошибка при удалении изображения');
    } finally {
      setIsDeleting(false);
    }
  };

  // Открытие модалки подтверждения удаления
  const openDeleteConfirmation = (imageId, fileName, e) => {
    e.stopPropagation(); // Останавливаем всплытие, чтобы не открывалась модалка просмотра
    setDeleteModal({
      isOpen: true,
      imageId,
      fileName
    });
  };

  // Закрытие модалки подтверждения удаления
  const closeDeleteConfirmation = () => {
    setDeleteModal({ isOpen: false, imageId: null, fileName: '' });
  };

  // Автоматическое обновление при изменении пагинации
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadImagesFromBackend();
    }, 100); 
    
    return () => clearTimeout(timeoutId);
  }, [currentPage, itemsPerPage, loadImagesFromBackend]);

  useEffect(() => {
    if (!uploadState.isUploading && uploadState.uploadResults.length > 0) {
            
      const timer = setTimeout(() => {
        loadImagesFromBackend();
      }, 100); 
      
      return () => clearTimeout(timer);
    }
  }, [uploadState.isUploading, uploadState.uploadResults.length, loadImagesFromBackend]);

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
        {user && (<FileUploadButton
          id={user.company[0].id}
          buttonText={'Загрузить изображения'}
        />)}
      </div>

      {/* Пагинация */} 
      <PaginationPanel
        currentPage={currentPage}
        totalCount={totalCount}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[50, 80, 100]}
        loading={loading}
      />
          
      <div className="dashboard-content">
        {loading ? (
          <div className="loader-container-gallery">
            <div className="loader"></div>
          </div>
        ) : (
          <div style={{ paddingBottom: '86px' }}>
            {images.length === 0 ? (
              <div style={{ 
                color: '#333', 
                fontSize: '16px', 
                marginTop: '120px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px' 
              }}>
                <img
                  src={folder}
                  style={{ 
                    width: '300px',
                    height: '300px',
                    pointerEvents: 'none',
                    objectFit: 'cover',
                    transformOrigin: 'center',
                  }}
                />
                <span style={{ textAlign: 'center', lineHeight: '20px' }}>
                  Пусто, но полно потенциала.<br/> Добавьте изображения, чтобы наполнить библиотеку.
                </span>
              </div>
            ) : (
              <div className="images-grids">
                {images.map((image) => (
                  <div 
                    key={image._id} 
                    className="images_card"
                    onClick={() => handleImageClick(image)}
                    onMouseEnter={() => setHoveredImageId(image._id)}
                    onMouseLeave={() => setHoveredImageId(null)}
                  >
                    {isAdmin && hoveredImageId === image._id && (
                      <button 
                        className="delete-image-btn"
                        onClick={(e) => openDeleteConfirmation(image._id, image.fileName, e)}
                      >
                        <FaTimes />
                      </button>
                    )}

                    <div className="images-container">
                      <img
                        src={getFullImageUrl(image.thumbnailUrl)}
                        alt={image.fileName}
                        loading="lazy"
                        className="image-thumbnail"
                        onError={(e) => {
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteConfirmation}
        onConfirm={handleDeleteImage}
        fileName={deleteModal.fileName}
      />
    </div>
  );
};