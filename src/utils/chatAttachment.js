import { getApiBaseUrl } from '../services/fetch/fetchBase';

const MONGO_OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

/** Mitup input_file limit (matches ai-api). */
export const MITUP_MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

/**
 * @param {unknown} value
 * @returns {string|null}
 */
export function normalizeMongoFileId(value) {
  if (value == null) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return MONGO_OBJECT_ID_PATTERN.test(trimmed) ? trimmed : null;
  }

  if (typeof value === 'object') {
    return (
      normalizeMongoFileId(value._id)
      || normalizeMongoFileId(value.id)
      || null
    );
  }

  return normalizeMongoFileId(String(value));
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidMongoFileId(value) {
  return normalizeMongoFileId(value) != null;
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseAttachmentSizeBytes(value) {
  if (value == null || value === '') return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;

  return Math.floor(parsed);
}

/**
 * @param {number} bytes
 * @returns {string}
 */
export function formatAttachmentBytesRu(bytes) {
  const value = parseAttachmentSizeBytes(bytes);
  if (value == null) return '';

  if (value >= 1024 * 1024) {
    const mb = value / (1024 * 1024);
    const formatted = mb >= 10 ? String(Math.round(mb)) : mb.toFixed(1).replace(/\.0$/, '');
    return `${formatted} МБ`;
  }

  if (value >= 1024) {
    const kb = value / 1024;
    const formatted = kb >= 10 ? String(Math.round(kb)) : kb.toFixed(1).replace(/\.0$/, '');
    return `${formatted} КБ`;
  }

  return `${value} Б`;
}

/**
 * @param {number} actualBytes
 * @param {number} [maxBytes]
 * @returns {string}
 */
export function formatOversizedAttachmentMessage(
  actualBytes,
  maxBytes = MITUP_MAX_ATTACHMENT_BYTES
) {
  const actualLabel = formatAttachmentBytesRu(actualBytes) || 'неизвестный размер';
  const maxLabel = formatAttachmentBytesRu(maxBytes) || '5 МБ';

  return `Файл слишком большой (${actualLabel}). Максимальный размер для вложения в чат — ${maxLabel}.`;
}

/**
 * @param {unknown} sizeBytes
 * @param {number} [maxBytes]
 * @returns {boolean}
 */
export function isAttachmentWithinSizeLimit(
  sizeBytes,
  maxBytes = MITUP_MAX_ATTACHMENT_BYTES
) {
  const parsed = parseAttachmentSizeBytes(sizeBytes);
  if (parsed == null) return true;

  return parsed <= maxBytes;
}

/**
 * @param {unknown} sizeBytes
 * @param {number} [maxBytes]
 * @returns {string|null}
 */
export function validateAttachmentSize(
  sizeBytes,
  maxBytes = MITUP_MAX_ATTACHMENT_BYTES
) {
  const parsed = parseAttachmentSizeBytes(sizeBytes);
  if (parsed == null) return null;

  if (parsed <= maxBytes) return null;

  return formatOversizedAttachmentMessage(parsed, maxBytes);
}

/**
 * @param {unknown} attachment
 * @returns {{ fileId: string, fileName?: string, url?: string, mimeType?: string }|null}
 */
export function sanitizeChatAttachment(attachment) {
  if (!attachment || typeof attachment !== 'object') return null;

  const fileId = normalizeMongoFileId(
    attachment.fileId ?? attachment.id ?? attachment._id
  );
  if (!fileId) return null;

  const sanitized = { fileId };

  if (attachment.fileName) {
    sanitized.fileName = String(attachment.fileName).slice(0, 500);
  }
  if (attachment.url) {
    sanitized.url = String(attachment.url).slice(0, 2000);
  }
  if (attachment.mimeType) {
    sanitized.mimeType = String(attachment.mimeType).slice(0, 100);
  }

  const sizeBytes = parseAttachmentSizeBytes(
    attachment.sizeBytes ?? attachment.size
  );
  if (sizeBytes != null) {
    sanitized.sizeBytes = sizeBytes;
  }

  return sanitized;
}

/**
 * @param {unknown[]} attachments
 * @returns {Array<{ fileId: string, fileName?: string, url?: string, mimeType?: string }>}
 */
export function sanitizeChatAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return [];
  return attachments.map(sanitizeChatAttachment).filter(Boolean);
}

/**
 * Studio chat API accepts only fileId/fileName/url/mimeType on attachments.
 * @param {unknown[]} attachments
 * @returns {Array<{ fileId: string, fileName?: string, url?: string, mimeType?: string }>}
 */
export function serializeChatAttachmentsForApi(attachments = []) {
  return sanitizeChatAttachments(attachments).map(
    ({ fileId, fileName, url, mimeType }) => {
      const payload = { fileId };

      if (fileName) {
        payload.fileName = fileName;
      }
      if (url) {
        payload.url = url;
      }
      if (mimeType) {
        payload.mimeType = mimeType;
      }

      return payload;
    }
  );
}

/**
 * @param {unknown[]} attachments — raw attachments from UI
 * @returns {string|null} user-facing error or null
 */
export function validateChatAttachments(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  const sanitized = sanitizeChatAttachments(attachments);
  if (sanitized.length !== attachments.length) {
    return 'Некорректный файл вложения. Выберите изображение из библиотеки заново.';
  }

  for (const attachment of sanitized) {
    const sizeError = validateAttachmentSize(attachment.sizeBytes);
    if (sizeError) return sizeError;
  }

  return null;
}

/**
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export function resolveAttachmentPreviewUrl(url) {
  if (!url) return null;

  const trimmed = String(url).trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const base = getApiBaseUrl();
  return `${base}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`;
}

/**
 * @param {object|null|undefined} message
 * @returns {Array<{ fileId: string, fileName?: string, url?: string, mimeType?: string }>}
 */
export function getMessageAttachments(message) {
  return sanitizeChatAttachments(message?.content?.attachments || []);
}
