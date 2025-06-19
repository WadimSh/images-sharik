import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from "react-icons/hi2";

import { LanguageContext } from '../../contexts/contextLanguage';

export const Template = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div>
      <div className='header-section' style={{ margin: '10px'}}>
        <button onClick={handleBack} className='button-back' style={{ color: '#333'}}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333'}}>{t('header.tempSubtitle')}</h2>
      </div>
      <div className="content-wrapper" style={{ alignItems: 'center', justifyContent: 'center' }}>
        Здесь будет интерфейс для создания шаблонов.
      </div>
    </div>
  )
} 