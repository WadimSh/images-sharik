import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineChevronLeft } from 'react-icons/hi2';

import { LanguageContext } from '../../contexts/contextLanguage';
import './AiChat.css';

export const AiChat = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="ai-chat-page">
      <div className="header-section ai-chat-page-header">
        <button onClick={handleBack} className="button-back" style={{ color: '#333' }}>
          <HiOutlineChevronLeft /> {t('header.back')}
        </button>
        <h2 style={{ color: '#333' }}>{t('header.aiChat')}</h2>
      </div>

      <div className="ai-chat-content" />
    </div>
  );
};
