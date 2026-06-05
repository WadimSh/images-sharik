import { IMPROVEMENTS, PRODUCT_SHOWCASE } from '../improvementsConfig';
import { EXPAND_SOURCE_DISABLED_REASON } from '../expandConfig';

const ALL = [...IMPROVEMENTS, ...PRODUCT_SHOWCASE];

const SECTION_MAP = {
  background: 'tools',
  createBackground: 'product_showcase',
  catalogStudio: 'product_showcase',
  lifestyleEnvironment: 'product_showcase',
  lifestyleInUse: 'product_showcase',
};

export function getOperationMeta(operationId) {
  const item = ALL.find((i) => i.id === operationId);
  return {
    operationLabel: item?.label || operationId,
    section: SECTION_MAP[operationId] || 'improvements',
    apiEndpoint: operationId === 'background' ? 'segment' : 'edit',
  };
}

export function extractEditorAiLogId(response) {
  if (!response) return null;
  return response.id
    || response._id
    || response.data?.id
    || response.data?._id
    || null;
}

export async function blobToDimensions(blob) {
  const bitmap = await createImageBitmap(blob);
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}

export async function blobToImageMeta(blob) {
  const base = {
    sizeBytes: blob.size,
    mimeType: blob.type,
  };

  try {
    const { width, height } = await blobToDimensions(blob);
    return { ...base, width, height };
  } catch (error) {
    console.warn('[EditorAiLog] blobToImageMeta dimensions failed:', error);
    return base;
  }
}

async function resolveSourceFileDimensions(inputBlob, logContext) {
  const exportDims = logContext?.getExportDimensions?.();
  if (exportDims?.width > 0 && exportDims?.height > 0) {
    return exportDims;
  }

  try {
    return await blobToDimensions(inputBlob);
  } catch (error) {
    console.warn('[EditorAiLog] source file dimensions failed:', error);
    return { width: null, height: null };
  }
}

export function extractHttpStatus(error) {
  const match = error?.message?.match(/API error: (\d+)/);
  if (match) return parseInt(match[1], 10);
  return error?.httpStatus;
}

function isValidMongoId(value) {
  return typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value);
}

export function mapErrorCode(operationId, error) {
  const httpStatus = extractHttpStatus(error);

  if (httpStatus === 429) return 'rate_limit';
  if (httpStatus === 413) return 'payload_too_large';
  if (httpStatus >= 500) return 'provider_server_error';
  if (httpStatus >= 400) return 'provider_client_error';
  if (error?.message?.toLowerCase().includes('timeout')) return 'timeout';
  if (operationId === 'expand' && error?.message?.includes(EXPAND_SOURCE_DISABLED_REASON)) {
    return 'source_too_large';
  }
  return 'unknown';
}

export async function buildStartPayload({
  logContext,
  operationId,
  meta,
  options,
  inputBlob,
  startedAt,
}) {
  const { companyId, source, getSessionId, sessionId, imageData } = logContext;
  const { width, height } = await resolveSourceFileDimensions(inputBlob, logContext);

  const sourceFile = {
    fileName: imageData?.fileName,
    mimeType: inputBlob.type,
    sizeBytes: inputBlob.size,
  };

  const sourceFileId = imageData?._id || imageData?.id;
  if (isValidMongoId(sourceFileId)) {
    sourceFile.fileId = sourceFileId;
  }

  if (width != null) sourceFile.width = width;
  if (height != null) sourceFile.height = height;

  const requestData = { sourceFile };

  const requestConfig = {};

  if (operationId === 'shadow' && options) {
    requestConfig.operation = {
      shadowMode: options.mode || 'auto',
      shadowOverrides: options.overrides,
    };
  }

  if (operationId === 'expand' && options) {
    requestConfig.operation = {
      outputWidth: Number(options.outputWidth),
      outputHeight: Number(options.outputHeight),
    };
  }

  if (operationId === 'createBackground' && options) {
    const trimmedPrompt = (options.prompt || '').trim();

    if (trimmedPrompt) {
      requestData.prompt = {
        text: trimmedPrompt.slice(0, 2000),
        length: trimmedPrompt.length,
      };
    }

    if (options.guidanceImage) {
      requestData.guidanceImage = {
        fileName: options.guidanceImage.name || 'guidance.jpg',
        sizeBytes: options.guidanceImage.size || 0,
        scale: Number(options.guidanceScale ?? 0.6),
      };
    }
  }

  const payload = {
    companyId,
    operationId,
    operationLabel: meta.operationLabel,
    section: meta.section,
    provider: 'photoroom',
    apiEndpoint: meta.apiEndpoint,
    startedAt,
    requestData,
    meta: {
      sessionId: getSessionId?.() ?? sessionId,
      source,
      clientRequestId: crypto.randomUUID(),
    },
  };

  if (Object.keys(requestConfig).length > 0) {
    payload.requestConfig = requestConfig;
  }

  return payload;
}
