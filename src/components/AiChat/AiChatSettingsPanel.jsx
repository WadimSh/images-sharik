import { useEffect, useId, useRef, useState } from 'react';
import { HiOutlineCog6Tooth } from 'react-icons/hi2';

import {
  clampSettingNumber,
  DEFAULT_TEMPERATURE,
  DEFAULT_TOP_P,
  IMAGE_QUALITY_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  RESPONSE_FORMAT_OPTIONS,
} from '../../utils/aiChatSettings';
import './AiChatSettingsPanel.css';

/**
 * @param {object} props
 * @param {string} props.id
 * @param {string} props.label
 * @param {number} props.value
 * @param {number} props.min
 * @param {number} props.max
 * @param {number} props.step
 * @param {Function} props.onChange
 * @param {string} props.testId
 */
function SettingSlider({ id, label, value, min, max, step, onChange, testId }) {
  const displayValue = Number(value).toFixed(1);
  const progress = `${((value - min) / (max - min)) * 100}%`;

  return (
    <div className="ai-chat-settings-panel-field">
      <div className="ai-chat-settings-panel-label-row">
        <label className="ai-chat-settings-panel-label" htmlFor={id}>
          {label}
        </label>
        <span className="ai-chat-settings-panel-value" aria-hidden="true">
          {displayValue}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="ai-chat-settings-panel-range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ '--range-progress': progress }}
        onChange={(event) => onChange(clampSettingNumber(event.target.value, min, max))}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayValue}
        data-testid={testId}
      />
    </div>
  );
}

/**
 * @param {object} props
 * @param {'out_text'|'out_image'} props.outputType
 * @param {object} props.settings
 * @param {Function} props.onChange
 * @param {boolean} [props.disabled]
 */
export function AiChatSettingsPanel({ outputType, settings, onChange, disabled = false }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const updateSetting = (patch) => {
    onChange(patch);
  };

  const temperature = settings.temperature ?? DEFAULT_TEMPERATURE;
  const topP = settings.topP ?? DEFAULT_TOP_P;

  return (
    <div
      ref={rootRef}
      className={`ai-chat-settings-panel${open ? ' ai-chat-settings-panel--open' : ''}${
        disabled ? ' ai-chat-settings-panel--disabled' : ''
      }`}
    >
      <button
        type="button"
        className="ai-chat-settings-panel-trigger"
        aria-label="Настройки"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
        data-testid="ai-chat-settings-trigger"
      >
        <HiOutlineCog6Tooth className="ai-chat-settings-panel-trigger-icon" aria-hidden="true" />
      </button>

      {open ? (
        <div
          id={panelId}
          className="ai-chat-settings-panel-popover"
          role="dialog"
          aria-label="Настройки модели"
          data-testid="ai-chat-settings-panel"
        >
          <SettingSlider
            id={`${panelId}-temperature`}
            label="Креативность ответа (temperature)"
            value={temperature}
            min={0}
            max={1}
            step={0.1}
            onChange={(nextValue) => updateSetting({ temperature: nextValue })}
            testId="ai-chat-settings-temperature"
          />

          <SettingSlider
            id={`${panelId}-top-p`}
            label="Разнообразие формулировок (top_p)"
            value={topP}
            min={0}
            max={1}
            step={0.1}
            onChange={(nextValue) => updateSetting({ topP: nextValue })}
            testId="ai-chat-settings-top-p"
          />

          {outputType === 'out_text' ? (
            <>
              <label className="ai-chat-settings-panel-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings.thinking)}
                  onChange={(event) => updateSetting({ thinking: event.target.checked })}
                  data-testid="ai-chat-settings-thinking"
                />
                <span>Долго думать перед ответом (thinking)</span>
              </label>

              <label className="ai-chat-settings-panel-toggle">
                <input
                  type="checkbox"
                  checked={Boolean(settings.webSearch)}
                  onChange={(event) => updateSetting({ webSearch: event.target.checked })}
                  data-testid="ai-chat-settings-web-search"
                />
                <span>Искать актуальную информацию в интернете (web_search)</span>
              </label>
            </>
          ) : (
            <>
              <div className="ai-chat-settings-panel-field">
                <label className="ai-chat-settings-panel-label" htmlFor={`${panelId}-image-size`}>
                  Размер картинки (image_size)
                </label>
                <select
                  id={`${panelId}-image-size`}
                  className="ai-chat-settings-panel-select"
                  value={settings.imageSize || IMAGE_SIZE_OPTIONS[0].value}
                  onChange={(event) => updateSetting({ imageSize: event.target.value })}
                  data-testid="ai-chat-settings-image-size"
                >
                  {IMAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ai-chat-settings-panel-field">
                <label
                  className="ai-chat-settings-panel-label"
                  htmlFor={`${panelId}-image-quality`}
                >
                  Качество изображения (image_quality)
                </label>
                <select
                  id={`${panelId}-image-quality`}
                  className="ai-chat-settings-panel-select"
                  value={settings.imageQuality || IMAGE_QUALITY_OPTIONS[0].value}
                  onChange={(event) => updateSetting({ imageQuality: event.target.value })}
                  data-testid="ai-chat-settings-image-quality"
                >
                  {IMAGE_QUALITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ai-chat-settings-panel-field">
                <label
                  className="ai-chat-settings-panel-label"
                  htmlFor={`${panelId}-response-format`}
                >
                  Как отдать результат (response_format)
                </label>
                <select
                  id={`${panelId}-response-format`}
                  className="ai-chat-settings-panel-select"
                  value={settings.responseFormat || RESPONSE_FORMAT_OPTIONS[0].value}
                  onChange={(event) => updateSetting({ responseFormat: event.target.value })}
                  data-testid="ai-chat-settings-response-format"
                >
                  {RESPONSE_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <p className="ai-chat-settings-panel-note">
                Отправка изображений будет доступна в следующем обновлении.
              </p>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
