import { AiChatMessageContent } from './AiChatMessageContent';
import { AiChatMessageMeta } from './AiChatMessageMeta';

/**
 * Placeholder ленты сообщений до TASK-2.2 (AiChatMessageList).
 */
export function AiChatMessageListPlaceholder({
  messages,
  messagesError,
  isWelcomeState,
  messagesLoading,
  showMessages,
  hasMore,
  loadingMore,
  loadMore,
  scrollContainerRef,
  messagesEndRef,
}) {
  return (
    <div className="ai-chat-message-list-placeholder" data-testid="ai-chat-message-list">
      {messagesError && (
        <div className="ai-chat-banner ai-chat-banner-error">{messagesError}</div>
      )}

      {isWelcomeState && messages.length === 0 && !messagesLoading && (
        <div className="ai-chat-welcome">
          <h3>Начните диалог</h3>
          <p>Выберите чат слева или отправьте первое сообщение в новом чате.</p>
        </div>
      )}

      {showMessages && (
        <>
          {messagesLoading && messages.length === 0 && (
            <div className="ai-chat-loading">Загрузка сообщений…</div>
          )}

          <div ref={scrollContainerRef} className="ai-chat-messages-scroll">
            {hasMore && (
              <button
                type="button"
                className="ai-chat-load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Загрузка…' : 'Загрузить ранее'}
              </button>
            )}

            {messages.map((message) => (
              <div
                key={message.id || message._id}
                className={`ai-chat-message-row ai-chat-message-row--${message.role} ${
                  message.status === 'failed' ? 'ai-chat-message-row--failed' : ''
                }`}
                data-testid={`ai-chat-message-${message.role}`}
              >
                <div className="ai-chat-message-bubble">
                  <AiChatMessageContent message={message} />
                  {message.role === 'assistant' && <AiChatMessageMeta message={message} />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </>
      )}
    </div>
  );
}
