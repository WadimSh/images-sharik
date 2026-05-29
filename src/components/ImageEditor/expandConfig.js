export const EXPAND_MAX_SIDE = 5000;
export const EXPAND_MAX_FILE_SIZE = 30 * 1024 * 1024;

export const EXPAND_SOURCE_DISABLED_REASON =
  `Доступно для изображений до ${EXPAND_MAX_SIDE} px по длинной стороне и до 30 МБ`;

export const EXPAND_OUTPUT_INVALID_REASON =
  `Размер результата не должен превышать ${EXPAND_MAX_SIDE} px по длинной стороне`;

export const EXPAND_ASPECT_RATIOS = [
  { id: '1:1', label: '1:1', ratio: 1, defaultWidth: 2000, defaultHeight: 2000 },
  { id: '3:4', label: '3:4', ratio: 3 / 4, defaultWidth: 1500, defaultHeight: 2000 },
  { id: 'free', label: 'Свободно', ratio: null, defaultWidth: 2000, defaultHeight: 2000 },
];

export const EXPAND_FREE_ASPECT_ID = 'free';

export function isExpandFreeAspect(aspectId) {
  return aspectId === EXPAND_FREE_ASPECT_ID;
}

export function isExpandSourceAvailable(width, height) {
  if (width <= 0 || height <= 0) return false;
  return Math.max(width, height) <= EXPAND_MAX_SIDE;
}

export function isExpandOutputValid(width, height) {
  if (width <= 0 || height <= 0) return false;
  return Math.max(width, height) <= EXPAND_MAX_SIDE;
}

export function getHeightForWidth(width, ratio) {
  return Math.max(1, Math.round(width / ratio));
}

export function getWidthForHeight(height, ratio) {
  return Math.max(1, Math.round(height * ratio));
}

export function getDefaultDimensions(aspectId) {
  const aspect = EXPAND_ASPECT_RATIOS.find((item) => item.id === aspectId)
    || EXPAND_ASPECT_RATIOS[0];

  return {
    width: aspect.defaultWidth,
    height: aspect.defaultHeight,
    ratio: aspect.ratio,
  };
}
