export const SHADOW_MODE = {
  AUTO: 'auto',
  CUSTOM: 'custom',
};

export const SHADOW_DEFAULT_OVERRIDES = {
  softnessOverride: 0.3,
  intensityOverride: 0.8,
  spreadOverride: 'medium',
  directionOverride: 'behindLeft',
  subjectPoseOverride: 'upright',
};

export const SHADOW_SPREAD_OPTIONS = [
  { value: 'short', label: 'Короткая (10°)' },
  { value: 'medium', label: 'Средняя (45°)' },
  { value: 'long', label: 'Длинная (90°)' },
];

export const SHADOW_DIRECTION_OPTIONS = [
  { value: 'behind', label: 'Сзади' },
  { value: 'behindLeft', label: 'Сзади слева' },
  { value: 'left', label: 'Слева' },
  { value: 'frontLeft', label: 'Спереди слева' },
  { value: 'front', label: 'Спереди' },
  { value: 'frontRight', label: 'Спереди справа' },
  { value: 'right', label: 'Справа' },
  { value: 'behindRight', label: 'Сзади справа' },
];

export const SHADOW_POSE_OPTIONS = [
  { value: 'flatlay', label: 'Лежит (flatlay)' },
  { value: 'upright', label: 'Стоит (upright)' },
];
