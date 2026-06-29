import { resolveAttachmentPreviewUrl } from './chatAttachment';

/**
 * @param {unknown} file
 * @returns {{ url: string, fileName: string, mimeType?: string }|null}
 */
export function normalizeAssistantImageFile(file) {
  if (!file || typeof file !== 'object') {
    return null;
  }

  const url = resolveAttachmentPreviewUrl(file.url);
  if (!url) {
    return null;
  }

  const normalized = {
    url,
    fileName: String(file.fileName || file.name || 'image').slice(0, 500),
  };

  const mimeType = file.mimeType || file.mime_type;
  if (mimeType) {
    normalized.mimeType = String(mimeType).slice(0, 100);
  }

  return normalized;
}

/**
 * @param {object|null|undefined} message
 * @returns {Array<{ url: string, fileName: string, mimeType?: string }>}
 */
export function getAssistantImageFiles(message) {
  const files = message?.result?.files;
  if (!Array.isArray(files)) {
    return [];
  }

  return files.map(normalizeAssistantImageFile).filter(Boolean);
}

/**
 * @param {object|null|undefined} message
 * @returns {boolean}
 */
export function isAssistantImageGeneration(message) {
  return message?.generation?.type === 'out_image';
}
