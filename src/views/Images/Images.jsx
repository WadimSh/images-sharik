import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import PaginationPanel from '../../ui/PaginationPanel/PaginationPanel';
import { HiOutlineChevronLeft } from "react-icons/hi2";
import { LanguageContext } from '../../contexts/contextLanguage';
import { apiGetAllImages, apiGetImage } from '../../services/mediaService';

export const Images = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(100);

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
        itemsPerPageOptions={[20, 40, 60, 100]}
        loading={false}
      />
          
      <div className="dashboard-content">

        <span>Здесь будут фоточки</span>

      </div>
    </div>
  );
};