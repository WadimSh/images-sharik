import { useCallback, useRef, useState } from 'react';

import { extractEditorAiLogId } from '../components/ImageEditor/utils/editorAiLogUtils';
import {
  apiCompleteEditorAiLog,
  apiProcessingEditorAiLog,
  apiStartEditorAiLog,
} from '../services/editorAiLogService';
import {
  apiCreateChatSession,
  apiPatchChatMessage,
  apiPostChatMessage,
} from '../services/chatService';
import {
  apiMitupGenerate,
  apiMitupStatus,
  MitupStreamError,
  streamMitupResult,
} from '../services/mitupService';
import { getChatMessageId } from './useChatMessages';
import {
  buildLogCompletePayload,
  buildLogErrorCompletePayload,
  buildTextLogStartPayload,
} from '../utils/mitupLogPayload';
import {
  getMitupErrorLifecycleStatus,
  getMitupUserMessage,
  normalizeMitupError,
} from '../utils/mitupErrors';

const PROMPT_MAX_LENGTH = 2000;

function buildMitupAiPayload(aiSettings) {
  const ai = {
    model: aiSettings.model,
    temperature: aiSettings.temperature ?? 0.9,
    top_p: aiSettings.topP ?? 1,
  };

  if (aiSettings.thinking !== undefined) {
    ai.thinking = aiSettings.thinking;
  }
  if (aiSettings.webSearch !== undefined) {
    ai.web_search = aiSettings.webSearch;
  }

  return ai;
}

function buildGenerationMeta(aiSettings) {
  return {
    type: 'out_text',
    model: aiSettings.model,
    temperature: aiSettings.temperature ?? 0.9,
    topP: aiSettings.topP ?? 1,
    thinking: Boolean(aiSettings.thinking),
    webSearch: Boolean(aiSettings.webSearch),
  };
}

function buildGenerateContent(prompt, attachments = []) {
  const content = [{ type: 'input_text', text: prompt.trim() }];

  attachments.forEach((attachment) => {
    if (attachment?.fileId) {
      content.push({ type: 'input_file', fileId: attachment.fileId });
    }
  });

  return content;
}

async function resolveMitupGenerateResult(taskId, companyId, signal) {
  try {
    return await streamMitupResult(taskId, companyId, signal);
  } catch (error) {
    if (error instanceof MitupStreamError) {
      throw error;
    }

    try {
      const status = await apiMitupStatus(taskId, companyId);

      if (status?.done && status.result) {
        return status.result;
      }

      if (status?.done && status.error) {
        throw new MitupStreamError(status.error);
      }
    } catch (statusError) {
      if (statusError instanceof MitupStreamError) {
        throw statusError;
      }
    }

    throw error;
  }
}

async function completeEditorLogSafe(logId, payload) {
  if (!logId) return;

  try {
    await apiCompleteEditorAiLog(logId, payload);
  } catch (error) {
    console.warn('[AiChat] complete log failed:', error);
  }
}

/**
 * @param {object} params
 * @param {string|null|undefined} params.companyId
 * @param {string|null|undefined} params.activeSessionId
 * @param {object} params.aiSettings
 * @param {Function} params.appendMessage
 * @param {Function} params.updateMessage
 * @param {import('react').MutableRefObject<boolean>} [params.skipInitialLoadRef]
 * @param {Function} [params.onSessionCreated]
 * @param {Function} [params.onFinished]
 */
export function useSendChatMessage({
  companyId,
  activeSessionId,
  aiSettings,
  appendMessage,
  updateMessage,
  skipInitialLoadRef,
  onSessionCreated,
  onFinished,
}) {
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const abortRef = useRef(null);

  const sendMessage = useCallback(
    async ({ prompt, attachments = [] } = {}) => {
      const trimmedPrompt = prompt?.trim();

      if (!companyId) {
        setSendError('Не удалось определить ID компании');
        return null;
      }

      if (!trimmedPrompt) {
        setSendError('Введите сообщение');
        return null;
      }

      if (trimmedPrompt.length > PROMPT_MAX_LENGTH) {
        setSendError(`Сообщение не должно превышать ${PROMPT_MAX_LENGTH} символов`);
        return null;
      }

      if (!aiSettings?.model) {
        setSendError('Выберите модель');
        return null;
      }

      if (isSending) {
        return null;
      }

      setIsSending(true);
      setSendError(null);

      const controller = new AbortController();
      abortRef.current = controller;

      const startedAt = new Date().toISOString();
      let sessionId = activeSessionId;
      let logId = null;
      let assistantMessageId = null;

      try {
        if (!sessionId) {
          const session = await apiCreateChatSession({
            companyId,
            title: trimmedPrompt.slice(0, 50) || 'Новый чат',
            defaultModel: aiSettings.model,
            defaultTemperature: aiSettings.temperature ?? 0.9,
            defaultTopP: aiSettings.topP ?? 1,
          });

          sessionId = session?.id || session?._id;
          if (!sessionId) {
            throw new Error('Не удалось создать чат');
          }

          if (skipInitialLoadRef) {
            skipInitialLoadRef.current = true;
          }

          onSessionCreated?.(session);
        }

        const userMessage = await apiPostChatMessage(
          sessionId,
          {
            role: 'user',
            content: {
              text: trimmedPrompt,
              attachments: attachments.length > 0 ? attachments : undefined,
            },
          },
          companyId
        );
        appendMessage(userMessage);

        const assistantMessage = await apiPostChatMessage(
          sessionId,
          {
            role: 'assistant',
            status: 'pending',
            generation: buildGenerationMeta(aiSettings),
          },
          companyId
        );
        assistantMessageId = getChatMessageId(assistantMessage);
        appendMessage(assistantMessage);

        const logStartPayload = buildTextLogStartPayload({
          companyId,
          sessionId,
          prompt: trimmedPrompt,
          attachments,
          aiSettings,
          startedAt,
        });

        const logStartResponse = await apiStartEditorAiLog(logStartPayload);
        logId = extractEditorAiLogId(logStartResponse);

        const generateResponse = await apiMitupGenerate({
          companyId,
          type: 'out_text',
          content: buildGenerateContent(trimmedPrompt, attachments),
          ai: buildMitupAiPayload(aiSettings),
        });

        const taskId = generateResponse?.taskId;
        if (!taskId) {
          throw new Error('Mitup не вернул taskId');
        }

        if (logId) {
          await apiProcessingEditorAiLog(logId, { providerTaskId: taskId });
        }

        updateMessage(assistantMessageId, {
          status: 'processing',
          providerTaskId: taskId,
          editorAiLogId: logId || undefined,
        });

        await apiPatchChatMessage(
          sessionId,
          assistantMessageId,
          {
            status: 'processing',
            providerTaskId: taskId,
            editorAiLogId: logId || undefined,
          },
          companyId
        );

        const result = await resolveMitupGenerateResult(taskId, companyId, controller.signal);

        updateMessage(assistantMessageId, {
          status: 'completed',
          providerTaskId: taskId,
          editorAiLogId: logId || undefined,
          result,
        });

        await apiPatchChatMessage(
          sessionId,
          assistantMessageId,
          {
            status: 'completed',
            providerTaskId: taskId,
            editorAiLogId: logId || undefined,
            result,
          },
          companyId
        );

        await completeEditorLogSafe(
          logId,
          buildLogCompletePayload(result, startedAt, 'out_text')
        );

        onFinished?.({ result, sessionId, balance: result?.balance });

        return {
          sessionId,
          assistantMessageId,
          result,
        };
      } catch (error) {
        console.error('useSendChatMessage error:', error);

        const normalized = normalizeMitupError(error);
        const userMessage = getMitupUserMessage(error);
        setSendError(userMessage);

        if (assistantMessageId) {
          updateMessage(assistantMessageId, {
            status: 'failed',
            error: {
              code: normalized.code,
              message: userMessage,
            },
          });

          if (sessionId) {
            try {
              await apiPatchChatMessage(
                sessionId,
                assistantMessageId,
                {
                  status: 'failed',
                  error: {
                    code: normalized.code,
                    message: userMessage,
                  },
                },
                companyId
              );
            } catch (patchError) {
              console.warn('[AiChat] failed assistant patch:', patchError);
            }
          }
        }

        await completeEditorLogSafe(
          logId,
          buildLogErrorCompletePayload({
            startedAt,
            code: normalized.code,
            message: userMessage,
            lifecycleStatus: getMitupErrorLifecycleStatus(error),
            httpStatus: normalized.httpStatus,
          })
        );

        onFinished?.({ error: normalized, sessionId });

        return null;
      } finally {
        abortRef.current = null;
        setIsSending(false);
      }
    },
    [
      companyId,
      activeSessionId,
      aiSettings,
      appendMessage,
      updateMessage,
      skipInitialLoadRef,
      onSessionCreated,
      onFinished,
      isSending,
    ]
  );

  return {
    sendMessage,
    isSending,
    sendError,
    clearSendError: () => setSendError(null),
  };
}
