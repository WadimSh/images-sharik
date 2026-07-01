import { useCallback, useState } from 'react';
import { BsArrowRepeat } from 'react-icons/bs';
import { HiOutlineCheck } from 'react-icons/hi2';
import { PiCopySimple } from 'react-icons/pi';

import {
  canShowUserMessageActions,
  resolveUserMessageCopyText,
} from '../../utils/aiChatUserMessage';
import { Tooltip } from '../../ui/Tooltip/Tooltip';

/**
 * @param {object} props
 * @param {object} props.message
 * @param {string|null|undefined} props.companyId
 * @param {Function} [props.onResend]
 */
export function AiChatUserMessageActions({ message, companyId = null, onResend }) {
  const [copied, setCopied] = useState(false);

  const showActions = canShowUserMessageActions(message);

  const handleCopy = useCallback(async () => {
    const copyText = await resolveUserMessageCopyText(message, companyId);
    if (!copyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('[AiChat] failed to copy user prompt:', error);
    }
  }, [companyId, message]);

  if (!showActions) {
    return null;
  }

  const copyLabel = copied ? 'Скопировано' : 'Копировать';

  return (
    <div className="ai-chat-message-user-actions" data-testid="ai-chat-user-message-actions">
      {onResend ? (
        <Tooltip content="Повторить" position="bottom-shift-left">
          <button
            type="button"
            className="ai-chat-message-user-action"
            onClick={() => onResend(message)}
            aria-label="Повторить"
            data-testid="ai-chat-user-message-repeat"
          >
            <BsArrowRepeat className="ai-chat-message-user-action-icon" aria-hidden="true" />
          </button>
        </Tooltip>
      ) : null}

      <Tooltip content={copyLabel} position="bottom-shift-left">
        <button
          type="button"
          className={`ai-chat-message-user-action${
            copied ? ' ai-chat-message-user-action--copied' : ''
          }`}
          onClick={handleCopy}
          aria-label={copyLabel}
          data-testid="ai-chat-user-message-copy"
        >
          {copied ? (
            <HiOutlineCheck className="ai-chat-message-user-action-icon" aria-hidden="true" />
          ) : (
            <PiCopySimple className="ai-chat-message-user-action-icon" aria-hidden="true" />
          )}
        </button>
      </Tooltip>
    </div>
  );
}
