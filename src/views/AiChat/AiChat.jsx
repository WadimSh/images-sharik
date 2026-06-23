import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAiChatInit } from '../../hooks/useAiChatInit';
import { useChatMessages } from '../../hooks/useChatMessages';
import { useSendChatMessage } from '../../hooks/useSendChatMessage';
import { AiChatComposerPlaceholder } from '../../components/AiChat/AiChatComposerPlaceholder';
import { AiChatHeader } from '../../components/AiChat/AiChatHeader';
import { AiChatLayout } from '../../components/AiChat/AiChatLayout';
import { AiChatMessageListPlaceholder } from '../../components/AiChat/AiChatMessageListPlaceholder';
import { AiChatSidebar } from '../../components/AiChat/AiChatSidebar';
import { filterTextModels, getModelLabel } from '../../utils/mitupModels';
import './AiChat.css';

const DEFAULT_TEMPERATURE = 0.9;
const DEFAULT_TOP_P = 1;

export const AiChat = () => {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const skipInitialLoadRef = useRef(false);

  const {
    loading: initLoading,
    error: initError,
    mitupConfigured,
    balance,
    limits,
    formatBalance,
    companyId,
    models,
    sessions,
    prependSession,
    updateBalance,
  } = useAiChatInit();

  const textModels = useMemo(() => filterTextModels(models), [models]);

  const [aiSettings, setAiSettings] = useState({
    model: '',
    temperature: DEFAULT_TEMPERATURE,
    topP: DEFAULT_TOP_P,
    thinking: false,
    webSearch: false,
  });

  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    error: messagesError,
    hasMore,
    isWelcomeState,
    loadMore,
    appendMessage,
    updateMessage,
    scrollContainerRef,
    messagesEndRef,
  } = useChatMessages({ companyId, activeSessionId, skipInitialLoadRef });

  const { sendMessage, isSending, sendError, clearSendError } = useSendChatMessage({
    companyId,
    activeSessionId,
    aiSettings,
    appendMessage,
    updateMessage,
    skipInitialLoadRef,
    onSessionCreated: (session) => {
      const sessionId = session?.id || session?._id;
      if (sessionId) {
        setActiveSessionId(sessionId);
      }
      prependSession(session);
    },
    onFinished: ({ balance: nextBalance }) => {
      if (nextBalance) {
        updateBalance(nextBalance);
      }
    },
  });

  const handleBack = () => {
    navigate('/');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearSendError();

    const result = await sendMessage({ prompt });
    if (result) {
      setPrompt('');
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setPrompt('');
    clearSendError();
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    clearSendError();
  };

  const limitUsage = limits?.usage?.minute;
  const limitMax = limits?.max?.minute;
  const composerDisabled = initLoading || !mitupConfigured || isSending || textModels.length === 0;
  const canSend = Boolean(aiSettings.model) && Boolean(prompt.trim()) && !composerDisabled;
  const showMessages = !isWelcomeState || messages.length > 0;

  const headerMeta = !initLoading ? (
    <>
      <span className="ai-chat-header-meta-item">
        Баланс: {formatBalance(balance)}
      </span>
      {limitMax != null && (
        <span className="ai-chat-header-meta-item">
          Лимит: {limitUsage ?? 0}/{limitMax}/мин
        </span>
      )}
    </>
  ) : null;

  return (
    <div className="ai-chat-page">
      <AiChatHeader
        onBack={handleBack}
        meta={headerMeta}
        showSidebarToggle={!initLoading}
        onOpenSidebar={() => setSidebarOpen(true)}
      />

      {!mitupConfigured && !initLoading && (
        <div className="ai-chat-banner ai-chat-banner-warning">
          Mitup не настроен. Обратитесь к администратору компании.
        </div>
      )}

      {initError && !initLoading && (
        <div className="ai-chat-banner ai-chat-banner-error">
          {initError}
        </div>
      )}

      <div className="ai-chat-content">
        {initLoading && <div className="ai-chat-loading">Загрузка…</div>}

        {!initLoading && (
          <AiChatLayout
            sidebarOpen={sidebarOpen}
            onSidebarClose={() => setSidebarOpen(false)}
            sidebar={
              <AiChatSidebar
                activeSessionId={activeSessionId}
                sessions={sessions}
                onNewChat={handleNewChat}
                onSelectSession={handleSelectSession}
                onClose={() => setSidebarOpen(false)}
              />
            }
            main={
              <AiChatMessageListPlaceholder
                messages={messages}
                messagesError={messagesError}
                isWelcomeState={isWelcomeState}
                messagesLoading={messagesLoading}
                showMessages={showMessages}
                hasMore={hasMore}
                loadingMore={loadingMore}
                loadMore={loadMore}
                scrollContainerRef={scrollContainerRef}
                messagesEndRef={messagesEndRef}
              />
            }
            composer={
              <AiChatComposerPlaceholder
                prompt={prompt}
                onPromptChange={setPrompt}
                onSubmit={handleSubmit}
                aiSettings={aiSettings}
                onModelChange={(model) => {
                  setAiSettings((prev) => ({ ...prev, model }));
                  clearSendError();
                }}
                textModels={textModels}
                getModelLabel={getModelLabel}
                composerDisabled={composerDisabled}
                canSend={canSend}
                isSending={isSending}
                sendError={sendError}
              />
            }
          />
        )}
      </div>
    </div>
  );
};
