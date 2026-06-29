import './AiChatImageResult.css';

/**
 * @param {object} props
 * @param {Array<{ url: string, fileName: string, mimeType?: string }>} props.files
 */
export function AiChatImageResult({ files = [] }) {
  if (!Array.isArray(files) || files.length === 0) {
    return null;
  }

  const gridClass =
    files.length >= 3
      ? 'ai-chat-image-result--cols-3'
      : files.length === 2
        ? 'ai-chat-image-result--cols-2'
        : 'ai-chat-image-result--cols-1';

  return (
    <div
      className={`ai-chat-image-result ${gridClass}`}
      data-testid="ai-chat-image-result"
    >
      {files.map((file, index) => (
        <a
          key={`${file.url}-${index}`}
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ai-chat-image-result-item"
          data-testid={`ai-chat-image-result-item-${index}`}
        >
          <img
            src={file.url}
            alt={file.fileName}
            loading="lazy"
            className="ai-chat-image-result-image"
          />
          <span className="ai-chat-image-result-badge">AI</span>
        </a>
      ))}
    </div>
  );
}
