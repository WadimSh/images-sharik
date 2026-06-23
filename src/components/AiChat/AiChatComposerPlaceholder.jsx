/**
 * Placeholder composer до TASK-3.x (AiChatComposer).
 */
export function AiChatComposerPlaceholder({
  prompt,
  onPromptChange,
  onSubmit,
  aiSettings,
  onModelChange,
  textModels,
  getModelLabel,
  composerDisabled,
  canSend,
  isSending,
  sendError,
}) {
  return (
    <form className="ai-chat-composer" onSubmit={onSubmit} data-testid="ai-chat-composer">
      <div className="ai-chat-composer-controls">
        <label className="ai-chat-composer-label" htmlFor="ai-chat-model">
          Модель
        </label>
        <select
          id="ai-chat-model"
          className="ai-chat-composer-select"
          value={aiSettings.model}
          onChange={(event) => onModelChange(event.target.value)}
          disabled={composerDisabled}
        >
          {textModels.length === 0 ? (
            <option value="">Нет моделей</option>
          ) : (
            <>
              <option value="" disabled hidden>
                Выберите модель
              </option>
              {textModels.map((model) => {
                const { label, value } = getModelLabel(model);
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </>
          )}
        </select>
      </div>

      <textarea
        className="ai-chat-composer-input"
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Сообщение…"
        rows={3}
        disabled={composerDisabled}
        data-testid="ai-chat-composer-input"
      />

      {sendError && (
        <div className="ai-chat-banner ai-chat-banner-error ai-chat-composer-error">
          {sendError}
        </div>
      )}

      <div className="ai-chat-composer-actions">
        <button
          type="submit"
          className="ai-chat-composer-send"
          disabled={!canSend}
          data-testid="ai-chat-composer-send"
        >
          {isSending ? 'Отправка…' : 'Отправить'}
        </button>
      </div>
    </form>
  );
}
