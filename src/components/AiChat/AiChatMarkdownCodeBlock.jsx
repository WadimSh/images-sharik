import { useCallback, useState } from 'react';
import { HiOutlineCheck } from 'react-icons/hi2';
import { PiCopySimple } from 'react-icons/pi';

import { getMarkdownCodeBlockLabel } from '../../utils/aiChatMarkdownCode';
import { Tooltip } from '../../ui/Tooltip/Tooltip';

/**
 * @param {object} props
 * @param {string} [props.className]
 * @param {import('react').ReactNode} props.children
 */
export function AiChatMarkdownCodeBlock({ className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const text = String(children ?? '').replace(/\n$/, '');
  const languageLabel = getMarkdownCodeBlockLabel(className, children);

  const handleCopy = useCallback(async () => {
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.warn('[AiChat] failed to copy code block:', error);
    }
  }, [text]);

  const copyLabel = copied ? 'Скопировано' : 'Копировать код';

  return (
    <div className="ai-chat-message-code-block" data-testid="ai-chat-message-code-block">
      <div className="ai-chat-message-code-header">
        <span className="ai-chat-message-code-lang">{languageLabel}</span>
        <Tooltip content={copyLabel} position="bottom-shift-left">
          <button
            type="button"
            className={`ai-chat-message-code-copy${copied ? ' ai-chat-message-code-copy--copied' : ''}`}
            onClick={handleCopy}
            aria-label={copyLabel}
            data-testid="ai-chat-message-code-copy"
          >
            {copied ? (
              <HiOutlineCheck className="ai-chat-message-code-copy-icon" aria-hidden="true" />
            ) : (
              <PiCopySimple className="ai-chat-message-code-copy-icon" aria-hidden="true" />
            )}
          </button>
        </Tooltip>
      </div>
      <pre className="ai-chat-message-pre">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}
