import { useCallback, useEffect, useRef, useState } from 'react';
import { HiOutlinePencil, HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

import {
  CHAT_SESSION_TITLE_MAX_LENGTH,
  formatRelativeTime,
  getSessionId,
  normalizeChatSessionTitle,
} from '../../utils/chatSession';
import './AiChatSidebar.css';

/**
 * @param {object} props
 * @param {object} props.session
 * @param {boolean} props.isActive
 * @param {boolean} props.isEditing
 * @param {string} props.editingTitle
 * @param {boolean} props.isSavingTitle
 * @param {Function} props.onSelect
 * @param {Function} props.onStartEdit
 * @param {Function} props.onEditingTitleChange
 * @param {Function} props.onSaveTitle
 * @param {Function} props.onCancelEdit
 * @param {Function} props.onDelete
 */
function AiChatSidebarSessionItem({
  session,
  isActive,
  isEditing,
  editingTitle,
  isSavingTitle,
  onSelect,
  onStartEdit,
  onEditingTitleChange,
  onSaveTitle,
  onCancelEdit,
  onDelete,
}) {
  const inputRef = useRef(null);
  const sessionId = getSessionId(session);
  const title = session.title || 'Без названия';
  const relativeTime = formatRelativeTime(
    session.lastMessageAt || session.updatedAt || session.createdAt
  );

  useEffect(() => {
    if (!isEditing || !inputRef.current) {
      return;
    }

    inputRef.current.focus();
    inputRef.current.select();
  }, [isEditing]);

  const handleTitleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSaveTitle();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      onCancelEdit();
    }
  };

  return (
    <div
      role="listitem"
      className={`ai-chat-sidebar-session ${isActive ? 'ai-chat-sidebar-session--active' : ''} ${
        isEditing ? 'ai-chat-sidebar-session--editing' : ''
      }`}
      data-testid={`ai-chat-sidebar-session-${sessionId}`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="ai-chat-sidebar-session-input"
          value={editingTitle}
          maxLength={CHAT_SESSION_TITLE_MAX_LENGTH}
          disabled={isSavingTitle}
          aria-label="Название чата"
          data-testid="ai-chat-sidebar-session-rename-input"
          onChange={(event) => onEditingTitleChange(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          onBlur={() => onSaveTitle()}
        />
      ) : (
        <>
          <button
            type="button"
            className="ai-chat-sidebar-session-main"
            onClick={() => onSelect(sessionId)}
            title={title}
          >
            <span
              className="ai-chat-sidebar-session-title"
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onStartEdit(session);
              }}
            >
              {title}
            </span>
            {relativeTime ? (
              <span className="ai-chat-sidebar-session-time">{relativeTime}</span>
            ) : null}
          </button>

          <div className="ai-chat-sidebar-session-actions">
            <button
              type="button"
              className="ai-chat-sidebar-session-action"
              aria-label="Переименовать чат"
              data-testid={`ai-chat-sidebar-rename-${sessionId}`}
              onClick={(event) => {
                event.stopPropagation();
                onStartEdit(session);
              }}
            >
              <HiOutlinePencil aria-hidden="true" />
            </button>

            <button
              type="button"
              className="ai-chat-sidebar-session-action ai-chat-sidebar-session-action--delete"
              aria-label="Удалить чат"
              data-testid={`ai-chat-sidebar-delete-${sessionId}`}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(session);
              }}
            >
              <HiOutlineXMark aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * @param {object} props
 * @param {string|null} props.activeSessionId
 * @param {Array<object>} props.sessions
 * @param {Function} props.onNewChat
 * @param {Function} props.onSelectSession
 * @param {Function} props.onRenameSession
 * @param {Function} props.onDeleteSession
 * @param {Function} [props.onClose]
 */
export function AiChatSidebar({
  activeSessionId,
  sessions,
  onNewChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onClose,
}) {
  const isWelcomeActive = activeSessionId === null;
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  const handleNewChat = () => {
    setEditingSessionId(null);
    onNewChat();
    onClose?.();
  };

  const handleSelectSession = (sessionId) => {
    if (editingSessionId && editingSessionId !== sessionId) {
      setEditingSessionId(null);
    }

    onSelectSession(sessionId);
    onClose?.();
  };

  const handleStartEdit = useCallback((session) => {
    const sessionId = getSessionId(session);
    if (!sessionId) {
      return;
    }

    setEditingSessionId(sessionId);
    setEditingTitle(session.title || '');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingSessionId(null);
    setEditingTitle('');
  }, []);

  const handleSaveTitle = useCallback(async () => {
    if (!editingSessionId || isSavingTitle) {
      return;
    }

    const currentSession = sessions.find((session) => getSessionId(session) === editingSessionId);
    const previousTitle = normalizeChatSessionTitle(currentSession?.title);
    const nextTitle = normalizeChatSessionTitle(editingTitle);

    if (!nextTitle) {
      handleCancelEdit();
      return;
    }

    if (nextTitle === previousTitle) {
      handleCancelEdit();
      return;
    }

    setIsSavingTitle(true);

    try {
      const saved = await onRenameSession(editingSessionId, nextTitle);
      if (saved) {
        handleCancelEdit();
      }
    } finally {
      setIsSavingTitle(false);
    }
  }, [
    editingSessionId,
    editingTitle,
    handleCancelEdit,
    isSavingTitle,
    onRenameSession,
    sessions,
  ]);

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

            return (
              <AiChatSidebarSessionItem
                key={sessionId}
                session={session}
                isActive={activeSessionId === sessionId}
                isEditing={editingSessionId === sessionId}
                editingTitle={editingTitle}
                isSavingTitle={isSavingTitle}
                onSelect={handleSelectSession}
                onStartEdit={handleStartEdit}
                onEditingTitleChange={setEditingTitle}
                onSaveTitle={handleSaveTitle}
                onCancelEdit={handleCancelEdit}
                onDelete={onDeleteSession}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
