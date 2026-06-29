import { useContext } from 'react';
import { HiOutlineBars3, HiOutlineChevronLeft } from 'react-icons/hi2';
import { PiCaretLeftBold } from "react-icons/pi";

import { LanguageContext } from '../../contexts/contextLanguage';
import img from '../../assets/logo-text.png';
import './AiChatHeader.css';

/**
 * Шапка страницы — тот же паттерн, что у EditorAiLogs (header-section + back + h2 + meta справа).
 */
export function AiChatHeader({ onBack, meta, onOpenSidebar, showSidebarToggle = false }) {
  const { t } = useContext(LanguageContext);

  return (
    <div className="header-section ai-chat-page-header">
      <button type="button" onClick={onBack} className="button-back" style={{ fontSize: '24px', fontWeight: 'bold', padding: '8px' }}>
        <PiCaretLeftBold />
      </button>

      {showSidebarToggle && onOpenSidebar ? (
        <button
          type="button"
          className="ai-chat-mobile-menu"
          onClick={onOpenSidebar}
          aria-label="История чатов"
        >
          <HiOutlineBars3 />
        </button>
      ) : null}

      <img src={img} alt={t('header.aiChat')} className="creat-temp-icon" width={86} height={30}/>
      
      {meta ?? null}
    </div>
  );
}
