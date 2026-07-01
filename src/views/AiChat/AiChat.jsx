import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAiChatInit } from '../../hooks/useAiChatInit';
import { getChatMessageId, useChatMessages } from '../../hooks/useChatMessages';
import { useSendChatMessage } from '../../hooks/useSendChatMessage';
import { AiChatArchiveSessionModal } from '../../components/AiChat/AiChatArchiveSessionModal';
import { AiChatComposer } from '../../components/AiChat/AiChatComposer';
import { AiChatHeader } from '../../components/AiChat/AiChatHeader';
import { AiChatLayout } from '../../components/AiChat/AiChatLayout';
import { AiChatMessageList } from '../../components/AiChat/AiChatMessageList';
import { AiChatModeSwitch } from '../../components/AiChat/AiChatModeSwitch';
import { AiChatSidebar } from '../../components/AiChat/AiChatSidebar';
import { AiChatStatusBar } from '../../components/AiChat/AiChatStatusBar';
import { LibraryMediaModal } from '../../components/LibraryMediaModal/LibraryMediaModal';
import { apiArchiveChatSession, apiGetStudioFileUrl, apiPatchChatSession } from '../../services/chatService';
import { getUserMessageResendPayload } from '../../utils/aiChatUserMessage';
import {
  MITUP_MAX_ATTACHMENT_BYTES,
  normalizeMongoFileId,
  parseAttachmentSizeBytes,
  validateAttachmentSize,
} from '../../utils/chatAttachment';
import { getSessionId, normalizeChatSessionTitle } from '../../utils/chatSession';
import {
  createDefaultAiSettings,
  DEFAULT_OUTPUT_TYPE,
  inferOutputTypeFromMessages,
  normalizeAiSettingsForOutputType,
  normalizeImageSettingsForModel,
} from '../../utils/aiChatSettings';
import {
  canAttachFromLibrary,
  filterModelsByOutputType,
  findMitupModelByValue,
  isExtensionAllowed,
  resolveDefaultModelValue,
} from '../../utils/mitupModels';
import { isMinuteRateLimitReached } from '../../utils/mitupLimits';
import './AiChat.css';

export const AiChat = () => {
  const navigate = useNavigate();
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeletingSession, setIsDeletingSession] = useState(false);
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
    removeSession,
    updateBalance,
    updateLimitsFromResult,
  } = useAiChatInit();

  const [aiSettings, setAiSettings] = useState(() => createDefaultAiSettings());

  const availableModels = useMemo(
    () => filterModelsByOutputType(models, aiSettings.outputType),
    [models, aiSettings.outputType]
  );

  const selectedModel = useMemo(
    () => findMitupModelByValue(models, aiSettings.model),
    [models, aiSettings.model]
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
    selectedModel,
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
    onFinished: ({ balance: nextBalance, result, sessionId }) => {
      if (nextBalance) {
        updateBalance(nextBalance);
      }
      if (result?.limits) {
        updateLimitsFromResult(result.limits);
      }
      if (sessionId) {
        updateSession(sessionId, { lastMessageAt: new Date().toISOString() });
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
      setAiSettings((prev) =>
        normalizeImageSettingsForModel({ ...prev, model }, findMitupModelByValue(models, model))
      );
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

    const attachments = attachment ? [attachment] : [];
    const result = await sendMessage({ prompt, attachments });
    if (result) {
      setPrompt('');
      setAttachment(null);
    }
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    setPrompt('');
    setAttachment(null);
    clearSendError();
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    clearSendError();
  };

  const handleRenameSession = useCallback(
    async (sessionId, title) => {
      const normalizedTitle = normalizeChatSessionTitle(title);
      if (!sessionId || !normalizedTitle || !companyId) {
        return false;
      }

      try {
        await apiPatchChatSession(sessionId, { title: normalizedTitle }, companyId);
        updateSession(sessionId, { title: normalizedTitle });
        return true;
      } catch (error) {
        console.warn('[AiChat] failed to rename session:', error);
        window.alert('Не удалось переименовать чат. Попробуйте ещё раз.');
        return false;
      }
    },
    [companyId, updateSession]
  );

  const handleDeleteSessionRequest = useCallback((session) => {
    setDeleteTarget(session);
  }, []);

  const handleDeleteSessionClose = useCallback(() => {
    if (isDeletingSession) {
      return;
    }

    setDeleteTarget(null);
  }, [isDeletingSession]);

  const handleDeleteSessionConfirm = useCallback(async () => {
    const sessionId = getSessionId(deleteTarget);
    if (!sessionId || !companyId || isDeletingSession) {
      return;
    }

    setIsDeletingSession(true);

    try {
      await apiArchiveChatSession(sessionId, companyId);
      removeSession(sessionId);

      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setPrompt('');
        setAttachment(null);
        clearSendError();
      }

      setDeleteTarget(null);
    } catch (error) {
      console.warn('[AiChat] failed to delete session:', error);
      window.alert('Не удалось удалить чат. Попробуйте ещё раз.');
    } finally {
      setIsDeletingSession(false);
    }
  }, [
    activeSessionId,
    deleteTarget,
    clearSendError,
    companyId,
    isDeletingSession,
    removeSession,
  ]);

  const isRateLimited = isMinuteRateLimitReached(limits);

  const isLastAssistantPendingOrProcessing = messages.some((message, index) => {
    if (message.role !== 'assistant') {
      return false;
    }

    return (
      (message.status === 'pending' || message.status === 'processing') &&
      !messages.slice(index + 1).some((nextMessage) => nextMessage.role === 'assistant')
    );
  });

  const handleResendUserMessage = useCallback(
    (userMessage) => {
      const payload = getUserMessageResendPayload(userMessage);
      if (
        !payload
        || !aiSettings.model
        || isRateLimited
        || isLastAssistantPendingOrProcessing
      ) {
        return;
      }

      clearSendError();
      sendMessage({ prompt: payload.prompt, attachments: payload.attachments });
    },
    [
      aiSettings.model,
      isRateLimited,
      isLastAssistantPendingOrProcessing,
      sendMessage,
      clearSendError,
    ]
  );

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

      if (!userMessage) {
        return;
      }

      handleResendUserMessage(userMessage);
    },
    [messages, handleResendUserMessage]
  );

  const composerDisabled =
    initLoading ||
    !mitupConfigured ||
    isSending ||
    isLastAssistantPendingOrProcessing ||
    availableModels.length === 0 ||
    isRateLimited;
  const canAttach = canAttachFromLibrary(selectedModel);
  const inputDisabled = composerDisabled;
  const canSend =
    Boolean(aiSettings.model) &&
    Boolean(prompt.trim()) &&
    !composerDisabled;
  const showMessages = !isWelcomeState || messages.length > 0;
  const isWelcomeCenter = isWelcomeState && messages.length === 0 && !messagesLoading;
  const showModeSwitch = isWelcomeCenter;
  const showSidebar = sessions.length > 0;

  useEffect(() => {
    if (!showSidebar && sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [showSidebar, sidebarOpen]);

  useEffect(() => {
    if (!canAttach) {
      setAttachment(null);
      setLibraryModalOpen(false);
    }
  }, [canAttach]);

  const handleLibrarySelect = useCallback(
    async (file) => {
      const fileName = file?.fileName || 'image';
      if (!isExtensionAllowed(selectedModel, fileName)) {
        window.alert('Формат файла не поддерживается выбранной моделью.');
        return;
      }

      const mimeType =
        file?.mimeType
        || (fileName.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/jpeg');

      const fileId = normalizeMongoFileId(file?.id ?? file?.fileId ?? file?._id);
      if (!fileId) {
        window.alert('Не удалось определить ID файла. Выберите другое изображение.');
        return;
      }

      let previewUrl = file?.url;
      let sizeBytes = parseAttachmentSizeBytes(file?.size ?? file?.sizeBytes);

      if (companyId) {
        try {
          const studioFile = await apiGetStudioFileUrl(fileId, companyId);
          previewUrl = studioFile?.url || previewUrl;
          if (sizeBytes == null) {
            sizeBytes = parseAttachmentSizeBytes(studioFile?.size ?? studioFile?.sizeBytes);
          }
        } catch (error) {
          console.warn('[AiChat] failed to resolve studio file url:', error);
        }
      }

      const sizeError = validateAttachmentSize(sizeBytes);
      if (sizeError) {
        window.alert(sizeError);
        return;
      }

      setAttachment({
        fileId,
        fileName,
        url: previewUrl,
        mimeType,
        ...(sizeBytes != null ? { sizeBytes } : {}),
      });
      clearSendError();
    },
    [selectedModel, clearSendError, companyId]
  );

  const headerMeta = !initLoading ? (
    <AiChatStatusBar balance={balance} limits={limits} formatBalance={formatBalance} />
  ) : null;

  return (
    <div className="ai-chat-page">
      <AiChatHeader
        onBack={handleBack}
        meta={headerMeta}
        showSidebarToggle={showSidebar && !initLoading}
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
            showSidebar={showSidebar}
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
                onRenameSession={handleRenameSession}
                onDeleteSession={handleDeleteSessionRequest}
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
                onResendUserMessage={handleResendUserMessage}
                companyId={companyId}
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
                selectedModel={selectedModel}
                outputType={aiSettings.outputType}
                composerDisabled={composerDisabled}
                inputDisabled={inputDisabled}
                canSend={canSend}
                isSending={isSending}
                sendError={sendError}
                canAttach={canAttach}
                attachment={attachment}
                onAttachClick={() => setLibraryModalOpen(true)}
                onRemoveAttachment={() => setAttachment(null)}
                attachTooltipPosition={isWelcomeCenter ? 'bottom' : 'top'}
              />
            }
          />
        )}
      </div>

      {libraryModalOpen ? (
        <LibraryMediaModal
          isOpen={libraryModalOpen}
          onClose={() => setLibraryModalOpen(false)}
          onSelectImage={handleLibrarySelect}
          maxSelectableFileBytes={MITUP_MAX_ATTACHMENT_BYTES}
        />
      ) : null}

      <AiChatArchiveSessionModal
        isOpen={Boolean(deleteTarget)}
        sessionTitle={deleteTarget?.title}
        isSubmitting={isDeletingSession}
        onClose={handleDeleteSessionClose}
        onConfirm={handleDeleteSessionConfirm}
      />
    </div>
  );
};
