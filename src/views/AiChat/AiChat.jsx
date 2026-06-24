import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAiChatInit } from '../../hooks/useAiChatInit';
import { getChatMessageId, useChatMessages } from '../../hooks/useChatMessages';
import { useSendChatMessage } from '../../hooks/useSendChatMessage';
import { AiChatComposer } from '../../components/AiChat/AiChatComposer';
import { AiChatHeader } from '../../components/AiChat/AiChatHeader';
import { AiChatLayout } from '../../components/AiChat/AiChatLayout';
import { AiChatMessageList } from '../../components/AiChat/AiChatMessageList';
import { AiChatModeSwitch } from '../../components/AiChat/AiChatModeSwitch';
import { AiChatSidebar } from '../../components/AiChat/AiChatSidebar';
import { AiChatStatusBar } from '../../components/AiChat/AiChatStatusBar';
import { apiPatchChatSession } from '../../services/chatService';
import { getSessionId } from '../../utils/chatSession';
import {
  createDefaultAiSettings,
  DEFAULT_OUTPUT_TYPE,
  inferOutputTypeFromMessages,
  normalizeAiSettingsForOutputType,
} from '../../utils/aiChatSettings';
import {
  filterModelsByOutputType,
  resolveDefaultModelValue,
} from '../../utils/mitupModels';
import { isMinuteRateLimitReached } from '../../utils/mitupLimits';
import './AiChat.css';

export const AiChat = () => {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const skipInitialLoadRef = useRef(false);
  const prevSessionIdRef = useRef(null);

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
    updateSession,
    updateBalance,
    updateLimitsFromResult,
  } = useAiChatInit();

  const [aiSettings, setAiSettings] = useState(() => createDefaultAiSettings());

  const availableModels = useMemo(
    () => filterModelsByOutputType(models, aiSettings.outputType),
    [models, aiSettings.outputType]
  );

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
    scrollToBottom,
  } = useChatMessages({ companyId, activeSessionId, skipInitialLoadRef });

  const { sendMessage, isSending, sendError, clearSendError } = useSendChatMessage({
    companyId,
    activeSessionId,
    aiSettings,
    appendMessage,
    updateMessage,
    skipInitialLoadRef,
    scrollToBottom,
    onSessionCreated: (session) => {
      const sessionId = session?.id || session?._id;
      if (sessionId) {
        setActiveSessionId(sessionId);
      }
      prependSession(session);
    },
    onFinished: ({ balance: nextBalance, result }) => {
      if (nextBalance) {
        updateBalance(nextBalance);
      }
      if (result?.limits) {
        updateLimitsFromResult(result.limits);
      }
    },
  });

  useEffect(() => {
    const previousSessionId = prevSessionIdRef.current;
    prevSessionIdRef.current = activeSessionId;

    if (!activeSessionId) {
      if (previousSessionId) {
        setAiSettings((prev) =>
          normalizeAiSettingsForOutputType({ ...prev, model: '' }, DEFAULT_OUTPUT_TYPE, models)
        );
      }
      return;
    }

    const activeSession = sessions.find((session) => getSessionId(session) === activeSessionId);
    const nextModel = resolveDefaultModelValue(
      models,
      aiSettings.outputType,
      activeSession?.defaultModel
    );

    setAiSettings((prev) => (prev.model === nextModel ? prev : { ...prev, model: nextModel }));
  }, [activeSessionId, sessions, models, aiSettings.outputType]);

  useEffect(() => {
    if (!activeSessionId || messagesLoading || messages.length === 0) {
      return;
    }

    const inferredOutputType = inferOutputTypeFromMessages(messages);
    if (!inferredOutputType) {
      return;
    }

    setAiSettings((prev) =>
      prev.outputType === inferredOutputType
        ? prev
        : normalizeAiSettingsForOutputType(prev, inferredOutputType, models)
    );
  }, [activeSessionId, messages, messagesLoading, models]);

  const handleOutputTypeChange = useCallback(
    (nextOutputType) => {
      if (activeSessionId || messages.length > 0) {
        return;
      }

      setAiSettings((prev) => normalizeAiSettingsForOutputType(prev, nextOutputType, models));
      clearSendError();
    },
    [activeSessionId, messages.length, models, clearSendError]
  );

  const handleSettingsChange = useCallback(
    (patch) => {
      setAiSettings((prev) => ({ ...prev, ...patch }));
      clearSendError();
    },
    [clearSendError]
  );

  const handleModelChange = useCallback(
    async (model) => {
      setAiSettings((prev) => ({ ...prev, model }));
      clearSendError();

      if (!activeSessionId || !companyId) {
        return;
      }

      try {
        await apiPatchChatSession(activeSessionId, { defaultModel: model }, companyId);
        updateSession(activeSessionId, { defaultModel: model });
      } catch (error) {
        console.warn('[AiChat] failed to persist defaultModel:', error);
      }
    },
    [activeSessionId, companyId, clearSendError, updateSession]
  );

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

  const isRateLimited = isMinuteRateLimitReached(limits);

  const handleRetry = useCallback(
    (failedMessage) => {
      const failedId = getChatMessageId(failedMessage);
      const failedIndex = messages.findIndex((message) => getChatMessageId(message) === failedId);

      if (failedIndex <= 0) {
        return;
      }

      const userMessage = messages
        .slice(0, failedIndex)
        .reverse()
        .find((message) => message.role === 'user');

      const text = userMessage?.content?.text?.trim();
      if (!text || !aiSettings.model || isSending || isRateLimited) {
        return;
      }

      clearSendError();
      sendMessage({ prompt: text });
    },
    [messages, aiSettings.model, isSending, isRateLimited, sendMessage, clearSendError]
  );

  const isLastAssistantPendingOrProcessing = messages.some((message, index) => {
    if (message.role !== 'assistant') {
      return false;
    }

    return (
      (message.status === 'pending' || message.status === 'processing') &&
      !messages.slice(index + 1).some((nextMessage) => nextMessage.role === 'assistant')
    );
  });

  const composerDisabled =
    initLoading ||
    !mitupConfigured ||
    isSending ||
    isLastAssistantPendingOrProcessing ||
    availableModels.length === 0 ||
    isRateLimited;
  const isImageMode = aiSettings.outputType === 'out_image';
  const inputDisabled = composerDisabled || isImageMode;
  const canSend =
    !isImageMode &&
    Boolean(aiSettings.model) &&
    Boolean(prompt.trim()) &&
    !composerDisabled;
  const showMessages = !isWelcomeState || messages.length > 0;
  const isWelcomeCenter = isWelcomeState && messages.length === 0 && !messagesLoading;
  const showModeSwitch = isWelcomeCenter;

  const headerMeta = !initLoading ? (
    <AiChatStatusBar balance={balance} limits={limits} formatBalance={formatBalance} />
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
            isWelcomeCenter={isWelcomeCenter}
            modeSwitch={
              showModeSwitch ? (
                <AiChatModeSwitch
                  value={aiSettings.outputType}
                  onChange={handleOutputTypeChange}
                  disabled={composerDisabled}
                />
              ) : null
            }
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
              <AiChatMessageList
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
                onRetry={handleRetry}
              />
            }
            composer={
              <AiChatComposer
                prompt={prompt}
                onPromptChange={setPrompt}
                onSubmit={handleSubmit}
                aiSettings={aiSettings}
                onModelChange={handleModelChange}
                onSettingsChange={handleSettingsChange}
                models={models}
                outputType={aiSettings.outputType}
                composerDisabled={composerDisabled}
                inputDisabled={inputDisabled}
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
