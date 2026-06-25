import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { normalizeMarkdownTables, sanitizeChatText } from '../../utils/sanitizeChatText';
import { getMessageAttachments } from '../../utils/chatAttachment';
import { AiChatMessageAttachments } from './AiChatMessageAttachments';
import { AiChatMessageMeta } from './AiChatMessageMeta';
import './AiChatMessageBubble.css';

function MarkdownCode({ inline, children, ...props }) {
  if (inline) {
    return (
      <code className="ai-chat-message-inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <pre className="ai-chat-message-pre">
      <code {...props}>{children}</code>
    </pre>
  );
}

/**
 * @param {{ message: object, isStreaming?: boolean, companyId?: string|null }} props
 */
export function AiChatMessageContent({ message, isStreaming = false, companyId = null }) {
  if (message?.role === 'user') {
    const text = sanitizeChatText(message?.content?.text);
    const attachments = getMessageAttachments(message);

    return (
      <div className="ai-chat-message-user-content">
        {attachments.length > 0 ? (
          <AiChatMessageAttachments attachments={attachments} companyId={companyId} />
        ) : null}
        {text ? <div className="ai-chat-message-text">{text}</div> : null}
        {!text && attachments.length === 0 ? <div className="ai-chat-message-text">—</div> : null}
      </div>
    );
  }

  if (message?.status === 'failed') {
    return (
      <div className="ai-chat-message-error">
        {sanitizeChatText(message.error?.message) || 'Ошибка генерации'}
      </div>
    );
  }

  const assistantText = normalizeMarkdownTables(
    sanitizeChatText(message?.result?.text || message?.content?.text)
  );

  if (!assistantText) {
    return <div className="ai-chat-message-text">—</div>;
  }

  return (
    <div className="ai-chat-message-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
          code: MarkdownCode,
          table: ({ children, ...props }) => (
            <div className="ai-chat-message-table-wrap">
              <table {...props}>{children}</table>
            </div>
          ),
        }}
      >
        {assistantText}
      </ReactMarkdown>
      {isStreaming ? <span className="ai-chat-streaming-cursor" aria-hidden="true" /> : null}
    </div>
  );
}

function AiChatThinkingIndicator() {
  return (
    <span className="ai-chat-thinking" aria-label="Хороший вопрос, надо подумать">
      <span className="ai-chat-thinking-text">Хороший вопрос, надо подумать</span>
      <span className="ai-chat-thinking-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

/**
 * @param {object} props
 * @param {object} props.message
 * @param {Function} [props.onRetry]
 * @param {string|null} [props.companyId]
 */
export function AiChatMessageBubble({ message, onRetry, companyId = null }) {
  const isAssistant = message?.role === 'assistant';
  const isFailed = message?.status === 'failed';
  const isPending = message?.status === 'pending';
  const isProcessing = message?.status === 'processing';
  const streamingText = sanitizeChatText(message?.result?.text);
  const isStreaming = isAssistant && isProcessing && Boolean(streamingText);
  const showThinking = isAssistant && (isPending || (isProcessing && !streamingText));
  const showMeta = isAssistant && message?.status === 'completed';

  return (
    <div
      className={`ai-chat-message-row ai-chat-message-row--${message.role} ${
        isFailed ? 'ai-chat-message-row--failed' : ''
      }`}
      data-testid={`ai-chat-message-${message.role}`}
    >
      <div className={`ai-chat-message-bubble ai-chat-message-bubble--${message.role}`}>
        {showThinking ? (
          <div className="ai-chat-message-status">
            <AiChatThinkingIndicator />
          </div>
        ) : (
          <AiChatMessageContent message={message} isStreaming={isStreaming} companyId={companyId} />
        )}

        {showMeta ? <AiChatMessageMeta message={message} /> : null}

        {isFailed && onRetry ? (
          <button
            type="button"
            className="ai-chat-message-retry"
            onClick={() => onRetry(message)}
          >
            Повторить
          </button>
        ) : null}
      </div>
    </div>
  );
}
