import { filterModelsByOutputType, getModelLabel } from './mitupModels';

export const DEFAULT_TEMPERATURE = 0.9;
export const DEFAULT_TOP_P = 1;
export const DEFAULT_OUTPUT_TYPE = 'out_text';

export const IMAGE_SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024' },
  { value: '1792x1024', label: '1792×1024' },
  { value: '1024x1792', label: '1024×1792' },
];

export const IMAGE_QUALITY_OPTIONS = [
  { value: 'standard', label: 'Обычное (standard)' },
  { value: 'hd', label: 'Высокое (hd)' },
];

export const RESPONSE_FORMAT_OPTIONS = [
  { value: 'url', label: 'Ссылка на файл (url)' },
  { value: 'b64_json', label: 'Base64-код (b64_json)' },
];

/**
 * @returns {import('./mitupLogPayload').MitupAiSettings & { outputType: 'out_text'|'out_image', model: string }}
 */
export function createDefaultAiSettings() {
  return {
    outputType: DEFAULT_OUTPUT_TYPE,
    model: '',
    temperature: DEFAULT_TEMPERATURE,
    topP: DEFAULT_TOP_P,
    thinking: false,
    webSearch: false,
    imageSize: IMAGE_SIZE_OPTIONS[0].value,
    imageQuality: IMAGE_QUALITY_OPTIONS[0].value,
    responseFormat: RESPONSE_FORMAT_OPTIONS[0].value,
  };
}

/**
 * @param {object} settings
 * @param {'out_text'|'out_image'} outputType
 * @param {Array<object|string>} models
 */
export function normalizeAiSettingsForOutputType(settings, outputType, models) {
  const filteredModels = filterModelsByOutputType(models, outputType);
  const modelStillValid = filteredModels.some(
    (model) => getModelLabel(model).value === settings.model
  );

  const base = {
    ...settings,
    outputType,
    model: modelStillValid ? settings.model : '',
    temperature: settings.temperature ?? DEFAULT_TEMPERATURE,
    topP: settings.topP ?? DEFAULT_TOP_P,
  };

  if (outputType === 'out_image') {
    return {
      ...base,
      thinking: false,
      webSearch: false,
      imageSize: settings.imageSize || IMAGE_SIZE_OPTIONS[0].value,
      imageQuality: settings.imageQuality || IMAGE_QUALITY_OPTIONS[0].value,
      responseFormat: settings.responseFormat || RESPONSE_FORMAT_OPTIONS[0].value,
    };
  }

  return {
    ...base,
    thinking: Boolean(settings.thinking),
    webSearch: Boolean(settings.webSearch),
  };
}

/**
 * @param {number|string} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clampSettingNumber(value, min, max) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return min;
  }

  return Math.min(max, Math.max(min, parsed));
}

/**
 * @param {Array<object>|null|undefined} messages
 * @returns {'out_text'|'out_image'|null}
 */
export function inferOutputTypeFromMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return null;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role !== 'assistant') {
      continue;
    }

    const type = message?.generation?.type;
    if (type === 'out_text' || type === 'out_image') {
      return type;
    }
  }

  return null;
}
