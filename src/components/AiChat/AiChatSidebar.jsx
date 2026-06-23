import { HiOutlinePlus } from 'react-icons/hi2';

import { formatRelativeTime, getSessionId } from '../../utils/chatSession';
import './AiChatSidebar.css';

/**
 * @param {object} props
 * @param {string|null} props.activeSessionId
 * @param {Array<object>} props.sessions
 * @param {Function} props.onNewChat
 * @param {Function} props.onSelectSession
 * @param {Function} [props.onClose]
 */
export function AiChatSidebar({
  activeSessionId,
  sessions,
  onNewChat,
  onSelectSession,
  onClose,
}) {
  const isWelcomeActive = activeSessionId === null;

  const handleNewChat = () => {
    onNewChat();
    onClose?.();
  };

  const handleSelectSession = (sessionId) => {
    onSelectSession(sessionId);
    onClose?.();
  };

  return (
    <div className="ai-chat-sidebar" data-testid="ai-chat-sidebar">
      <button
        type="button"
        className={`ai-chat-sidebar-new-chat ${isWelcomeActive ? 'ai-chat-sidebar-new-chat--active' : ''}`}
        onClick={handleNewChat}
      >
        <HiOutlinePlus aria-hidden="true" />
        <span>Новый чат</span>
      </button>

      <div className="ai-chat-sidebar-list" role="list">
        {sessions.length === 0 ? (
          <p className="ai-chat-sidebar-empty">Нет чатов</p>
        ) : (
          sessions.map((session) => {
            const sessionId = getSessionId(session);
            const isActive = activeSessionId === sessionId;
            const title = session.title || 'Без названия';
            const relativeTime = formatRelativeTime(
              session.lastMessageAt || session.updatedAt || session.createdAt
            );

            return (
              <button
                key={sessionId}
                type="button"
                role="listitem"
                className={`ai-chat-sidebar-session ${isActive ? 'ai-chat-sidebar-session--active' : ''}`}
                onClick={() => handleSelectSession(sessionId)}
                title={title}
              >
                <span className="ai-chat-sidebar-session-title">{title}</span>
                {relativeTime ? (
                  <span className="ai-chat-sidebar-session-time">{relativeTime}</span>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
