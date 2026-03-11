// Images.js (обновленная версия)
import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { FaTimes, FaFilter } from "react-icons/fa";
import { RiDeleteBin2Line } from "react-icons/ri";

import { ImageDigitalizationModal } from '../../components/ImageDigitalizationModal/ImageDigitalizationModal';
import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';
import FileUploadButton from '../../components/FileUploadButton';
import SidebarFilters from '../../components/SidebarFilters/SidebarFilters';
import { LanguageContext } from '../../contexts/contextLanguage';
import { useAuth } from '../../contexts/AuthContext';
import { useUpload } from '../../contexts/UploadContext';
import { apiGetAllImages, apiDeleteImage, apiGetImagesExcludingMarketplaces } from '../../services/mediaService';
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
  const { user, isAdmin, isUploader } = useAuth();
  const { uploadState } = useUpload();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImage, setModalImage] = useState(false);
  const [hoveredImageId, setHoveredImageId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    imageId: null,
    fileName: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Состояние для фильтров
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    tags: [],
    article: '',
    author: '',
    sortBy: 'uploadDate',
    sortOrder: 'desc'
  });

  // Преобразование артикула в тег для поиска
  const articleToTag = (article) => {
    if (!article || !article.match(/^\d{4}-\d{4}$/)) return null;
    return article;
  };

  const loadImagesFromBackend = useCallback(async () => {
    try {
      setLoading(true);

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      };

      if (filters.search) {
        params.search = filters.search;
      }

      // Подготовка тегов с дублированием для бэкенда
      if (filters.tags && filters.tags.length > 0) {
        if (filters.tags.length === 1) {
          params.tags = [filters.tags[0], filters.tags[0]];
        } else {
          params.tags = [...filters.tags];
        }
      }

      const articleTag = articleToTag(filters.article);
      if (articleTag) {
        if (params.tags) {
          if (params.tags.length === 1) {
            params.tags = [params.tags[0], articleTag];
          } else {
            params.tags.push(articleTag);
          }
        } else {
          params.tags = [articleTag, articleTag];
        }
      }

      if (filters.author) {
        params.searchAuthor = filters.author;
      }

      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined || 
            (Array.isArray(params[key]) && params[key].length === 0)) {
          delete params[key];
        }
      });

      const result = (isAdmin || isUploader) 
        ? await apiGetAllImages(params)
        : await apiGetImagesExcludingMarketplaces(params);

      let files = result?.files || [];
      
      if (filters.author && files.length > 0) {
        const authorRegex = new RegExp(filters.author, 'i');
        files = files.filter(file => 
          file.uploadedBy?.username?.match(authorRegex) || 
          file.uploadedBy?.email?.match(authorRegex)
        );
      }

      setImages(files);
      setTotalCount(result?.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading images from backend:', error);
      setImages([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, filters]);

  const handleDeleteImage = async () => {
    if (!deleteModal.imageId) return;
    
    try {
      setIsDeleting(true);
      await apiDeleteImage(deleteModal.imageId);
      
      setDeleteModal({ isOpen: false, imageId: null, fileName: '' });
      await loadImagesFromBackend();
      
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

  const openDeleteConfirmation = (imageId, fileName, e) => {
    e.stopPropagation();
    setDeleteModal({
      isOpen: true,
      imageId,
      fileName
    });
  };

  const closeDeleteConfirmation = () => {
    setDeleteModal({ isOpen: false, imageId: null, fileName: '' });
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadImagesFromBackend();
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setCurrentPage(1);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const removeFilter = (type, value) => {
    if (type === 'tag') {
      setFilters(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== value)
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [type]: ''
      }));
    }
    // После удаления фильтра сразу применяем его
    setTimeout(() => {
      setCurrentPage(1);
      loadImagesFromBackend();
    }, 0);
  };

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
    return thumbnailUrl?.startsWith('http') ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
  };

  // Подсчет активных фильтров
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.article) count++;
    if (filters.author) count++;
    if (filters.tags.length > 0) count += filters.tags.length;
    return count;
  };

  // Функция для проверки, является ли тег артикулом
const isArticleTag = (tag) => {
  // Артикул имеет формат XXXX-XXXX, где X - цифры
  return /^\d{4}-\d{4}$/.test(tag);
};

// В компоненте Images.js перед return добавьте функцию фильтрации:
const getVisibleTags = (tags) => {
  if (!tags || tags.length === 0) return [];
  return tags.filter(tag => tag && !isArticleTag(tag)); // Убираем все артикулы
};
  
  return (
    <div>
      <div className='header-section' style={{ margin: '10px 10px 0px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{'Библиотека изображений'}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
          
        style={{ 
          background: 'transparent',
          cursor: 'pointer',
          width: '140px'
        }}
            className="template-button "
            onClick={() => setShowFilters(true)}
          >
            <FaFilter />
            <span>Фильтры</span>
            
          </button>
          {user && (isAdmin || isUploader) && (
            <FileUploadButton
              id={user.company[0]?.id}
              buttonText={'Загрузить изображения'}
            />
          )}
        </div>
      </div>

      {/* Индикатор активных фильтров */}
      {getActiveFiltersCount() > 0 && (
        <div className="active-filters">
          <span className="active-filters-label">Активные фильтры:</span>
          <div className="active-filters-list">
            {filters.search && (
              <span className="filter-tag">
                <span className="filter-tag-label">Поиск:</span>
                {filters.search}
                <button onClick={() => removeFilter('search')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {filters.article && (
              <span className="filter-tag">
                <span className="filter-tag-label">Артикул:</span>
                {filters.article}
                <button onClick={() => removeFilter('article')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {filters.author && (
              <span className="filter-tag">
                <span className="filter-tag-label">Автор:</span>
                {filters.author}
                <button onClick={() => removeFilter('author')}>
                  <FaTimes />
                </button>
              </span>
            )}
            {filters.tags.map(tag => (
              <span key={tag} className="filter-tag">
                <span className="filter-tag-label">Тег:</span>
                {tag}
                <button onClick={() => removeFilter('tag', tag)}>
                  <FaTimes />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

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
              <div className="empty-state">
                <img
                  src={folder}
                  alt="Empty folder"
                  className="empty-state-image"
                />
                <span className="empty-state-text">
                  Пусто, но полно потенциала.<br/> Добавьте изображения, чтобы наполнить библиотеку.
                </span>
              </div>
            ) : (
              <div className="image-grids">
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
                      {getVisibleTags(image.tags).length > 0 && (
                        <div className="image-tags" title={getVisibleTags(image.tags).join(' • ')}>
                          {getVisibleTags(image.tags).join(' • ')}
                        </div>
                      )}
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

      <SidebarFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={handleFilterChange}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        totalResults={totalCount}
      />
    </div>
  );
};