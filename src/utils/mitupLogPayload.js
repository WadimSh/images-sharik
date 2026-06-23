const PROMPT_MAX_LENGTH = 2000;

/**
 * @typedef {Object} MitupAiSettings
 * @property {string} model
 * @property {number} [temperature]
 * @property {number} [topP]
 * @property {boolean} [thinking]
 * @property {boolean} [webSearch]
 * @property {string} [imageSize]
 * @property {string} [imageQuality]
 * @property {'url'|'b64_json'} [responseFormat]
 */

/**
 * @typedef {Object} MitupAttachment
 * @property {string} [fileId]
 * @property {string} [fileName]
 * @property {string} [mimeType]
 * @property {number} [sizeBytes]
 */

function trimPrompt(text = '') {
  const trimmed = text.trim();
  return {
    text: trimmed.slice(0, PROMPT_MAX_LENGTH),
    length: Math.min(trimmed.length, PROMPT_MAX_LENGTH),
  };
}

function buildRequestData(prompt, attachments = []) {
  const requestData = {
    prompt: trimPrompt(prompt),
  };

  const items = attachments
    .filter((item) => item?.fileName || item?.fileId)
    .map((item) => ({
      fileName: item.fileName || 'attachment',
      sizeBytes: item.sizeBytes || 0,
      mimeType: item.mimeType || 'application/octet-stream',
      source: item.fileId ? 'url' : 'url',
    }));

  if (items.length > 0) {
    requestData.attachedFiles = {
      items,
      count: items.length,
      totalSizeBytes: items.reduce((sum, item) => sum + (item.sizeBytes || 0), 0),
    };
  }

  return requestData;
}

function buildModelConfig(aiSettings = {}) {
  const modelConfig = {
    model: aiSettings.model,
  };

  if (aiSettings.temperature !== undefined) {
    modelConfig.temperature = aiSettings.temperature;
  }
  if (aiSettings.topP !== undefined) {
    modelConfig.topP = aiSettings.topP;
  }
  if (aiSettings.responseFormat) {
    modelConfig.responseFormat = aiSettings.responseFormat;
  }

  return modelConfig;
}

function buildStartPayloadBase({
  companyId,
  sessionId,
  prompt,
  attachments,
  aiSettings,
  startedAt,
  operationId,
  operationLabel,
  section,
  outputType,
  generationType,
}) {
  return {
    companyId,
    operationId,
    operationLabel,
    section,
    provider: 'mitup',
    apiEndpoint: 'generation',
    startedAt,
    requestData: buildRequestData(prompt, attachments),
    requestConfig: {
      model: buildModelConfig(aiSettings),
      mitup: {
        outputType,
        generationType,
      },
    },
    meta: {
      source: 'page_chat',
      sessionId,
    },
  };
}

/**
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.sessionId
 * @param {string} params.prompt
 * @param {MitupAttachment[]} [params.attachments]
 * @param {MitupAiSettings} params.aiSettings
 * @param {string} params.startedAt — ISO
 */
export function buildTextLogStartPayload({
  companyId,
  sessionId,
  prompt,
  attachments = [],
  aiSettings,
  startedAt,
}) {
  return buildStartPayloadBase({
    companyId,
    sessionId,
    prompt,
    attachments,
    aiSettings,
    startedAt,
    operationId: 'generateText',
    operationLabel: 'Генерация текста',
    section: 'ai_text_generation',
    outputType: 'out_text',
    generationType: 'text',
  });
}

/**
 * @param {object} params
 * @param {string} params.companyId
 * @param {string} params.sessionId
 * @param {string} params.prompt
 * @param {MitupAttachment[]} [params.attachments]
 * @param {MitupAiSettings} params.aiSettings
 * @param {string} params.startedAt — ISO
 */
export function buildImageLogStartPayload({
  companyId,
  sessionId,
  prompt,
  attachments = [],
  aiSettings,
  startedAt,
}) {
  return buildStartPayloadBase({
    companyId,
    sessionId,
    prompt,
    attachments,
    aiSettings,
    startedAt,
    operationId: 'generateImage',
    operationLabel: 'Генерация изображения',
    section: 'ai_image_generation',
    outputType: 'out_image',
    generationType: 'image',
  });
}

function normalizeBalance(balance) {
  if (!balance || typeof balance !== 'object') return undefined;

  return {
    balance: balance.balance ?? null,
    balanceBonus: balance.balanceBonus ?? balance.balance_bonus ?? 0,
    balanceReferral: balance.balanceReferral ?? balance.balance_referral ?? 0,
  };
}

function normalizeCost(cost) {
  if (!cost || typeof cost !== 'object') return undefined;

  return {
    amount: cost.amount,
    inputTokens: cost.inputTokens ?? cost.input,
    outputTokens: cost.outputTokens ?? cost.output,
  };
}

function mapFilesToImagesResult(files = []) {
  if (!Array.isArray(files) || files.length === 0) return undefined;

  const items = files.map((file) => ({
    fileName: file.fileName || file.name || 'image',
    url: file.url,
    mimeType: file.mime_type || file.mimeType,
    sizeBytes: file.size,
  }));

  return {
    count: items.length,
    urls: items.map((item) => item.url).filter(Boolean),
    items,
  };
}

/**
 * @param {object} result — SSE completed или GET /status result
 * @param {string|Date} startedAt
 * @param {'out_text'|'out_image'} [outputType='out_text']
 * @returns {{ finishedAt: string, durationMs: number, responseData: object }}
 */
export function buildLogCompletePayload(result, startedAt, outputType = 'out_text') {
  const started = new Date(startedAt);
  const finishedAt = new Date();
  const durationMs = Math.max(0, finishedAt.getTime() - started.getTime());

  const text = result?.text || '';
  const responseData = {
    status: 'success',
    httpStatus: 200,
    providerStatus: result?.providerStatus ?? 2,
    cost: normalizeCost(result?.cost),
    balanceAfter: normalizeBalance(result?.balance),
    limitsAfter: result?.limits
      ? {
          minute: result.limits.minute,
          day: result.limits.day,
        }
      : undefined,
  };

  if (outputType === 'out_text' && text) {
    responseData.textResult = {
      text: text.slice(0, PROMPT_MAX_LENGTH),
      length: Math.min(text.length, PROMPT_MAX_LENGTH),
    };
  }

  const imagesResult = mapFilesToImagesResult(result?.files);
  if (imagesResult) {
    responseData.imagesResult = imagesResult;
  }

  if (text && outputType === 'out_image') {
    responseData.textResult = {
      text: text.slice(0, PROMPT_MAX_LENGTH),
      length: Math.min(text.length, PROMPT_MAX_LENGTH),
    };
  }

  return {
    finishedAt: finishedAt.toISOString(),
    durationMs,
    responseData,
  };
}

/**
 * @param {object} params
 * @param {string|Date} params.startedAt
 * @param {string} params.code
 * @param {string} params.message
 * @param {'error'|'timeout'|'cancelled'} [params.lifecycleStatus='error']
 * @param {number} [params.httpStatus]
 */
export function buildLogErrorCompletePayload({
  startedAt,
  code,
  message,
  lifecycleStatus = 'error',
  httpStatus,
}) {
  const started = new Date(startedAt);
  const finishedAt = new Date();
  const durationMs = Math.max(0, finishedAt.getTime() - started.getTime());

  return {
    finishedAt: finishedAt.toISOString(),
    durationMs,
    lifecycleStatus,
    responseData: {
      status: 'error',
      httpStatus: httpStatus || (lifecycleStatus === 'timeout' ? 408 : 500),
      error: {
        code: code || 'MITUP_UNKNOWN_ERROR',
        message: (message || 'Ошибка генерации Mitup').slice(0, 2000),
      },
    },
  };
}
