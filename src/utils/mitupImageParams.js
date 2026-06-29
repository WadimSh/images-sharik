import { findMitupModelByValue } from './mitupModels';

/** @param {string[]} ratios */
function toRatioOptions(ratios) {
  return ratios.map((value) => ({ value, label: value }));
}

const GEMINI_2_5_AND_3_PRO_SIZE_OPTIONS = toRatioOptions([
  '1:1',
  '2:3',
  '3:2',
  '3:4',
  '4:3',
  '4:5',
  '5:4',
  '9:16',
  '16:9',
  '21:9',
]);

const GEMINI_3_1_FLASH_SIZE_OPTIONS = toRatioOptions([
  '1:1',
  '1:4',
  '1:8',
  '2:3',
  '3:2',
  '3:4',
  '4:1',
  '4:3',
  '4:5',
  '5:4',
  '8:1',
  '9:16',
  '16:9',
  '21:9',
]);

const GEMINI_2_5_QUALITY_OPTIONS = [{ value: '1K', label: '1K' }];

const GEMINI_3_QUALITY_OPTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

/** @param {string[]} values */
function toPixelOptions(values) {
  return values.map((value) => ({
    value,
    label: value === 'auto' ? 'auto' : value.replace('x', '×'),
  }));
}

const GROK_SIZE_OPTIONS = toRatioOptions([
  'auto',
  '1:1',
  '2:1',
  '1:2',
  '3:2',
  '2:3',
  '3:4',
  '4:3',
  '16:9',
  '9:16',
  '20:9',
  '9:20',
]);

const GROK_QUALITY_OPTIONS = [
  { value: '1k', label: '1k' },
  { value: '2k', label: '2k' },
];

const OPENAI_CHAT_SIZE_OPTIONS = toPixelOptions([
  'auto',
  '1024x1024',
  '1536x1024',
  '1024x1536',
]);

const OPENAI_IMAGE_SIZE_OPTIONS = toPixelOptions([
  'auto',
  '1024x1024',
  '1536x1024',
  '1024x1536',
  '2048x2048',
  '2048x1152',
  '3840x2160',
  '2160x3840',
]);

const OPENAI_QUALITY_OPTIONS = [
  { value: 'auto', label: 'auto' },
  { value: 'low', label: 'low' },
  { value: 'medium', label: 'medium' },
  { value: 'high', label: 'high' },
];

const ASPECT_RATIO_SIZE_OPTIONS = GEMINI_2_5_AND_3_PRO_SIZE_OPTIONS;

const SEEDREAM_4_0_SIZE_OPTIONS = [
  { value: '1K', label: '1K' },
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

const SEEDREAM_4_5_SIZE_OPTIONS = [
  { value: '2K', label: '2K' },
  { value: '4K', label: '4K' },
];

const SEEDREAM_5_0_LITE_SIZE_OPTIONS = [
  { value: '2K', label: '2K' },
  { value: '3K', label: '3K' },
  { value: '4K', label: '4K' },
];

const YANDEX_PIXEL_SIZE_OPTIONS = OPENAI_CHAT_SIZE_OPTIONS;

const YANDEX_PIXEL_SIZE_OPTIONS_NO_AUTO = toPixelOptions([
  '1024x1024',
  '1536x1024',
  '1024x1536',
]);

const RATIO_TO_PIXEL = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
};

const PIXEL_TO_RATIO = {
  '1024x1024': '1:1',
  '1792x1024': '16:9',
  '1024x1792': '9:16',
};

/**
 * @typedef {'gemini'|'grok'|'seedream'|'yandex_art'|'yandex_alice'|'yandex_chat'|'no_image_params'|'openai_chat'|'openai_image'} MitupImageParamProfile
 * @typedef {{ sizes: Array<{value:string,label:string}>, qualities: Array<{value:string,label:string}>, includeQuality: boolean, mapSize: Function, mapQuality: Function }} MitupImageProfileConfig
 */

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
 * @param {RegExp} pattern
 * @returns {string[]|null}
 */
function readModelStringListByPattern(model, pattern) {
  if (!model || typeof model !== 'object') {
    return null;
  }

  for (const [key, value] of Object.entries(model)) {
    if (!pattern.test(key)) {
      continue;
    }

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

function readModelSizeList(model) {
  return readModelStringListByPattern(model, /image.?size|(^|_)sizes?($|_)/i);
}

function readModelQualityList(model) {
  return readModelStringListByPattern(model, /image.?quality|(^|_)qualities?($|_)/i);
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

function toUpperK(value) {
  const upper = String(value).trim().toUpperCase();
  if (upper === '1K' || upper === '2K' || upper === '3K' || upper === '4K') {
    return upper;
  }
  const lower = String(value).trim().toLowerCase();
  if (lower === 'standard' || lower === '1k') return '1K';
  if (lower === 'hd' || lower === '2k') return '2K';
  if (lower === '3k') return '3K';
  if (lower === '4k') return '4K';
  return '1K';
}

function toLowerK(value) {
  const lower = String(value).trim().toLowerCase();
  if (lower === '1k' || lower === '2k' || lower === '4k') {
    return lower;
  }
  if (lower === 'standard') return '1k';
  if (lower === 'hd') return '2k';
  const upper = String(value).trim().toUpperCase();
  if (upper === '1K') return '1k';
  if (upper === '2K') return '2k';
  if (upper === '4K') return '4k';
  return '1k';
}

function mapOpenAiQuality(value) {
  const lower = String(value ?? '').trim().toLowerCase();
  if (lower === 'auto' || lower === 'low' || lower === 'medium' || lower === 'high') {
    return lower;
  }
  if (lower === 'standard' || lower === '1k') return 'auto';
  if (lower === 'hd' || lower === '2k' || lower === '4k') return 'high';
  return 'auto';
}

function passThroughSize(value) {
  return value;
}

/** @type {Record<MitupImageParamProfile, MitupImageProfileConfig>} */
const IMAGE_PROFILES = {
  gemini: {
    sizes: ASPECT_RATIO_SIZE_OPTIONS,
    qualities: GEMINI_3_QUALITY_OPTIONS,
    includeQuality: true,
    mapSize: (value) => PIXEL_TO_RATIO[value] || value,
    mapQuality: toUpperK,
  },
  grok: {
    sizes: GROK_SIZE_OPTIONS,
    qualities: GROK_QUALITY_OPTIONS,
    includeQuality: true,
    mapSize: passThroughSize,
    mapQuality: toLowerK,
  },
  seedream: {
    sizes: SEEDREAM_4_0_SIZE_OPTIONS,
    qualities: [],
    includeQuality: false,
    mapSize: toUpperK,
    mapQuality: () => '',
  },
  yandex_art: {
    sizes: YANDEX_PIXEL_SIZE_OPTIONS,
    qualities: [],
    includeQuality: false,
    mapSize: passThroughSize,
    mapQuality: () => '',
  },
  yandex_alice: {
    sizes: YANDEX_PIXEL_SIZE_OPTIONS_NO_AUTO,
    qualities: OPENAI_QUALITY_OPTIONS,
    includeQuality: true,
    mapSize: passThroughSize,
    mapQuality: mapOpenAiQuality,
  },
  yandex_chat: {
    sizes: YANDEX_PIXEL_SIZE_OPTIONS,
    qualities: OPENAI_QUALITY_OPTIONS,
    includeQuality: true,
    mapSize: passThroughSize,
    mapQuality: mapOpenAiQuality,
  },
  no_image_params: {
    sizes: [],
    qualities: [],
    includeQuality: false,
    mapSize: () => '',
    mapQuality: () => '',
  },
  openai_chat: {
    sizes: OPENAI_CHAT_SIZE_OPTIONS,
    qualities: OPENAI_QUALITY_OPTIONS,
    includeQuality: true,
    mapSize: passThroughSize,
    mapQuality: mapOpenAiQuality,
  },
  openai_image: {
    sizes: OPENAI_IMAGE_SIZE_OPTIONS,
    qualities: OPENAI_QUALITY_OPTIONS,
    includeQuality: true,
    mapSize: passThroughSize,
    mapQuality: mapOpenAiQuality,
  },
};

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
function getSeedreamSizeOptions(model) {
  const apiId = getMitupModelApiId(model).toLowerCase();

  if (apiId.includes('5.0-lite') || apiId.includes('5-0-lite')) {
    return SEEDREAM_5_0_LITE_SIZE_OPTIONS;
  }

  if (apiId.includes('4.5') || apiId.includes('4-5')) {
    return SEEDREAM_4_5_SIZE_OPTIONS;
  }

  if (apiId.includes('4.0') || apiId.includes('4-0')) {
    return SEEDREAM_4_0_SIZE_OPTIONS;
  }

  return SEEDREAM_4_5_SIZE_OPTIONS;
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
function getGeminiSizeOptions(model) {
  const apiId = getMitupModelApiId(model).toLowerCase();

  if (apiId.includes('3.1-flash-image') || apiId.includes('3-1-flash-image')) {
    return GEMINI_3_1_FLASH_SIZE_OPTIONS;
  }

  if (apiId.includes('2.5-flash-image') || apiId.includes('2-5-flash-image')) {
    return GEMINI_2_5_AND_3_PRO_SIZE_OPTIONS;
  }

  if (apiId.includes('3-pro-image') || apiId.includes('3.0-pro-image')) {
    return GEMINI_2_5_AND_3_PRO_SIZE_OPTIONS;
  }

  return GEMINI_2_5_AND_3_PRO_SIZE_OPTIONS;
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
function getGeminiQualityOptions(model) {
  const apiId = getMitupModelApiId(model).toLowerCase();

  if (apiId.includes('2.5-flash-image') || apiId.includes('2-5-flash-image')) {
    return GEMINI_2_5_QUALITY_OPTIONS;
  }

  return GEMINI_3_QUALITY_OPTIONS;
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {boolean}
 */
export function modelSupportsImageQuality(model) {
  return getProfileConfig(detectImageParamProfile(model)).includeQuality;
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {MitupImageParamProfile}
 */
export function detectImageParamProfile(model) {
  const apiId = getMitupModelApiId(model).toLowerCase();
  const provider = typeof model === 'object' && model?.ai ? String(model.ai).toLowerCase() : '';

  if (/gemini-/.test(apiId) && apiId.includes('image')) {
    return 'gemini';
  }

  if (/seedream-/.test(apiId) || provider.includes('bytedance')) {
    return 'seedream';
  }

  if (/grok-imagine/.test(apiId) || (provider.includes('grok') && apiId.includes('imagine'))) {
    return 'grok';
  }

  if (/gigachat/.test(apiId) || provider.includes('gigachat') || provider.includes('sber')) {
    return 'no_image_params';
  }

  if (/alice-ai-art/.test(apiId) || (provider.includes('yandex') && apiId.includes('-art'))) {
    return 'yandex_art';
  }

  if (/alice-ai-flash/.test(apiId)) {
    return 'yandex_chat';
  }

  if (/^alice-ai$/i.test(apiId)) {
    return 'yandex_alice';
  }

  if (/yandex-gpt-(lite|pro)/.test(apiId)) {
    return 'yandex_chat';
  }

  if (provider.includes('yandex')) {
    if (apiId.includes('art')) {
      return 'yandex_art';
    }
    return 'yandex_chat';
  }

  if (/gpt-image|dall-e/.test(apiId)) {
    return 'openai_image';
  }

  if (/^gpt-/.test(apiId) || (provider.includes('openai') && !apiId.includes('image'))) {
    return 'openai_chat';
  }

  return 'grok';
}

function getProfileConfig(profile) {
  return IMAGE_PROFILES[profile] || IMAGE_PROFILES.grok;
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
export function getImageSizeOptionsForModel(model) {
  const fromModel = readModelSizeList(model);
  const profile = detectImageParamProfile(model);

  if (profile === 'seedream') {
    return toSelectOptions(fromModel, getSeedreamSizeOptions(model));
  }

  if (profile === 'gemini') {
    return toSelectOptions(fromModel, getGeminiSizeOptions(model));
  }

  return toSelectOptions(fromModel, getProfileConfig(profile).sizes);
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @returns {Array<{ value: string, label: string }>}
 */
export function getImageQualityOptionsForModel(model) {
  const profile = detectImageParamProfile(model);
  const config = getProfileConfig(profile);

  if (!config.includeQuality) {
    return [];
  }

  const fromModel = readModelQualityList(model);

  if (profile === 'gemini') {
    return toSelectOptions(fromModel, getGeminiQualityOptions(model));
  }

  return toSelectOptions(fromModel, config.qualities);
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

function pickQualityOptionValue(value, options, mapQuality) {
  if (!options.length) {
    return mapQuality(value);
  }

  const mappedInput = mapQuality(value);
  const matched = options.find((option) => mapQuality(option.value) === mappedInput);
  if (matched) {
    return mapQuality(matched.value);
  }

  if (value && options.some((option) => option.value === value)) {
    return mapQuality(value);
  }

  return mapQuality(options[0].value);
}

/**
 * @param {object} settings
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 */
export function normalizeImageSettingsForModel(settings, model) {
  if (settings.outputType !== 'out_image') {
    return settings;
  }

  const profile = detectImageParamProfile(model);
  const config = getProfileConfig(profile);
  const sizeOptions = getImageSizeOptionsForModel(model);
  const qualityOptions = getImageQualityOptionsForModel(model);

  if (profile === 'no_image_params') {
    const normalized = { ...settings };
    delete normalized.imageSize;
    delete normalized.imageQuality;
    return normalized;
  }

  const imageSize = pickOptionValue(settings.imageSize, sizeOptions);
  const normalized = {
    ...settings,
    imageSize,
  };

  if (config.includeQuality) {
    normalized.imageQuality = pickQualityOptionValue(
      settings.imageQuality,
      qualityOptions,
      config.mapQuality
    );
  } else {
    delete normalized.imageQuality;
  }

  return normalized;
}

/**
 * @param {import('./mitupModels').MitupModel|string|null|undefined} model
 * @param {{ imageSize?: string, imageQuality?: string }} settings
 * @returns {{ image_size?: string, image_quality?: string }}
 */
export function buildMitupImageAiParams(model, settings = {}) {
  const profile = detectImageParamProfile(model);

  if (profile === 'no_image_params') {
    return {};
  }

  const config = getProfileConfig(profile);
  const sizeOptions = getImageSizeOptionsForModel(model);
  const qualityOptions = getImageQualityOptionsForModel(model);

  const image_size = config.mapSize(pickOptionValue(settings.imageSize, sizeOptions));
  const params = {
    ...(image_size ? { image_size } : {}),
  };

  if (config.includeQuality) {
    const image_quality = pickQualityOptionValue(
      settings.imageQuality,
      qualityOptions,
      config.mapQuality
    );
    if (image_quality) {
      params.image_quality = image_quality;
    }
  }

  return params;
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

/** @deprecated */
export function normalizeImageQualityValue(value) {
  return toUpperK(value);
}

export const DEFAULT_IMAGE_QUALITY_OPTIONS = GEMINI_3_QUALITY_OPTIONS;
