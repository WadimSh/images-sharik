import { useCallback, useLayoutEffect, useRef } from 'react';
import { HiArrowPath, HiArrowUp } from 'react-icons/hi2';

import { AiChatModelSelect } from './AiChatModelSelect';
import { AiChatSettingsPanel } from './AiChatSettingsPanel';
import './AiChatComposer.css';

const TEXTAREA_MAX_HEIGHT = 200;
const PROMPT_MAX_LENGTH = 2000;

/**
 * @param {object} props
 */
export function AiChatComposer({
  prompt,
  onPromptChange,
  onSubmit,
  aiSettings,
  onModelChange,
  onSettingsChange,
  models,
  outputType = 'out_text',
  composerDisabled,
  inputDisabled,
  canSend,
  isSending,
  sendError,
}) {
  const formRef = useRef(null);
  const textareaRef = useRef(null);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, []);

  useLayoutEffect(() => {
    resizeTextarea();
  }, [prompt, resizeTextarea]);

  const handlePromptChange = (event) => {
    onPromptChange(event.target.value.slice(0, PROMPT_MAX_LENGTH));
    requestAnimationFrame(resizeTextarea);
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' || event.shiftKey) {
      return;
    }

    event.preventDefault();

    if (canSend) {
      formRef.current?.requestSubmit();
    }
  };

  const promptLength = prompt.length;
  const isAtLimit = promptLength >= PROMPT_MAX_LENGTH;
  const isImageMode = outputType === 'out_image';
  const textareaPlaceholder = isImageMode
    ? 'Генерация изображений скоро будет доступна…'
    : 'Сообщение…';

  return (
    <form
      ref={formRef}
      className="ai-chat-composer"
      onSubmit={onSubmit}
      data-testid="ai-chat-composer"
    >
      <textarea
        ref={textareaRef}
        className="ai-chat-composer-input"
        value={prompt}
        onChange={handlePromptChange}
        onKeyDown={handleKeyDown}
        placeholder={textareaPlaceholder}
        rows={1}
        maxLength={PROMPT_MAX_LENGTH}
        disabled={inputDisabled}
        data-testid="ai-chat-composer-input"
      />

      {sendError && (
        <div className="ai-chat-banner ai-chat-banner-error ai-chat-composer-error">
          {sendError}
        </div>
      )}

      <div className="ai-chat-composer-meta">
        <span
          className={`ai-chat-composer-counter${isAtLimit ? ' ai-chat-composer-counter--limit' : ''}`}
          data-testid="ai-chat-composer-counter"
          aria-live="polite"
        >
          {promptLength}/{PROMPT_MAX_LENGTH}
        </span>
      </div>

      <div className="ai-chat-composer-footer">
        <div className="ai-chat-composer-footer-left">
          <AiChatModelSelect
            models={models}
            outputType={outputType}
            value={aiSettings.model}
            onChange={onModelChange}
            disabled={composerDisabled}
          />

          <AiChatSettingsPanel
            outputType={outputType}
            settings={aiSettings}
            onChange={onSettingsChange}
            disabled={composerDisabled}
          />
        </div>

        <button
          type="submit"
          className="ai-chat-composer-send"
          disabled={!canSend}
          aria-label={isSending ? 'Отправка…' : 'Отправить'}
          data-testid="ai-chat-composer-send"
        >
          {isSending ? (
            <HiArrowPath className="ai-chat-composer-send-icon ai-chat-composer-send-icon--spin" />
          ) : (
            <HiArrowUp className="ai-chat-composer-send-icon" />
          )}
        </button>
      </div>
    </form>
  );
}
