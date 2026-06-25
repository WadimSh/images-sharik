import { useEffect, useState } from 'react';

import { apiGetStudioFileUrl } from '../../services/chatService';
import {
  normalizeMongoFileId,
  resolveAttachmentPreviewUrl,
} from '../../utils/chatAttachment';
import { AiChatAttachmentPreview } from './AiChatAttachmentPreview';

/**
 * @param {object} props
 * @param {{ fileId?: string, fileName?: string, url?: string, mimeType?: string }} props.attachment
 * @param {string|null|undefined} props.companyId
 */
function AiChatMessageAttachmentItem({ attachment, companyId }) {
  const [previewUrl, setPreviewUrl] = useState(() =>
    resolveAttachmentPreviewUrl(attachment?.url)
  );

  useEffect(() => {
    const resolved = resolveAttachmentPreviewUrl(attachment?.url);
    if (resolved) {
      setPreviewUrl(resolved);
      return undefined;
    }

    const fileId = normalizeMongoFileId(attachment?.fileId);
    if (!fileId || !companyId) {
      setPreviewUrl(null);
      return undefined;
    }

    let cancelled = false;

    apiGetStudioFileUrl(fileId, companyId)
      .then((result) => {
        if (!cancelled) {
          setPreviewUrl(resolveAttachmentPreviewUrl(result?.url));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPreviewUrl(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attachment?.fileId, attachment?.url, companyId]);

  return (
    <AiChatAttachmentPreview
      attachment={{
        fileName: attachment?.fileName,
        url: previewUrl,
      }}
      testId="ai-chat-message-attachment"
    />
  );
}

/**
 * @param {object} props
 * @param {Array<{ fileId?: string, fileName?: string, url?: string, mimeType?: string }>} props.attachments
 * @param {string|null|undefined} props.companyId
 */
export function AiChatMessageAttachments({ attachments = [], companyId }) {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="ai-chat-attachment ai-chat-message-attachments" data-testid="ai-chat-message-attachments">
      {attachments.map((attachment) => {
        const key = normalizeMongoFileId(attachment?.fileId) || attachment?.fileName || attachment?.url;

        return (
          <AiChatMessageAttachmentItem
            key={key}
            attachment={attachment}
            companyId={companyId}
          />
        );
      })}
    </div>
  );
}
