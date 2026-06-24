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
}) {
  const { user } = useAuth();
  const showWelcome = isWelcomeState && messages.length === 0 && !messagesLoading;
  const welcomeGreeting = getAiChatWelcomeGreeting(user);

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
          <h3 className="ai-chat-welcome-greeting">{welcomeGreeting}</h3>
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
                onRetry={message.role === 'assistant' ? onRetry : undefined}
              />
            ))}
            <div ref={messagesEndRef} className="ai-chat-messages-scroll-anchor" aria-hidden="true" />
          </div>
        </>
      )}
    </div>
  );
}
