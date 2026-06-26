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
import { pickRandomThinkingPhrase } from '../utils/aiChatThinkingPhrases';
import { getChatMessageId } from './useChatMessages';
import { buildChatSessionTitleFromPrompt } from '../utils/chatSession';
import {
  buildImageLogStartPayload,
  buildLogCompletePayload,
  buildLogErrorCompletePayload,
  buildTextLogStartPayload,
} from '../utils/mitupLogPayload';
import {
  sanitizeChatAttachments,
  serializeChatAttachmentsForApi,
  validateChatAttachments,
} from '../utils/chatAttachment';
import {
  getMitupErrorLifecycleStatus,
  getMitupUserMessage,
  normalizeMitupError,
} from '../utils/mitupErrors';

const PROMPT_MAX_LENGTH = 2000;
const TYPEWRITER_CHARS_PER_TICK = 3;
const TYPEWRITER_TICK_MS = 20;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * @param {string} event
 * @param {object} data
 * @returns {{ mode: 'append'|'replace', text: string }|null}
 */
function getStreamTextFromEvent(event, data) {
  if (!data || typeof data !== 'object') {
    return null;
  }

  if (event !== 'processing' && event !== 'submitted') {
    return null;
  }

  if (typeof data.delta === 'string' && data.delta) {
    return { mode: 'append', text: data.delta };
  }

  if (typeof data.text === 'string' && data.text) {
    return { mode: 'replace', text: data.text };
  }

  if (typeof data.partialText === 'string' && data.partialText) {
    return { mode: 'replace', text: data.partialText };
  }

  return null;
}

async function revealAssistantTextGradually(fullText, assistantMessageId, updateMessage, scrollToBottom) {
  if (!fullText || !assistantMessageId || !updateMessage) {
    return;
  }

  updateMessage(assistantMessageId, {
    status: 'processing',
    result: { text: '' },
  });
  scrollToBottom?.('auto');

  let index = 0;

  while (index < fullText.length) {
    index = Math.min(fullText.length, index + TYPEWRITER_CHARS_PER_TICK);
    updateMessage(assistantMessageId, {
      status: 'processing',
      result: { text: fullText.slice(0, index) },
    });
    scrollToBottom?.('auto');
    await wait(TYPEWRITER_TICK_MS);
  }
}

function buildMitupAiPayload(aiSettings, hasAttachments = false) {
  const outputType = aiSettings.outputType || 'out_text';
  const ai = {
    model: aiSettings.model,
    temperature: aiSettings.temperature ?? 0.9,
    top_p: aiSettings.topP ?? 1,
  };

  if (outputType === 'out_text' && !hasAttachments) {
    if (aiSettings.thinking !== undefined) {
      ai.thinking = aiSettings.thinking;
    }
    if (aiSettings.webSearch !== undefined) {
      ai.web_search = aiSettings.webSearch;
    }
  }

  if (outputType === 'out_image') {
    if (aiSettings.imageSize) {
      ai.image_size = aiSettings.imageSize;
    }
    if (aiSettings.imageQuality) {
      ai.image_quality = aiSettings.imageQuality;
    }
    if (aiSettings.responseFormat) {
      ai.response_format = aiSettings.responseFormat;
    }
  }

  return ai;
}

function buildGenerationMeta(aiSettings) {
  const outputType = aiSettings.outputType || 'out_text';
  const meta = {
    type: outputType,
    model: aiSettings.model,
    temperature: aiSettings.temperature ?? 0.9,
    topP: aiSettings.topP ?? 1,
  };

  if (outputType === 'out_text') {
    meta.thinking = Boolean(aiSettings.thinking);
    meta.webSearch = Boolean(aiSettings.webSearch);
  } else {
    meta.imageSize = aiSettings.imageSize;
    meta.imageQuality = aiSettings.imageQuality;
    meta.responseFormat = aiSettings.responseFormat;
  }

  return meta;
}

function buildLogStartPayload({ companyId, sessionId, prompt, attachments, aiSettings, startedAt }) {
  const outputType = aiSettings.outputType || 'out_text';

  if (outputType === 'out_image') {
    return buildImageLogStartPayload({
      companyId,
      sessionId,
      prompt,
      attachments,
      aiSettings,
      startedAt,
    });
  }

  return buildTextLogStartPayload({
    companyId,
    sessionId,
    prompt,
    attachments,
    aiSettings,
    startedAt,
  });
}

function buildGenerateContent(prompt, attachments = []) {
  const content = [{ type: 'input_text', text: prompt.trim() }];

  sanitizeChatAttachments(attachments).forEach((attachment) => {
    content.push({ type: 'input_file', fileId: attachment.fileId });
  });

  return content;
}

async function resolveMitupGenerateResult(
  taskId,
  companyId,
  signal,
  { assistantMessageId, updateMessage, scrollToBottom } = {}
) {
  let streamedText = '';
  let receivedStreamChunks = false;

  const handleStreamEvent = ({ event, data }) => {
    const part = getStreamTextFromEvent(event, data);
    if (!part || !assistantMessageId || !updateMessage) {
      return;
    }

    receivedStreamChunks = true;
    streamedText = part.mode === 'append' ? streamedText + part.text : part.text;

    updateMessage(assistantMessageId, {
      status: 'processing',
      result: { text: streamedText },
    });
    scrollToBottom?.('auto');
  };

  try {
    const result = await streamMitupResult(taskId, companyId, signal, handleStreamEvent);
    return { result, receivedStreamChunks, streamedText };
  } catch (error) {
    if (error instanceof MitupStreamError) {
      throw error;
    }

    try {
      const status = await apiMitupStatus(taskId, companyId);

      if (status?.done && status.result) {
        return { result: status.result, receivedStreamChunks: false, streamedText: '' };
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
 * @param {Function} [params.scrollToBottom]
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
  scrollToBottom,
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

      const sanitizedAttachments = sanitizeChatAttachments(attachments);
      const attachmentError = validateChatAttachments(attachments);
      if (attachmentError) {
        setSendError(attachmentError);
        return null;
      }

      const outputType = aiSettings.outputType || 'out_text';

      if (outputType !== 'out_text') {
        setSendError('Генерация изображений пока недоступна');
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
            title: buildChatSessionTitleFromPrompt(trimmedPrompt),
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
              attachments:
                sanitizedAttachments.length > 0
                  ? serializeChatAttachmentsForApi(sanitizedAttachments)
                  : undefined,
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
        appendMessage({
          ...assistantMessage,
          thinkingPhrase: pickRandomThinkingPhrase(),
        });
        scrollToBottom?.('smooth');

        const logStartPayload = buildLogStartPayload({
          companyId,
          sessionId,
          prompt: trimmedPrompt,
          attachments: sanitizedAttachments,
          aiSettings,
          startedAt,
        });

        const logStartResponse = await apiStartEditorAiLog(logStartPayload);
        logId = extractEditorAiLogId(logStartResponse);

        const generateResponse = await apiMitupGenerate({
          companyId,
          type: outputType,
          content: buildGenerateContent(trimmedPrompt, sanitizedAttachments),
          ai: buildMitupAiPayload(aiSettings, sanitizedAttachments.length > 0),
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

        const { result, receivedStreamChunks } = await resolveMitupGenerateResult(
          taskId,
          companyId,
          controller.signal,
          { assistantMessageId, updateMessage, scrollToBottom }
        );

        const finalText = result?.text || '';
        if (!receivedStreamChunks && finalText) {
          await revealAssistantTextGradually(
            finalText,
            assistantMessageId,
            updateMessage,
            scrollToBottom
          );
        }

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
          buildLogCompletePayload(result, startedAt, outputType)
        );

        onFinished?.({ result, sessionId, balance: result?.balance });
        scrollToBottom?.('auto');

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
      scrollToBottom,
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
