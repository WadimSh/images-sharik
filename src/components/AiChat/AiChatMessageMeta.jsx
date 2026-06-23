import { getAssistantMessageMeta } from '../../utils/aiChatMessage';

/**
 * @param {{ message: object }} props
 */
export function AiChatMessageMeta({ message }) {
  const meta = getAssistantMessageMeta(message);

  if (!meta?.model && !meta?.costLabel) {
    return null;
  }

  return (
    <div className="ai-chat-message-meta" data-testid="ai-chat-message-meta">
      {meta.model ? <span className="ai-chat-message-meta-model">{meta.model}</span> : null}
      {meta.model && meta.costLabel ? (
        <span className="ai-chat-message-meta-separator"> · </span>
      ) : null}
      {meta.costLabel ? (
        <span className="ai-chat-message-meta-cost">{meta.costLabel}</span>
      ) : null}
    </div>
  );
}
