import { HiOutlineXMark } from 'react-icons/hi2';

import './AiChatAttachmentPreview.css';

/**
 * @param {object} props
 * @param {{ fileName?: string, url?: string|null }} props.attachment
 * @param {Function} [props.onRemove]
 * @param {string} [props.testId]
 */
export function AiChatAttachmentPreview({ attachment, onRemove, testId }) {
  const fileName = attachment?.fileName || 'Изображение';
  const previewUrl = attachment?.url || null;

  return (
    <div className="ai-chat-attachment-card" data-testid={testId}>
      <div className="ai-chat-attachment-preview">
        {previewUrl ? (
          <img src={previewUrl} alt="" className="ai-chat-attachment-thumb" />
        ) : (
          <div
            className="ai-chat-attachment-thumb ai-chat-attachment-thumb--empty"
            aria-hidden="true"
          />
        )}
        {onRemove ? (
          <button
            type="button"
            className="ai-chat-attachment-remove"
            onClick={onRemove}
            aria-label="Удалить вложение"
            data-testid={testId ? `${testId}-remove` : undefined}
          >
            <HiOutlineXMark aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <span className="ai-chat-attachment-name" title={fileName}>
        {fileName}
      </span>
    </div>
  );
}
