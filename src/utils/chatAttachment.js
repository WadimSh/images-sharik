import { getApiBaseUrl } from '../services/fetch/fetchBase';

const MONGO_OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

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
 * @param {unknown[]} attachments — raw attachments from UI
 * @returns {string|null} user-facing error or null
 */
export function validateChatAttachments(attachments = []) {
  if (!Array.isArray(attachments) || attachments.length === 0) return null;

  const sanitized = sanitizeChatAttachments(attachments);
  if (sanitized.length !== attachments.length) {
    return 'Некорректный файл вложения. Выберите изображение из библиотеки заново.';
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
