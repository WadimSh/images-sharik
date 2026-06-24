import { HiOutlineChatBubbleLeftRight, HiOutlinePhoto } from 'react-icons/hi2';

import './AiChatModeSwitch.css';

const MODES = [
  {
    value: 'out_text',
    label: 'Текст',
    icon: HiOutlineChatBubbleLeftRight,
  },
  {
    value: 'out_image',
    label: 'Картинка',
    icon: HiOutlinePhoto,
  },
];

/**
 * @param {object} props
 * @param {'out_text'|'out_image'} props.value
 * @param {Function} props.onChange
 * @param {boolean} [props.disabled]
 */
export function AiChatModeSwitch({ value, onChange, disabled = false }) {
  return (
    <div
      className={`ai-chat-mode-switch${disabled ? ' ai-chat-mode-switch--disabled' : ''}`}
      role="tablist"
      aria-label="Режим генерации"
      data-testid="ai-chat-mode-switch"
    >
      <div
        className="ai-chat-mode-switch-indicator"
        data-active={value}
        aria-hidden="true"
      />

      {MODES.map((mode) => {
        const isActive = value === mode.value;
        const Icon = mode.icon;

        return (
          <button
            key={mode.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`ai-chat-mode-switch-option${
              isActive ? ' ai-chat-mode-switch-option--active' : ''
            }`}
            disabled={disabled}
            onClick={() => {
              if (!disabled && mode.value !== value) {
                onChange(mode.value);
              }
            }}
            data-testid={`ai-chat-mode-switch-${mode.value}`}
          >
            <Icon className="ai-chat-mode-switch-option-icon" aria-hidden="true" />
            <span>{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
}
