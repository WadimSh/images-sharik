/**
 * @typedef {Object} MitupModel
 * @property {string} ai
 * @property {string} output_name
 * @property {boolean} out_text
 * @property {boolean} out_image
 * @property {boolean} [out_audio]
 * @property {boolean} [out_video]
 * @property {boolean} in_text
 * @property {boolean} in_image
 * @property {boolean} [in_audio]
 * @property {boolean} [in_video]
 * @property {string|null} ext
 * @property {string|null} best_for
 */

/**
 * @param {unknown} model
 * @returns {model is MitupModel}
 */
export function isMitupModelDetail(model) {
  return Boolean(model && typeof model === 'object' && model.output_name);
}

/**
 * @param {Array<MitupModel|string>|null|undefined} models
 * @returns {MitupModel[]}
 */
export function filterTextModels(models) {
  if (!Array.isArray(models)) return [];
  return models.filter((model) => isMitupModelDetail(model) && model.out_text === true);
}

/**
 * @param {Array<MitupModel|string>|null|undefined} models
 * @returns {MitupModel[]}
 */
export function filterImageModels(models) {
  if (!Array.isArray(models)) return [];
  return models.filter((model) => isMitupModelDetail(model) && model.out_image === true);
}

/**
 * @param {Array<MitupModel|string>|null|undefined} models
 * @returns {Record<string, MitupModel[]>}
 */
export function groupModelsByProvider(models) {
  if (!Array.isArray(models)) return {};

  return models.filter(isMitupModelDetail).reduce((acc, model) => {
    const provider = model.ai || 'Other';
    if (!acc[provider]) acc[provider] = [];
    acc[provider].push(model);
    return acc;
  }, {});
}

/**
 * @param {MitupModel|string|null|undefined} model
 * @returns {boolean}
 */
export function canAttachFromLibrary(model) {
  return isMitupModelDetail(model) && model.in_image === true;
}

/**
 * Форматы изображений в библиотеке Sharik.
 * Mitup `ext` может отставать от реальной поддержки (например, без webp).
 */
const LIBRARY_IMAGE_EXTENSIONS = new Set([
  'webp',
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'tiff',
  'avif',
  'svg',
]);

/**
 * @param {MitupModel|string|null|undefined} model
 * @param {string} fileName
 * @returns {boolean}
 */
export function isExtensionAllowed(model, fileName) {
  if (!isMitupModelDetail(model) || !model.in_image) return false;

  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return false;

  // Библиотека отдаёт image/*; не блокируем из‑за неполного списка Mitup ext.
  if (LIBRARY_IMAGE_EXTENSIONS.has(ext)) return true;

  if (!model.ext) return true;

  return model.ext
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .includes(ext);
}

/**
 * @param {MitupModel|string|null|undefined} model
 * @param {string} fileName
 * @returns {boolean} true, если расширение явно указано в Mitup ext
 */
export function isExtensionListedByMitup(model, fileName) {
  if (!isMitupModelDetail(model) || !model.ext) return true;

  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) return false;

  return model.ext
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .includes(ext);
}

/**
 * @param {MitupModel|string|null|undefined} model
 * @returns {{ label: string, hint: string, value: string }}
 */
export function getModelLabel(model) {
  if (typeof model === 'string') {
    return { label: model, hint: '', value: model };
  }

  if (!isMitupModelDetail(model)) {
    return { label: '—', hint: '', value: '' };
  }

  return {
    label: model.output_name,
    hint: model.best_for || '',
    value: model.output_name,
  };
}

/**
 * @param {Array<MitupModel|string>|null|undefined} models
 * @param {string|null|undefined} modelValue
 * @returns {MitupModel|null}
 */
export function findMitupModelByValue(models, modelValue) {
  if (!modelValue || !Array.isArray(models)) {
    return null;
  }

  return (
    models.find((model) => isMitupModelDetail(model) && model.output_name === modelValue) || null
  );
}

/**
 * @param {Array<MitupModel|string>|null|undefined} models
 * @param {'out_text'|'out_image'} outputType
 * @param {string|null|undefined} defaultModel
 * @returns {string}
 */
export function resolveDefaultModelValue(models, outputType, defaultModel) {
  if (!defaultModel) {
    return '';
  }

  const filtered = filterModelsByOutputType(models, outputType);
  return filtered.some((model) => getModelLabel(model).value === defaultModel) ? defaultModel : '';
}

/**
 * @param {Array<MitupModel|string>|null|undefined} models
 * @param {'out_text'|'out_image'} outputType
 * @returns {MitupModel[]}
 */
export function filterModelsByOutputType(models, outputType) {
  return outputType === 'out_image'
    ? filterImageModels(models)
    : filterTextModels(models);
}
