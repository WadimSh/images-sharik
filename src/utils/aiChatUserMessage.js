import { apiGetStudioFileUrl } from '../services/chatService';
import {
  getMessageAttachments,
  normalizeMongoFileId,
  resolveAttachmentPreviewUrl,
} from './chatAttachment';
import { sanitizeChatText } from './sanitizeChatText';

/**
 * @param {object|null|undefined} message
 * @returns {string}
 */
export function getUserMessagePromptText(message) {
  if (message?.role !== 'user') {
    return '';
  }

  return sanitizeChatText(message?.content?.text).trim();
}

/**
 * @param {string} text
 * @param {Array<{ url?: string }>} attachments
 * @returns {string}
 */
export function buildUserMessageCopyText(text, attachments = []) {
  const lines = [];

  if (text) {
    lines.push(text);
  }

  attachments.forEach((attachment) => {
    const url = resolveAttachmentPreviewUrl(attachment?.url);
    if (url) {
      lines.push(url);
    }
  });

  return lines.join('\n');
}

/**
 * @param {object|null|undefined} message
 * @param {string|null|undefined} companyId
 * @returns {Promise<string>}
 */
export async function resolveUserMessageCopyText(message, companyId) {
  const text = getUserMessagePromptText(message);
  const attachments = getMessageAttachments(message);
  const resolvedAttachments = [];

  for (const attachment of attachments) {
    let url = resolveAttachmentPreviewUrl(attachment.url);

    if (!url) {
      const fileId = normalizeMongoFileId(attachment.fileId);
      if (fileId && companyId) {
        try {
          const studioFile = await apiGetStudioFileUrl(fileId, companyId);
          url = resolveAttachmentPreviewUrl(studioFile?.url);
        } catch (error) {
          console.warn('[AiChat] failed to resolve attachment url for copy:', error);
        }
      }
    }

    resolvedAttachments.push({ url });
  }

  return buildUserMessageCopyText(text, resolvedAttachments);
}

/**
 * @param {object|null|undefined} message
 * @returns {{ prompt: string, attachments: ReturnType<typeof getMessageAttachments> }|null}
 */
export function getUserMessageResendPayload(message) {
  if (message?.role !== 'user') {
    return null;
  }

  const prompt = getUserMessagePromptText(message);
  const attachments = getMessageAttachments(message);

  if (!prompt && attachments.length === 0) {
    return null;
  }

  return { prompt, attachments };
}

/**
 * @param {object|null|undefined} message
 * @returns {boolean}
 */
export function canShowUserMessageActions(message) {
  return getUserMessageResendPayload(message) != null;
}
