import { HiOutlineXMark } from 'react-icons/hi2';

import './AiChatArchiveSessionModal.css';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string} props.sessionTitle
 * @param {boolean} [props.isSubmitting]
 * @param {Function} props.onClose
 * @param {Function} props.onConfirm
 */
export function AiChatArchiveSessionModal({
  isOpen,
  sessionTitle,
  isSubmitting = false,
  onClose,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  const title = sessionTitle || 'Без названия';

  return (
    <div
      className="ai-chat-delete-session-modal"
      onClick={onClose}
      data-testid="ai-chat-delete-session-modal"
    >
      <div
        className="ai-chat-delete-session-modal-content"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ai-chat-delete-session-modal-header">
          <HiOutlineXMark className="ai-chat-delete-session-modal-icon" aria-hidden="true" />
          <h3>Удаление чата</h3>
        </div>

        <div className="ai-chat-delete-session-modal-body">
          <p>
            Вы уверены, что хотите удалить чат <strong>«{title}»</strong>?
          </p>
          <p className="ai-chat-delete-session-modal-warning">
            Это действие невозможно отменить.
          </p>
        </div>

        <div className="ai-chat-delete-session-modal-footer">
          <button
            type="button"
            className="ai-chat-delete-session-modal-btn ai-chat-delete-session-modal-btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отменить
          </button>
          <button
            type="button"
            className="ai-chat-delete-session-modal-btn ai-chat-delete-session-modal-btn-danger"
            onClick={onConfirm}
            disabled={isSubmitting}
            data-testid="ai-chat-delete-session-confirm"
          >
            {isSubmitting ? 'Удаление…' : 'Удалить'}
          </button>
        </div>
      </div>
    </div>
  );
}
