import { useContext } from 'react';
import { HiOutlineBars3, HiOutlineChevronLeft } from 'react-icons/hi2';

import { LanguageContext } from '../../contexts/contextLanguage';
import './AiChatHeader.css';

/**
 * Шапка страницы — тот же паттерн, что у EditorAiLogs (header-section + back + h2 + meta справа).
 */
export function AiChatHeader({ onBack, meta, onOpenSidebar, showSidebarToggle = false }) {
  const { t } = useContext(LanguageContext);

  return (
    <div className="header-section ai-chat-page-header">
      <button type="button" onClick={onBack} className="button-back">
        <HiOutlineChevronLeft /> {t('header.back')}
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

      <h2>{t('header.aiChat')}</h2>

      {meta ?? null}
    </div>
  );
}
