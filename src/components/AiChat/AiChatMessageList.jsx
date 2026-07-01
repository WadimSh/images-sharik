import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import { getAiChatWelcomeGreeting } from '../../utils/aiChatWelcome';
import { AiChatMessageBubble } from './AiChatMessageBubble';
import './AiChatMessageList.css';

/**
 * @param {object} props
 */
export function AiChatMessageList({
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
  onRetry,
  onResendUserMessage,
  companyId,
}) {
  const { user } = useAuth();
  const showWelcome = isWelcomeState && messages.length === 0 && !messagesLoading;
  const { greetingLine, questionLine } = getAiChatWelcomeGreeting(user);

  return (
    <div className="ai-chat-message-list" data-testid="ai-chat-message-list">
      {messagesError && (
        <div className="ai-chat-banner ai-chat-banner-error">{messagesError}</div>
      )}

      {showWelcome && (
        <div className="ai-chat-welcome" data-testid="ai-chat-welcome">
          <img
            src={logo}
            alt=""
            className="ai-chat-welcome-logo"
            data-testid="ai-chat-welcome-logo"
          />
          <div className="ai-chat-welcome-text">
            <h3 className="ai-chat-welcome-greeting" data-testid="ai-chat-welcome-greeting">
              {greetingLine}
            </h3>
            <p className="ai-chat-welcome-question" data-testid="ai-chat-welcome-question">
              {questionLine}
            </p>
          </div>
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
              <AiChatMessageBubble
                key={message.id || message._id}
                message={message}
                companyId={companyId}
                onRetry={message.role === 'assistant' ? onRetry : undefined}
                onResendUserMessage={message.role === 'user' ? onResendUserMessage : undefined}
              />
            ))}
            <div ref={messagesEndRef} className="ai-chat-messages-scroll-anchor" aria-hidden="true" />
          </div>
        </>
      )}
    </div>
  );
}
