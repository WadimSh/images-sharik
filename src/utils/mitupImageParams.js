import { findMitupModelByValue } from './mitupModels';

const ASPECT_RATIO_SIZE_OPTIONS = [
  { value: '1:1', label: 'Квадрат (1:1)' },
  { value: '16:9', label: 'Широкий (16:9)' },
  { value: '9:16', label: 'Вертикальный (9:16)' },
  { value: '4:3', label: '4:3' },
  { value: '3:4', label: '3:4' },
  { value: '4:5', label: '4:5' },
  { value: '5:4', label: '5:4' },
  { value: '21:9', label: '21:9' },
];

const PIXEL_SIZE_OPTIONS = [
  { value: '1024x1024', label: '1024×1024' },
  { value: '1792x1024', label: '1792×1024' },
  { value: '1024x1792', label: '1024×1792' },
];

const FLASH_QUALITY_OPTIONS = [
  { value: '1k', label: 'Стандартное (1k)' },
  { value: '2k', label: 'Высокое (2k)' },
];

const PRO_QUALITY_OPTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

const OPENAI_QUALITY_OPTIONS = [
  { value: 'standard', label: 'Обычное (standard)' },
  { value: 'hd', label: 'Высокое (hd)' },
];

const LEGACY_SIZE_TO_RATIO = {
  '1024x1024': '1:1',
  '1792x1024': '16:9',
  '1024x1792': '9:16',
};

const LEGACY_QUALITY_MAP = {
  standard: 'standard',
  hd: 'hd',
  '1k': '1k',
  '2k': '2k',
  '1K': '1K',
  '2K': '2K',
  '4K': '4K',
};

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {string}
 */
export function getMitupModelApiId(model) {
  if (typeof model === 'string') {
    return model.trim();
  }

  if (!model || typeof model !== 'object') {
    return '';
  }

  if (typeof model.model === 'string' && model.model.trim()) {
    return model.model.trim();
  }

  return model.output_name?.trim() || '';
}

/**
 * @param {unknown} model
 * @param {string[]} keys
 * @returns {string[]|null}
 */
function readModelStringList(model, keys) {
  if (!model || typeof model !== 'object') {
    return null;
  }

  for (const key of keys) {
    const value = model[key];
    if (Array.isArray(value) && value.length > 0) {
      return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string' && value.trim()) {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return null;
}

/**
 * @param {string[]} values
 * @param {Array<{ value: string, label: string }>} fallbackOptions
 * @returns {Array<{ value: string, label: string }>}
 */
function toSelectOptions(values, fallbackOptions) {
  if (!values?.length) {
    return fallbackOptions;
  }

  return values.map((value) => ({
    value,
    label: value,
  }));
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {'openai_pixels'|'gemini_pro_resolution'|'gemini_flash_ratio'}
 */
export function detectImageParamProfile(model) {
  const apiId = getMitupModelApiId(model).toLowerCase();

  if (/gpt-image|dall-e|grok-2-image|grok-imagine/.test(apiId)) {
    return 'openai_pixels';
  }

  if (/gemini-3-pro-image|gemini-3\.1-pro-image|gemini-3-pro-image-preview|nano-banana-pro/.test(apiId)) {
    return 'gemini_pro_resolution';
  }

  if (/gemini-.*-image|gemini-.*-flash-image/.test(apiId)) {
    return 'gemini_flash_ratio';
  }

  return 'gemini_flash_ratio';
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
export function getImageSizeOptionsForModel(model) {
  const fromModel = readModelStringList(model, [
    'image_sizes',
    'image_size_list',
    'image_size_options',
    'sizes',
  ]);

  const profile = detectImageParamProfile(model);
  const fallback = profile === 'openai_pixels' ? PIXEL_SIZE_OPTIONS : ASPECT_RATIO_SIZE_OPTIONS;
  return toSelectOptions(fromModel, fallback);
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
export function getImageQualityOptionsForModel(model) {
  const fromModel = readModelStringList(model, [
    'image_qualities',
    'image_quality_list',
    'image_quality_options',
    'qualities',
  ]);

  const profile = detectImageParamProfile(model);
  const fallback =
    profile === 'openai_pixels'
      ? OPENAI_QUALITY_OPTIONS
      : profile === 'gemini_pro_resolution'
        ? PRO_QUALITY_OPTIONS
        : FLASH_QUALITY_OPTIONS;

  return toSelectOptions(fromModel, fallback);
}

/**
 * @param {string|undefined} value
 * @param {Array<{ value: string }>} options
 * @returns {string}
 */
function pickOptionValue(value, options) {
  if (!options.length) {
    return value || '';
  }

  if (value && options.some((option) => option.value === value)) {
    return value;
  }

  return options[0].value;
}

/**
 * @param {object} settings
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 */
export function normalizeImageSettingsForModel(settings, model) {
  if (settings.outputType !== 'out_image') {
    return settings;
  }

  const sizeOptions = getImageSizeOptionsForModel(model);
  const qualityOptions = getImageQualityOptionsForModel(model);

  return {
    ...settings,
    imageSize: pickOptionValue(settings.imageSize, sizeOptions),
    imageQuality: pickOptionValue(settings.imageQuality, qualityOptions),
  };
}

/**
 * @param {string|undefined} value
 * @param {'openai_pixels'|'gemini_pro_resolution'|'gemini_flash_ratio'} profile
 * @param {Array<{ value: string }>} options
 * @returns {string|undefined}
 */
function mapImageSizeForApi(value, profile, options) {
  const selected = pickOptionValue(value, options);

  if (profile === 'openai_pixels') {
    return selected;
  }

  return LEGACY_SIZE_TO_RATIO[selected] || selected;
}

/**
 * @param {string|undefined} value
 * @param {'openai_pixels'|'gemini_pro_resolution'|'gemini_flash_ratio'} profile
 * @param {Array<{ value: string }>} options
 * @returns {string|undefined}
 */
function mapImageQualityForApi(value, profile, options) {
  const selected = pickOptionValue(value, options);
  const normalizedLegacy = LEGACY_QUALITY_MAP[selected] || selected;

  if (profile === 'openai_pixels') {
    if (normalizedLegacy === '1k') return 'standard';
    if (normalizedLegacy === '2k') return 'hd';
    return normalizedLegacy;
  }

  if (profile === 'gemini_pro_resolution') {
    const upper = String(normalizedLegacy).toUpperCase();
    if (upper === '1K' || upper === '2K' || upper === '4K') {
      return upper;
    }
    if (normalizedLegacy === 'standard' || normalizedLegacy === '1k') return '1K';
    if (normalizedLegacy === 'hd' || normalizedLegacy === '2k') return '2K';
    return '1K';
  }

  return String(normalizedLegacy).toLowerCase();
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @param {{ imageSize?: string, imageQuality?: string }} settings
 * @returns {{ image_size?: string, image_quality?: string }}
 */
export function buildMitupImageAiParams(model, settings = {}) {
  const profile = detectImageParamProfile(model);
  const sizeOptions = getImageSizeOptionsForModel(model);
  const qualityOptions = getImageQualityOptionsForModel(model);

  const image_size = mapImageSizeForApi(settings.imageSize, profile, sizeOptions);
  const image_quality = mapImageQualityForApi(settings.imageQuality, profile, qualityOptions);

  return {
    ...(image_size ? { image_size } : {}),
    ...(image_quality ? { image_quality } : {}),
  };
}

/**
 * @param {Array<object|string>|null|undefined} models
 * @param {string|undefined} modelValue
 * @param {{ imageSize?: string, imageQuality?: string }} settings
 */
export function buildMitupImageAiParamsForModelValue(models, modelValue, settings = {}) {
  const model = findMitupModelByValue(models, modelValue) || modelValue;
  return buildMitupImageAiParams(model, settings);
}
