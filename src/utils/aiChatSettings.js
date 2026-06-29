import { filterModelsByOutputType, findMitupModelByValue, getModelLabel } from './mitupModels';
import {
  getImageQualityOptionsForModel,
  getImageSizeOptionsForModel,
  normalizeImageSettingsForModel,
} from './mitupImageParams';

export const DEFAULT_TEMPERATURE = 0.9;
export const DEFAULT_TOP_P = 1;
export const DEFAULT_OUTPUT_TYPE = 'out_text';

export {
  getImageQualityOptionsForModel,
  getImageSizeOptionsForModel,
  normalizeImageSettingsForModel,
} from './mitupImageParams';

/** @deprecated Используйте getImageSizeOptionsForModel(selectedModel) */
export const IMAGE_SIZE_OPTIONS = getImageSizeOptionsForModel(null);

/** @deprecated Используйте getImageQualityOptionsForModel(selectedModel) */
export const IMAGE_QUALITY_OPTIONS = getImageQualityOptionsForModel(null);

export const RESPONSE_FORMAT_OPTIONS = [
  { value: 'url', label: 'Ссылка на файл (url)' },
  { value: 'b64_json', label: 'Base64-код (b64_json)' },
];

/**
 * @returns {import('./mitupLogPayload').MitupAiSettings & { outputType: 'out_text'|'out_image', model: string }}
 */
export function createDefaultAiSettings() {
  const defaultSizeOptions = getImageSizeOptionsForModel(null);
  const defaultQualityOptions = getImageQualityOptionsForModel(null);

  return {
    outputType: DEFAULT_OUTPUT_TYPE,
    model: '',
    temperature: DEFAULT_TEMPERATURE,
    topP: DEFAULT_TOP_P,
    thinking: false,
    webSearch: false,
    imageSize: defaultSizeOptions[0]?.value || '1:1',
    imageQuality: defaultQualityOptions[0]?.value || '1k',
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
    const selectedModel = findMitupModelByValue(models, base.model);
    return normalizeImageSettingsForModel(
      {
        ...base,
        thinking: false,
        webSearch: false,
        responseFormat: settings.responseFormat || RESPONSE_FORMAT_OPTIONS[0].value,
      },
      selectedModel
    );
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
