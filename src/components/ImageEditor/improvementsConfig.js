import { FiSun, FiMaximize, FiLayers, FiRefreshCw, FiPackage, FiHome, FiUser, FiImage, FiMaximize2 } from 'react-icons/fi';

export const AI_UPSCALE_FAST_MAX = 1000;

export function isUpscaleAvailable(width, height) {
  return (
    width > 0 &&
    height > 0 &&
    width <= AI_UPSCALE_FAST_MAX &&
    height <= AI_UPSCALE_FAST_MAX
  );
}

export const UPSCALE_DISABLED_REASON = `Доступно для изображений до ${AI_UPSCALE_FAST_MAX}×${AI_UPSCALE_FAST_MAX} px`;

export const IMPROVEMENTS = [
  {
    id: 'upscale',
    label: 'Увеличить разрешение',
    description: 'более чёткое изображение',
    icon: FiMaximize,
  },
  {
    id: 'uncrop',
    label: 'Восстановить недостающее',
    description: 'достройка обрезанных краёв',
    icon: FiRefreshCw,
  },
  {
    id: 'shadow',
    label: 'Задать тень',
    description: 'мягкая тень под объектом',
    icon: FiLayers,
  },
  {
    id: 'lighting',
    label: 'Изменить освещённость',
    description: 'естественная коррекция света',
    icon: FiSun,
  },
  {
    id: 'expand',
    label: 'Увеличение изображения',
    description: 'расширение полотна с заполнением краёв',
    icon: FiMaximize2,
  },
];

export const PRODUCT_SHOWCASE = [
  {
    id: 'createBackground',
    label: 'Создать фон',
    description: 'AI-генерация нового фона',
    icon: FiImage,
  },
  {
    id: 'catalogStudio',
    label: 'Каталог (студийно)',
    description: 'чистый объект на нейтральном фоне',
    icon: FiPackage,
  },
  {
    id: 'lifestyleEnvironment',
    label: 'В окружении',
    description: 'нейтральный живой фон',
    icon: FiHome,
  },
  {
    id: 'lifestyleInUse',
    label: 'В использовании',
    description: 'контекст применения',
    icon: FiUser,
  },
];
