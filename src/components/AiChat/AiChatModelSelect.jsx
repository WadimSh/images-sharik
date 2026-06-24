import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { HiOutlineChevronDown } from 'react-icons/hi2';

import {
  filterModelsByOutputType,
  getModelLabel,
  groupModelsByProvider,
} from '../../utils/mitupModels';
import './AiChatModelSelect.css';

/**
 * @param {object} props
 * @param {Array<object|string>} props.models
 * @param {string} props.value
 * @param {Function} props.onChange
 * @param {boolean} [props.disabled]
 * @param {'out_text'|'out_image'} [props.outputType]
 */
export function AiChatModelSelect({
  models,
  value,
  onChange,
  disabled = false,
  outputType = 'out_text',
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  const filteredModels = useMemo(
    () => filterModelsByOutputType(models, outputType),
    [models, outputType]
  );

  const groupedModels = useMemo(
    () => groupModelsByProvider(filteredModels),
    [filteredModels]
  );

  const providerNames = useMemo(
    () => Object.keys(groupedModels).sort((left, right) => left.localeCompare(right, 'ru')),
    [groupedModels]
  );

  const selectedModel = useMemo(
    () => filteredModels.find((model) => getModelLabel(model).value === value),
    [filteredModels, value]
  );
  const selectedMeta = selectedModel ? getModelLabel(selectedModel) : null;

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

  const handleSelect = (modelValue) => {
    onChange(modelValue);
    setOpen(false);
  };

  if (filteredModels.length === 0) {
    return (
      <div className="ai-chat-model-select ai-chat-model-select--empty">
        <span className="ai-chat-model-select-trigger ai-chat-model-select-trigger--disabled">
          Нет моделей
        </span>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`ai-chat-model-select${open ? ' ai-chat-model-select--open' : ''}${
        disabled ? ' ai-chat-model-select--disabled' : ''
      }`}
    >
      <button
        type="button"
        id="ai-chat-model"
        className="ai-chat-model-select-trigger"
        aria-label="Модель"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev);
          }
        }}
        data-testid="ai-chat-model-select-trigger"
      >
        <span className="ai-chat-model-select-trigger-label">
          {selectedMeta?.label || 'Выберите модель'}
        </span>
        <HiOutlineChevronDown className="ai-chat-model-select-trigger-icon" aria-hidden="true" />
      </button>

      {open ? (
        <ul
          id={listId}
          className="ai-chat-model-select-menu"
          role="listbox"
          aria-label="Модель"
        >
          {providerNames.map((provider) => (
            <li key={provider} role="presentation" className="ai-chat-model-select-group">
              <div className="ai-chat-model-select-group-label" aria-hidden="true">
                {provider}
              </div>
              <ul className="ai-chat-model-select-group-list" role="group" aria-label={provider}>
                {groupedModels[provider].map((model) => {
                  const { label, hint, value: modelValue } = getModelLabel(model);
                  const isSelected = modelValue === value;

                  return (
                    <li key={modelValue} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={`ai-chat-model-select-option${
                          isSelected ? ' ai-chat-model-select-option--selected' : ''
                        }`}
                        onClick={() => handleSelect(modelValue)}
                        data-testid={`ai-chat-model-option-${modelValue}`}
                      >
                        <span className="ai-chat-model-select-option-label">{label}</span>
                        {hint ? (
                          <span className="ai-chat-model-select-option-hint">{hint}</span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
