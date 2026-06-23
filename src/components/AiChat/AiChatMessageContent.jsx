import ReactMarkdown from 'react-markdown';

import { sanitizeChatText } from '../../utils/sanitizeChatText';

/**
 * @param {{ message: object }} props
 */
export function AiChatMessageContent({ message }) {
  if (message?.role === 'user') {
    const text = sanitizeChatText(message?.content?.text);
    return text || '—';
  }

  if (message?.status === 'failed') {
    return sanitizeChatText(message.error?.message) || 'Ошибка генерации';
  }

  if (message?.status === 'pending' || message?.status === 'processing') {
    return '…';
  }

  const assistantText = sanitizeChatText(message?.result?.text || message?.content?.text);

  if (!assistantText) {
    return '—';
  }

  return (
    <div className="ai-chat-message-markdown">
      <ReactMarkdown
        components={{
          a: ({ ...props }) => (
            <a target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {assistantText}
      </ReactMarkdown>
    </div>
  );
}
