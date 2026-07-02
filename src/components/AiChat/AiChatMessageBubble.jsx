import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

import { BsArrowRepeat } from 'react-icons/bs';

import { getThinkingPhraseForMessage } from '../../utils/aiChatThinkingPhrases';
import {
  getAssistantImageFiles,
  isAssistantImageGeneration,
} from '../../utils/aiChatImageResult';
import { normalizeMarkdownTables, sanitizeChatText } from '../../utils/sanitizeChatText';
import { splitAssistantMessageSections, prepareAssistantMarkdownSection } from '../../utils/aiChatAssistantSections';
import { getMessageAttachments } from '../../utils/chatAttachment';
import { Tooltip } from '../../ui/Tooltip/Tooltip';
import { AiChatImageResult } from './AiChatImageResult';
import { AiChatMarkdownCodeBlock } from './AiChatMarkdownCodeBlock';
import { isMarkdownBlockCode } from '../../utils/aiChatMarkdownCode';
import { AiChatMessageAttachments } from './AiChatMessageAttachments';
import { AiChatMessageMeta } from './AiChatMessageMeta';
import { AiChatUserMessageActions } from './AiChatUserMessageActions';
import './AiChatMessageBubble.css';

function MarkdownCode({ inline, className, children, ...props }) {
  const useBlockCode = inline === false || (inline == null && isMarkdownBlockCode(className, children));

  if (!useBlockCode) {
    return (
      <code className="ai-chat-message-inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <AiChatMarkdownCodeBlock className={className} {...props}>
      {children}
    </AiChatMarkdownCodeBlock>
  );
}

const MARKDOWN_PRE = ({ children }) => <>{children}</>;

const ASSISTANT_MARKDOWN_COMPONENTS = {
  a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
  pre: MARKDOWN_PRE,
  code: MarkdownCode,
  table: ({ children, ...props }) => (
    <div className="ai-chat-message-table-wrap">
      <table {...props}>{children}</table>
    </div>
  ),
};

const CAPTION_MARKDOWN_COMPONENTS = {
  a: ({ ...props }) => <a target="_blank" rel="noopener noreferrer" {...props} />,
  pre: MARKDOWN_PRE,
  code: MarkdownCode,
};

function renderAssistantMarkdown(text) {
  return prepareAssistantMarkdownSection(text);
}

/**
 * @param {string} text
 * @param {boolean} [isStreaming]
 */
function AssistantMarkdownSections({ text, isStreaming = false }) {
  const sections = splitAssistantMessageSections(text);
  const hasReasoning = sections.some((section) => section.type === 'reasoning');

  if (!hasReasoning) {
    return (
      <div className="ai-chat-message-markdown">
        <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={ASSISTANT_MARKDOWN_COMPONENTS}>
          {renderAssistantMarkdown(text)}
        </ReactMarkdown>
        {isStreaming ? <span className="ai-chat-streaming-cursor" aria-hidden="true" /> : null}
      </div>
    );
  }

  return (
    <div className="ai-chat-message-sections">
      {sections.map((section, index) => {
        const isLastSection = index === sections.length - 1;
        const showStreamingCursor = isStreaming && isLastSection && section.type === 'answer';
        const sectionMarkdown = renderAssistantMarkdown(section.content);

        if (section.type === 'reasoning') {
          return (
            <div
              key={`reasoning-${index}`}
              className="ai-chat-message-reasoning"
              data-testid="ai-chat-message-reasoning"
            >
              <div className="ai-chat-message-markdown ai-chat-message-markdown--reasoning">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={ASSISTANT_MARKDOWN_COMPONENTS}
                >
                  {sectionMarkdown}
                </ReactMarkdown>
              </div>
            </div>
          );
        }

        return (
          <div key={`answer-${index}`} className="ai-chat-message-markdown">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={ASSISTANT_MARKDOWN_COMPONENTS}
            >
              {sectionMarkdown}
            </ReactMarkdown>
            {showStreamingCursor ? <span className="ai-chat-streaming-cursor" aria-hidden="true" /> : null}
          </div>
        );
      })}
    </div>
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

  const imageFiles = getAssistantImageFiles(message);
  const isImageGeneration = isAssistantImageGeneration(message);
  const assistantText = normalizeMarkdownTables(
    sanitizeChatText(message?.result?.text || message?.content?.text)
  );

  if (imageFiles.length > 0) {
    return (
      <div className="ai-chat-message-assistant-content">
        <AiChatImageResult files={imageFiles} />
        {assistantText ? (
          <div className="ai-chat-message-markdown ai-chat-message-markdown--caption">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkBreaks]}
              components={CAPTION_MARKDOWN_COMPONENTS}
            >
              {assistantText}
            </ReactMarkdown>
          </div>
        ) : null}
      </div>
    );
  }

  if (isImageGeneration && message?.status === 'completed' && !assistantText) {
    return <div className="ai-chat-message-text">Изображение не получено</div>;
  }

  if (!assistantText) {
    return <div className="ai-chat-message-text">—</div>;
  }

  return <AssistantMarkdownSections text={assistantText} isStreaming={isStreaming} />;
}

function AiChatThinkingIndicator({ phrase }) {
  return (
    <span className="ai-chat-thinking" aria-label={phrase}>
      <span className="ai-chat-thinking-text">{phrase}</span>
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
 * @param {Function} [props.onResendUserMessage]
 * @param {string|null} [props.companyId]
 */
export function AiChatMessageBubble({ message, onRetry, onResendUserMessage, companyId = null }) {
  const isAssistant = message?.role === 'assistant';
  const isUser = message?.role === 'user';
  const isFailed = message?.status === 'failed';
  const isPending = message?.status === 'pending';
  const isProcessing = message?.status === 'processing';
  const streamingText = sanitizeChatText(message?.result?.text);
  const imageFiles = getAssistantImageFiles(message);
  const isStreaming = isAssistant && isProcessing && Boolean(streamingText);
  const showThinking =
    isAssistant
    && (isPending || (isProcessing && !streamingText && imageFiles.length === 0));
  const showMeta = isAssistant && message?.status === 'completed';
  const thinkingPhrase = showThinking ? getThinkingPhraseForMessage(message) : '';

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
            <AiChatThinkingIndicator phrase={thinkingPhrase} />
          </div>
        ) : (
          <AiChatMessageContent message={message} isStreaming={isStreaming} companyId={companyId} />
        )}

        {showMeta ? <AiChatMessageMeta message={message} companyId={companyId} /> : null}

        {isUser ? (
          <AiChatUserMessageActions
            message={message}
            companyId={companyId}
            onResend={onResendUserMessage}
          />
        ) : null}

        {isFailed && onRetry ? (
          <div className="ai-chat-message-retry-wrap">
            <Tooltip content="Повторить" position="bottom-shift-left">
              <button
                type="button"
                className="ai-chat-message-retry"
                onClick={() => onRetry(message)}
                aria-label="Повторить"
                data-testid="ai-chat-message-retry"
              >
                <BsArrowRepeat className="ai-chat-message-retry-icon" aria-hidden="true" />
              </button>
            </Tooltip>
          </div>
        ) : null}
      </div>
    </div>
  );
}
