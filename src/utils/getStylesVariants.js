import { STYLE_VARIANTS } from "../constants/styleVariants";

export const getStyleDisplayName = (styleId) => {
  return STYLE_VARIANTS[styleId]?.name || `${styleId}`;
};

export const getStyleIcon = (styleId) => {
  return STYLE_VARIANTS[styleId]?.icon || <div style={{ width: 16, height: 16 }} />;
};