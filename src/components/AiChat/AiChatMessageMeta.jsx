import { useCallback, useState } from 'react';
import { HiOutlineCheck } from 'react-icons/hi2';
import { PiCopySimple } from 'react-icons/pi';

import { Tooltip } from '../../ui/Tooltip/Tooltip';
import {
  getAssistantMessageCopyText,
  getAssistantMessageMeta,
} from '../../utils/aiChatMessage';
import {
  getAssistantImageFiles,
  isAssistantImageGeneration,
} from '../../utils/aiChatImageResult';
import { AiChatSaveImageToLibraryAction } from './AiChatSaveImageToLibraryAction';

/**
 * @param {{ message: object, companyId?: string|null }} props
 */
export function AiChatMessageMeta({ message, companyId = null }) {
  const meta = getAssistantMessageMeta(message);
  const copyText = getAssistantMessageCopyText(message);
  const imageFiles = getAssistantImageFiles(message);
  const showSaveToLibrary = isAssistantImageGeneration(message) && imageFiles.length > 0;
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!copyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('[AiChat] failed to copy message:', error);
    }
  }, [copyText]);

  if (!meta?.model && !meta?.costLabel && !copyText && !showSaveToLibrary) {
    return null;
  }

  const copyLabel = copied ? 'Скопировано' : 'Копировать ответ';

  return (
    <div className="ai-chat-message-meta" data-testid="ai-chat-message-meta">
      <div className="ai-chat-message-meta-info">
        {meta?.model ? (
          <span className="ai-chat-message-meta-model">{meta.model}</span>
        ) : null}
        {meta?.model && meta?.costLabel ? (
          <span className="ai-chat-message-meta-separator"> · </span>
        ) : null}
        {meta?.costLabel ? (
          <span className="ai-chat-message-meta-cost">{meta.costLabel}</span>
        ) : null}
      </div>

      {showSaveToLibrary ? (
        <AiChatSaveImageToLibraryAction imageFile={imageFiles[0]} companyId={companyId} />
      ) : null}

      {!showSaveToLibrary && copyText ? (
        <Tooltip content={copyLabel} position="bottom-shift-left">
          <button
            type="button"
            className={`ai-chat-message-meta-copy${copied ? ' ai-chat-message-meta-copy--copied' : ''}`}
            onClick={handleCopy}
            aria-label={copyLabel}
            data-testid="ai-chat-message-copy"
          >
            {copied ? (
              <HiOutlineCheck className="ai-chat-message-meta-copy-icon" aria-hidden="true" />
            ) : (
              <PiCopySimple className="ai-chat-message-meta-copy-icon" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
}
